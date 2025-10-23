import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .models import Room, Message, JoinRequest
from .serializers import MessageSerializer
from .utils import get_user_from_token
from django.utils import timezone
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        """
        Query params: ?token=<JWT>&room_id=<id>
        """
        params = self.scope.get("query_string", b"").decode()
        qs = dict([kv.split("=") for kv in params.split("&") if "=" in kv]) if params else {}
        token = qs.get("token")
        room_id = qs.get("room_id")
        user = None
        if token:
            user = await sync_to_async(get_user_from_token)(token)
        if not user:
            await self.close()
            return
        self.user = user
        self.room_id = room_id
        self.room_group_name = f"chat_{room_id}"
        # check if user is host or approved participant
        room = await sync_to_async(Room.objects.filter(id=room_id).first)()
        if not room:
            await self.close()
            return
        allowed = False
        if room.host_id == user.id or await sync_to_async(room.participants.filter(id=user.id).exists)():
            allowed = True
        # If user is not participant and not host, deny connect (they should be approved first)
        if not allowed:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Broadcast join system message
        await sync_to_async(Message.objects.create)(room=room, sender=None, content=f"{user.username} has joined.", message_type="system")
        await self.channel_layer.group_send(self.room_group_name, {
            "type": "system.message",
            "message": f"{user.username} joined the room.",
            "timestamp": timezone.now().isoformat(),
        })

    async def disconnect(self, close_code):
        # leave group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        # if host left, optionally deactivate room
        room = await sync_to_async(Room.objects.filter(id=self.room_id).first)()
        if room and room.host_id == self.user.id:
            room.is_active = False
            await sync_to_async(room.save)()
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "system.message",
                "message": f"Host {self.user.username} left. Room closed.",
                "timestamp": timezone.now().isoformat(),
            })
        else:
            # participant left
            await sync_to_async(Message.objects.create)(room=room, sender=None, content=f"{self.user.username} has left.", message_type="system")

    async def receive_json(self, content):
        """
        Expected message structure:
        {
            "type": "chat_message",
            "content": "Hello world"
        }
        """
        msg_type = content.get("type")
        if msg_type == "chat_message":
            text = content.get("content","")
            # persist message
            room = await sync_to_async(Room.objects.get)(id=self.room_id)
            msg = await sync_to_async(Message.objects.create)(room=room, sender=self.user, content=text, message_type="text")
            ser = MessageSerializer(msg)
            await self.channel_layer.group_send(self.room_group_name, {
                "type": "chat.message",
                "message": ser.data,
            })
        # you can support 'typing' and other events here

    async def chat_message(self, event):
        await self.send_json({"type": "chat_message", "message": event["message"]})

    async def system_message(self, event):
        await self.send_json({"type": "system", "message": event["message"], "timestamp": event.get("timestamp")})
