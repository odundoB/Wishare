from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Room, JoinRequest, Message
from .serializers import (
    RoomSerializer,
    CreateRoomSerializer,
    JoinRequestSerializer,
    MessageSerializer
)
from .permissions import IsTeacher, IsHostOrReadOnly, CanCreateRoom
from notifications.utils import NotificationManager


# 🟢 1. List all active rooms
class RoomListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RoomSerializer

    def get_queryset(self):
        return Room.objects.filter(is_active=True).order_by("-created_at")


# 🟢 2. Create a room (Teachers and Students)
class RoomCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, CanCreateRoom]
    serializer_class = CreateRoomSerializer

    def perform_create(self, serializer):
        """
        Assign host and set default room settings based on user role.
        Teachers can create class rooms, students create study groups.
        """
        user = self.request.user
        
        # Set default room type and settings based on user role
        if user.role == 'teacher':
            # Teachers create class rooms with higher limits
            room_data = {
                'room_type': serializer.validated_data.get('room_type', 'class'),
                'public': serializer.validated_data.get('public', True),
                'auto_approve': serializer.validated_data.get('auto_approve', False),  # Teachers can choose
                'max_participants': serializer.validated_data.get('max_participants', 100)
            }
        else:
            # Only teachers should reach this point due to permission check
            raise PermissionError("Only teachers can create rooms")
        
        # Merge with original validated data
        for key, value in room_data.items():
            serializer.validated_data[key] = value
            
        serializer.save(host=user)


# 🟢 3. Request to join a room
class JoinRoomRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id, is_active=True)

        # Check if user is already a participant
        if room.participants.filter(id=request.user.id).exists():
            return Response(
                {"detail": "You are already a participant."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if room is full
        if room.participants.count() >= room.max_participants:
            return Response(
                {"detail": "Room is full."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if there's already a pending request
        existing_request = JoinRequest.objects.filter(room=room, requester=request.user).first()
        
        if existing_request:
            if existing_request.status == 'pending':
                return Response(
                    {"detail": "You already have a pending join request for this room. Please wait for the host to approve your request. ⏳"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_request.status == 'denied':
                return Response(
                    {"detail": "Your previous join request for this room was denied. Contact the host if you believe this was a mistake."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_request.status == 'approved':
                # This should not happen if the participant check above works correctly
                return Response(
                    {"detail": "You have already been approved for this room. Please refresh the page."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Auto-approve if room has auto_approve enabled
        if room.auto_approve:
            # Add user directly to participants
            room.participants.add(request.user)
            
            # Create approved join request record
            join_request = JoinRequest.objects.create(
                room=room, 
                requester=request.user,
                status='approved'
            )
            
            return Response(
                {
                    "detail": "Joined room successfully! 🎉",
                    "status": "approved",
                    "room": RoomSerializer(room).data
                },
                status=status.HTTP_200_OK
            )
        else:
            # Create pending join request for manual approval
            join_request, created = JoinRequest.objects.get_or_create(
                room=room, 
                requester=request.user,
                defaults={'status': 'pending'}
            )
            
            # Send notification to room host about join request
            if created:  # Only send notification for new requests
                try:
                    NotificationManager.notify_chat_join_request(room, request.user)
                except Exception as e:
                    # Log error but don't fail the request
                    print(f"Failed to send join request notification: {e}")
            
            serializer = JoinRequestSerializer(join_request)
            return Response(
                {
                    "detail": "Join request sent! The room host will be notified. 📨",
                    "status": "pending",
                    **serializer.data
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )


# 🟢 4. Approve join request (Host only)
class ApproveJoinRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        if room.host != request.user:
            return Response(
                {"detail": "Only the host can approve requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        req_id = request.data.get("request_id")
        join_request = get_object_or_404(JoinRequest, id=req_id, room=room)

        if join_request.status != "pending":
            return Response(
                {"detail": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if room.participants.count() >= room.max_participants:
            return Response(
                {"detail": "Room is full, cannot approve more participants."},
                status=status.HTTP_400_BAD_REQUEST
            )

        join_request.status = "approved"
        join_request.save()

        room.participants.add(join_request.requester)
        Message.objects.create(
            room=room,
            sender=None,
            content=f"{join_request.requester.username} has joined the room.",
            message_type="system"
        )

        # Send notification to approved user
        try:
            NotificationManager.notify_chat_join_approved(room, join_request.requester, request.user)
        except Exception as e:
            # Log error but don't fail the request
            print(f"Failed to send approval notification: {e}")

        return Response({"detail": "Join request approved successfully."}, status=status.HTTP_200_OK)


# 🟢 5. Deny join request (Host only)
class DenyJoinRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        if room.host != request.user:
            return Response(
                {"detail": "Only the host can deny requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        req_id = request.data.get("request_id")
        join_request = get_object_or_404(JoinRequest, id=req_id, room=room)

        if join_request.status != "pending":
            return Response(
                {"detail": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        join_request.status = "denied"
        join_request.save()

        return Response({"detail": "Join request denied."}, status=status.HTTP_200_OK)


# 🟢 6. Remove a participant (Host only)
class RemoveParticipantView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)

        if room.host != request.user:
            return Response(
                {"detail": "Only the host can remove participants."},
                status=status.HTTP_403_FORBIDDEN
            )

        user_id = request.data.get("user_id")
        if not user_id:
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        room.participants.remove(user_id)
        Message.objects.create(
            room=room,
            sender=None,
            content=f"User ID {user_id} was removed by the host.",
            message_type="system"
        )

        return Response({"detail": "Participant removed successfully."}, status=status.HTTP_200_OK)


# 🟢 7. List recent messages in a room
class RoomMessagesView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        room_id = self.kwargs["room_id"]
        room = get_object_or_404(Room, id=room_id)

        user = self.request.user
        if not (room.host == user or room.participants.filter(id=user.id).exists()):
            return Message.objects.none()

        # Return latest 100 messages (newest first)
        return room.messages.order_by("-timestamp")[:100]


# 🟢 8. Get current user's join requests
class MyJoinRequestsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = JoinRequestSerializer

    def get_queryset(self):
        return JoinRequest.objects.filter(requester=self.request.user).order_by("-created_at")
