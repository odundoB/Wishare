from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.urls import reverse
from django.utils.html import format_html

User = get_user_model()


class Notification(models.Model):
    """
    Model for storing notifications with flexible target linking using contenttypes framework.
    Supports notifications for various objects like Resources, Events, etc.
    """
    
    # Core notification fields
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="User who will receive this notification"
    )
    
    actor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_created',
        null=True,
        blank=True,
        help_text="User who triggered this notification (optional)"
    )
    
    verb = models.CharField(
        max_length=100,
        help_text="Action that triggered the notification (e.g., 'uploaded a resource', 'posted in forum')"
    )
    
    # Generic foreign key for flexible target linking
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Type of the target object"
    )
    
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="ID of the target object"
    )
    
    target = GenericForeignKey(
        'content_type',
        'object_id'
    )
    
    # Notification status
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the notification has been read by the recipient"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this notification was created"
    )
    
    # Optional additional fields for enhanced functionality
    notification_type = models.CharField(
        max_length=50,
        choices=[
            ('resource', 'Resource'),
            ('event', 'Event'),
            ('forum', 'Forum'),
            ('user', 'User'),
            ('chat', 'Chat'),
            ('system', 'System'),
            ('other', 'Other'),
        ],
        default='other',
        help_text="Type of notification for categorization"
    )
    
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional data for the notification (JSON format)"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        """String representation of the notification."""
        actor_name = self.actor.username if self.actor else "System"
        target_name = str(self.target) if self.target else "something"
        return f"{actor_name} {self.verb} {target_name}"
    
    def clean(self):
        """Validate the notification data."""
        super().clean()
        
        # Validate verb is not empty
        if not self.verb or not self.verb.strip():
            raise ValidationError({
                'verb': 'Notification verb cannot be empty.'
            })
        
        # Validate verb length
        if len(self.verb.strip()) > 100:
            raise ValidationError({
                'verb': 'Notification verb cannot exceed 100 characters.'
            })
        
        # Validate that either both content_type and object_id are provided or neither
        if bool(self.content_type) != bool(self.object_id):
            raise ValidationError({
                'content_type': 'Both content_type and object_id must be provided together, or both must be empty.'
            })
        
        # Validate notification type
        valid_types = [choice[0] for choice in self._meta.get_field('notification_type').choices]
        if self.notification_type not in valid_types:
            raise ValidationError({
                'notification_type': f'Invalid notification type. Must be one of: {", ".join(valid_types)}'
            })
    
    def save(self, *args, **kwargs):
        """Override save to run validation."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_recent(self):
        """Check if the notification is recent (within last 24 hours)."""
        return self.created_at > timezone.now() - timezone.timedelta(hours=24)
    
    @property
    def is_old(self):
        """Check if the notification is old (older than 7 days)."""
        return self.created_at < timezone.now() - timezone.timedelta(days=7)
    
    @property
    def time_since_created(self):
        """Get human-readable time since creation."""
        now = timezone.now()
        diff = now - self.created_at
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            return "Just now"
    
    @property
    def target_url(self):
        """Get URL to the target object if available."""
        if not self.target:
            return None
        
        try:
            # Try to get the URL for the target object
            if hasattr(self.target, 'get_absolute_url'):
                return self.target.get_absolute_url()
            
            # Fallback to admin URL
            return reverse(
                f'admin:{self.content_type.app_label}_{self.content_type.model}_change',
                args=[self.object_id]
            )
        except:
            return None
    
    @property
    def target_display_name(self):
        """Get display name for the target object."""
        if not self.target:
            return "Unknown"
        
        try:
            if hasattr(self.target, 'title'):
                return self.target.title
            elif hasattr(self.target, 'name'):
                return self.target.name
            elif hasattr(self.target, 'subject'):
                return self.target.subject
            else:
                return str(self.target)
        except:
            return "Unknown"
    
    @property
    def actor_display_name(self):
        """Get display name for the actor."""
        if not self.actor:
            return "System"
        
        return self.actor.get_full_name() or self.actor.username
    
    @property
    def recipient_display_name(self):
        """Get display name for the recipient."""
        return self.recipient.get_full_name() or self.recipient.username
    
    def mark_as_read(self):
        """Mark the notification as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])
    
    def mark_as_unread(self):
        """Mark the notification as unread."""
        if self.is_read:
            self.is_read = False
            self.save(update_fields=['is_read'])
    
    @classmethod
    def create_notification(cls, recipient, verb, actor=None, target=None, notification_type='other', data=None):
        """
        Create a new notification with proper validation.
        
        Args:
            recipient: User who will receive the notification
            verb: Action that triggered the notification
            actor: User who triggered the notification (optional)
            target: Target object (optional)
            notification_type: Type of notification
            data: Additional data (optional)
        
        Returns:
            Notification instance
        """
        content_type = None
        object_id = None
        
        if target:
            content_type = ContentType.objects.get_for_model(target)
            object_id = target.pk
        
        notification = cls(
            recipient=recipient,
            actor=actor,
            verb=verb,
            content_type=content_type,
            object_id=object_id,
            notification_type=notification_type,
            data=data or {}
        )
        
        notification.full_clean()
        notification.save()
        return notification
    
    @classmethod
    def get_unread_count(cls, user):
        """Get count of unread notifications for a user."""
        return cls.objects.filter(recipient=user, is_read=False).count()
    
    @classmethod
    def get_recent_notifications(cls, user, limit=10):
        """Get recent notifications for a user."""
        return cls.objects.filter(recipient=user).order_by('-created_at')[:limit]
    
    @classmethod
    def mark_all_as_read(cls, user):
        """Mark all notifications as read for a user."""
        return cls.objects.filter(recipient=user, is_read=False).update(is_read=True)
    
    @classmethod
    def cleanup_old_notifications(cls, days=30):
        """Delete old notifications (older than specified days)."""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        deleted_count, _ = cls.objects.filter(created_at__lt=cutoff_date).delete()
        return deleted_count
    
    def get_admin_display(self):
        """Get formatted display for admin interface."""
        actor_name = self.actor_display_name
        target_name = self.target_display_name
        time_ago = self.time_since_created
        
        status_color = "#28a745" if self.is_read else "#dc3545"
        status_text = "Read" if self.is_read else "Unread"
        
        return format_html(
            '<div style="margin-bottom: 5px;">'
            '<strong>{}</strong> <span style="color: #6c757d;">{}</span> <em>{}</em>'
            '</div>'
            '<div style="font-size: 0.9em; color: #6c757d;">'
            'To: {} | <span style="color: {};">{}</span> | {}'
            '</div>',
            actor_name,
            self.verb,
            target_name,
            self.recipient_display_name,
            status_color,
            status_text,
            time_ago
        )


class ChatRoom(models.Model):
    """
    Model for chat rooms where users can communicate.
    """
    ROOM_TYPES = [
        ('class', 'Class'),
        ('study_group', 'Study Group'),
        ('general', 'General'),
    ]
    
    name = models.CharField(max_length=100, help_text="Name of the chat room")
    description = models.TextField(blank=True, help_text="Description of the room")
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='general')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    auto_approve = models.BooleanField(default=True, help_text="Auto approve join requests")
    max_participants = models.PositiveIntegerField(default=50)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.name
    
    @property
    def participant_count(self):
        return self.participants.filter(is_active=True).count()
    
    @property
    def is_full(self):
        return self.participant_count >= self.max_participants


class RoomParticipant(models.Model):
    """
    Model for tracking room participants and their status.
    """
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_moderator = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['room', 'user']
        ordering = ['-joined_at']
        
    def __str__(self):
        return f"{self.user.username} in {self.room.name}"


class JoinRequest(models.Model):
    """
    Model for handling room join requests.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='join_requests')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='join_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, help_text="Optional message from the user")
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_requests')
    
    class Meta:
        unique_together = ['room', 'user']
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} -> {self.room.name} ({self.status})"


