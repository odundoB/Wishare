from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Room(models.Model):
    ROOM_TYPE_CHOICES = [
        ('class', 'Class Room'),
        ('study_group', 'Study Group'),
        ('discussion', 'Discussion'),
        ('project', 'Project Room'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    host = models.ForeignKey(User, related_name="hosted_rooms", on_delete=models.CASCADE)
    participants = models.ManyToManyField(User, related_name="rooms", blank=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='class')
    is_active = models.BooleanField(default=True)
    public = models.BooleanField(default=True)  # indicates if room is public
    auto_approve = models.BooleanField(default=False)  # auto-approve join requests
    max_participants = models.PositiveIntegerField(default=50)  # maximum allowed participants
    allow_file_uploads = models.BooleanField(default=True)  # allow files
    allow_voice_messages = models.BooleanField(default=True)  # allow voice messages
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (host={self.host})"


class JoinRequest(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("denied", "Denied")
    )
    room = models.ForeignKey(Room, related_name="join_requests", on_delete=models.CASCADE)
    requester = models.ForeignKey(User, related_name="join_requests", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("room", "requester")

    def __str__(self):
        return f"Request by {self.requester} for {self.room} - {self.status}"


class Message(models.Model):
    MESSAGE_TYPES = (
        ("text", "text"),
        ("system", "system"),
        ("file", "file"),
    )
    room = models.ForeignKey(Room, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name="messages", on_delete=models.SET_NULL, null=True)
    content = models.TextField(blank=True)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default="text")
    timestamp = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to="chat_files/", blank=True, null=True)

    def __str__(self):
        return f"{self.room} | {self.sender} | {self.message_type} | {self.timestamp}"
