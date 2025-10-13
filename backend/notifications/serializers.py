"""
Serializers for the notifications app.
Handles serialization of notification data for API responses and updates.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta

from .models import Notification

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for notification display.
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display'
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


class TargetObjectSerializer(serializers.Serializer):
    """
    Serializer for target object information.
    """
    id = serializers.IntegerField()
    type = serializers.CharField()
    name = serializers.CharField()
    url = serializers.URLField(allow_null=True)
    
    def to_representation(self, instance):
        """Convert target object to serialized format."""
        if not instance:
            return None
        
        # Get basic info
        data = {
            'id': instance.pk,
            'type': instance._meta.model_name,
            'name': str(instance),
            'url': None
        }
        
        # Try to get a better name
        if hasattr(instance, 'title'):
            data['name'] = instance.title
        elif hasattr(instance, 'name'):
            data['name'] = instance.name
        elif hasattr(instance, 'subject'):
            data['name'] = instance.subject
        
        # Try to get URL
        try:
            if hasattr(instance, 'get_absolute_url'):
                data['url'] = instance.get_absolute_url()
        except:
            pass
        
        return data


class NotificationSerializer(serializers.ModelSerializer):
    """
    Full serializer for Notification model.
    Includes recipient, actor, verb, target info, is_read, and created_at.
    """
    recipient = UserBasicSerializer(read_only=True)
    actor = UserBasicSerializer(read_only=True)
    
    # Target object information
    target_info = serializers.SerializerMethodField()
    target_url = serializers.SerializerMethodField()
    target_display_name = serializers.SerializerMethodField()
    
    # Computed properties
    is_recent = serializers.BooleanField(read_only=True)
    is_old = serializers.BooleanField(read_only=True)
    time_since_created = serializers.CharField(read_only=True)
    
    # Display names
    actor_display_name = serializers.CharField(read_only=True)
    recipient_display_name = serializers.CharField(read_only=True)
    
    # Notification type
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    # Formatted timestamps
    created_at_display = serializers.SerializerMethodField()
    
    # Additional data
    data = serializers.JSONField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'actor', 'verb', 'target_info', 'target_url',
            'target_display_name', 'is_read', 'created_at', 'notification_type',
            'notification_type_display', 'data', 'is_recent', 'is_old',
            'time_since_created', 'actor_display_name', 'recipient_display_name',
            'created_at_display'
        ]
        read_only_fields = [
            'id', 'recipient', 'actor', 'verb', 'target_info', 'target_url',
            'target_display_name', 'created_at', 'notification_type', 'data',
            'is_recent', 'is_old', 'time_since_created', 'actor_display_name',
            'recipient_display_name', 'created_at_display'
        ]

    def get_target_info(self, obj):
        """Get target object information."""
        if not obj.target:
            return None
        
        return TargetObjectSerializer(obj.target).data

    def get_target_url(self, obj):
        """Get URL to the target object."""
        return obj.target_url

    def get_target_display_name(self, obj):
        """Get display name for the target object."""
        return obj.target_display_name

    def get_created_at_display(self, obj):
        """Get formatted creation timestamp."""
        return obj.created_at.strftime('%Y-%m-%d %H:%M:%S') if obj.created_at else None


class NotificationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating notification status (mark as read/unread).
    """
    is_read = serializers.BooleanField()

    class Meta:
        model = Notification
        fields = ['is_read']

    def validate_is_read(self, value):
        """Validate the is_read field."""
        # This is a simple boolean validation, but we could add more logic here
        return value

    def update(self, instance, validated_data):
        """Update the notification status."""
        is_read = validated_data.get('is_read')
        
        if is_read and not instance.is_read:
            # Marking as read
            instance.mark_as_read()
        elif not is_read and instance.is_read:
            # Marking as unread
            instance.mark_as_unread()
        
        return instance


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing notifications.
    Optimized for performance with minimal data.
    """
    actor_display_name = serializers.CharField(read_only=True)
    target_display_name = serializers.CharField(read_only=True)
    time_since_created = serializers.CharField(read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    created_at_display = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'verb', 'actor_display_name', 'target_display_name',
            'is_read', 'created_at', 'notification_type', 'notification_type_display',
            'time_since_created', 'created_at_display'
        ]

    def get_created_at_display(self, obj):
        """Get formatted creation timestamp."""
        return obj.created_at.strftime('%Y-%m-%d %H:%M') if obj.created_at else None


class NotificationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new notifications.
    Used by admin or system for manual notification creation.
    """
    recipient_id = serializers.IntegerField(write_only=True)
    actor_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    target_type = serializers.CharField(write_only=True, required=False, allow_null=True)
    target_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            'recipient_id', 'actor_id', 'verb', 'target_type', 'target_id',
            'notification_type', 'data'
        ]

    def validate_recipient_id(self, value):
        """Validate recipient exists."""
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Recipient user does not exist.")
        return value

    def validate_actor_id(self, value):
        """Validate actor exists if provided."""
        if value is not None:
            try:
                User.objects.get(id=value)
            except User.DoesNotExist:
                raise serializers.ValidationError("Actor user does not exist.")
        return value

    def validate_target_type(self, value):
        """Validate target type if provided."""
        if value is not None:
            try:
                ContentType.objects.get(model=value)
            except ContentType.DoesNotExist:
                raise serializers.ValidationError(f"Invalid target type: {value}")
        return value

    def validate(self, attrs):
        """Validate the complete data."""
        target_type = attrs.get('target_type')
        target_id = attrs.get('target_id')
        
        # Validate that either both target fields are provided or neither
        if bool(target_type) != bool(target_id):
            raise serializers.ValidationError({
                'target_type': 'Both target_type and target_id must be provided together, or both must be empty.'
            })
        
        return attrs

    def create(self, validated_data):
        """Create a new notification."""
        # Extract fields
        recipient_id = validated_data.pop('recipient_id')
        actor_id = validated_data.pop('actor_id', None)
        target_type = validated_data.pop('target_type', None)
        target_id = validated_data.pop('target_id', None)
        
        # Get objects
        recipient = User.objects.get(id=recipient_id)
        actor = User.objects.get(id=actor_id) if actor_id else None
        
        # Get target object
        target = None
        if target_type and target_id:
            content_type = ContentType.objects.get(model=target_type)
            target = content_type.get_object_for_this_type(id=target_id)
        
        # Create notification using the model's create_notification method
        return Notification.create_notification(
            recipient=recipient,
            verb=validated_data['verb'],
            actor=actor,
            target=target,
            notification_type=validated_data.get('notification_type', 'other'),
            data=validated_data.get('data', {})
        )


