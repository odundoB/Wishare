from rest_framework import serializers
from .models import Room, JoinRequest, Message
from users.serializers import UserDetailSerializer as UserSerializer


class RoomSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = (
            "id",
            "name",
            "description",
            "host",
            "participants",
            "room_type",
            "is_active",
            "public",
            "auto_approve",
            "max_participants",
            "allow_file_uploads",
            "allow_voice_messages",
            "created_at",
        )
        read_only_fields = ("id", "host", "participants", "is_active", "created_at")


class CreateRoomSerializer(serializers.ModelSerializer):
    """
    Serializer used when creating a new room.
    Host is assigned in the view.
    Room type and settings are set based on user role.
    """

    allow_file_uploads = serializers.BooleanField(default=True)
    allow_voice_messages = serializers.BooleanField(default=True)
    auto_approve = serializers.BooleanField(default=False)
    room_type = serializers.ChoiceField(choices=Room.ROOM_TYPE_CHOICES, required=False)

    class Meta:
        model = Room
        fields = (
            "name",
            "description",
            "room_type",
            "public",
            "auto_approve",
            "max_participants",
            "allow_file_uploads",
            "allow_voice_messages",
        )

    def validate_max_participants(self, value):
        """
        Validate max_participants based on user role.
        This will be further validated in the view.
        """
        if value is not None and value < 1:
            raise serializers.ValidationError("Max participants must be at least 1.")
        if value is not None and value > 200:
            raise serializers.ValidationError("Max participants cannot exceed 200.")
        return value

    def create(self, validated_data):
        """
        Ensure host is assigned and boolean defaults are applied.
        """
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["host"] = request.user

        # Ensure booleans default to True if missing
        validated_data.setdefault("allow_file_uploads", True)
        validated_data.setdefault("allow_voice_messages", True)

        return super().create(validated_data)


class JoinRequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)

    class Meta:
        model = JoinRequest
        fields = ("id", "room", "requester", "status", "created_at")
        read_only_fields = ("status", "created_at", "requester")


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            "id",
            "room",
            "sender",
            "content",
            "message_type",
            "file",
            "timestamp",
        )
        read_only_fields = ("sender", "timestamp")