class ChatMessage(models.Model):
    """
    Model for storing chat messages in rooms.
    """
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('reply', 'Reply'),
        ('system', 'System'),
        ('join', 'User Join'),
        ('leave', 'User Leave'),
        ('voice', 'Voice Message'),
        ('file', 'File Attachment'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages', null=True, blank=True)
    message = models.TextField(help_text="Message content", blank=True)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    
    # Voice message fields
    audio_file = models.FileField(upload_to='voice_messages/', null=True, blank=True, help_text="Audio file for voice messages")
    duration = models.IntegerField(null=True, blank=True, help_text="Duration of voice message in seconds")
    
    # File attachment fields
    file_attachment = models.FileField(upload_to='chat_files/', null=True, blank=True, help_text="File attachment")
    file_type = models.CharField(max_length=20, choices=[('media', 'Media'), ('document', 'Document')], null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True, help_text="File size in bytes")
    original_filename = models.CharField(max_length=255, null=True, blank=True, help_text="Original filename")
    
    # Reply functionality
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    is_private = models.BooleanField(default=False, help_text="Private reply (only visible to sender and recipient)")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    
    # Reactions (stored as JSON for simplicity)
    reactions = models.JSONField(default=dict, blank=True, help_text="Emoji reactions with user IDs")
    
    class Meta:
        ordering = ['created_at']
        
    def __str__(self):
        if self.user:
            return f"{self.user.username}: {self.message[:50]}..."
        return f"System: {self.message[:50]}..."
    
    def save(self, *args, **kwargs):
        # Set edited timestamp if message is being edited
        if self.pk and self.is_edited:
            self.edited_at = timezone.now()
        super().save(*args, **kwargs)


class PrivateChatRoom(models.Model):
    """
    Model for private chat rooms between two users within a public chat room context.
    """
    # Link to the public chat room where this private conversation exists
    public_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='private_chats')
    
    # The two participants in this private chat
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='private_chats_as_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='private_chats_as_user2')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Activity tracking
    is_active = models.BooleanField(default=True)
    
    class Meta:
        # Ensure only one private chat room between two users in a public room
        unique_together = [['public_room', 'user1', 'user2']]
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Private chat: {self.user1.username} & {self.user2.username} in {self.public_room.name}"
    
    @property
    def participants(self):
        """Get both participants as a list."""
        return [self.user1, self.user2]
    
    def get_other_user(self, current_user):
        """Get the other participant in this private chat."""
        return self.user2 if current_user == self.user1 else self.user1
    
    def get_unread_count(self, user):
        """Get count of unread private messages for a specific user."""
        return self.private_messages.filter(
            is_read=False
        ).exclude(sender=user).count()