class NotificationStatsSerializer(serializers.Serializer):
    """
    Serializer for notification statistics.
    """
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    read_notifications = serializers.IntegerField()
    recent_notifications = serializers.IntegerField()
    old_notifications = serializers.IntegerField()
    notifications_by_type = serializers.DictField()
    notifications_today = serializers.IntegerField()
    notifications_this_week = serializers.IntegerField()


class NotificationBulkUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk updating multiple notifications.
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of notification IDs to update"
    )
    is_read = serializers.BooleanField(help_text="New read status for all notifications")

    def validate_notification_ids(self, value):
        """Validate that all notification IDs exist and belong to the user."""
        user = self.context['request'].user
        existing_ids = Notification.objects.filter(
            id__in=value,
            recipient=user
        ).values_list('id', flat=True)
        
        invalid_ids = set(value) - set(existing_ids)
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid notification IDs: {list(invalid_ids)}"
            )
        
        return value

    def update(self, instance, validated_data):
        """Update multiple notifications."""
        notification_ids = validated_data['notification_ids']
        is_read = validated_data['is_read']
        
        # Update all notifications
        updated_count = Notification.objects.filter(
            id__in=notification_ids
        ).update(is_read=is_read)
        
        return {'updated_count': updated_count}


class NotificationFilterSerializer(serializers.Serializer):
    """
    Serializer for filtering notifications.
    """
    is_read = serializers.BooleanField(required=False, help_text="Filter by read status")
    notification_type = serializers.ChoiceField(
        choices=[
            ('resource', 'Resource'),
            ('event', 'Event'),
            ('forum', 'Forum'),
            ('user', 'User'),
            ('system', 'System'),
            ('other', 'Other'),
        ],
        required=False,
        help_text="Filter by notification type"
    )
    actor_id = serializers.IntegerField(required=False, help_text="Filter by actor")
    date_from = serializers.DateTimeField(required=False, help_text="Filter from date")
    date_to = serializers.DateTimeField(required=False, help_text="Filter to date")
    search = serializers.CharField(required=False, help_text="Search in verb field")

    def validate_date_from(self, value):
        """Validate date_from is not in the future."""
        if value and value > timezone.now():
            raise serializers.ValidationError("Date from cannot be in the future.")
        return value

    def validate_date_to(self, value):
        """Validate date_to is not in the future."""
        if value and value > timezone.now():
            raise serializers.ValidationError("Date to cannot be in the future.")
        return value

    def validate(self, attrs):
        """Validate date range."""
        date_from = attrs.get('date_from')
        date_to = attrs.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError({
                'date_from': 'Date from must be before date to.'
            })
        
        return attrs