class PrivateMessage(models.Model):
    """
    Model for storing private messages within private chat rooms.
    """
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('voice', 'Voice Message'),
        ('file', 'File Attachment'),
        ('system', 'System'),
    ]
    
    private_chat = models.ForeignKey(PrivateChatRoom, on_delete=models.CASCADE, related_name='private_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_private_messages')
    message = models.TextField(help_text="Private message content", blank=True)
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    
    # Voice message fields
    audio_file = models.FileField(upload_to='private_voice_messages/', null=True, blank=True, help_text="Audio file for voice messages")
    duration = models.IntegerField(null=True, blank=True, help_text="Duration of voice message in seconds")
    
    # File attachment fields
    file_attachment = models.FileField(upload_to='private_chat_files/', null=True, blank=True, help_text="File attachment")
    file_type = models.CharField(max_length=20, choices=[('media', 'Media'), ('document', 'Document')], null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True, help_text="File size in bytes")
    original_filename = models.CharField(max_length=255, null=True, blank=True, help_text="Original filename")
    
    # Message status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    
    # Reactions (stored as JSON for consistency with ChatMessage)
    reactions = models.JSONField(default=dict, blank=True, help_text="Emoji reactions with user IDs")
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username} -> {self.private_chat}: {self.message[:50]}..."
    
    def mark_as_read(self, user=None):
        """Mark this message as read."""
        if not self.is_read and (user is None or user != self.sender):
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def save(self, *args, **kwargs):
        # Set edited timestamp if message is being edited
        if self.pk and self.is_edited:
            self.edited_at = timezone.now()
        super().save(*args, **kwargs)
