"""
Utility functions for creating and managing notifications.
Provides common notification patterns for different app actions.
"""

from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()


class NotificationManager:
    """
    Manager class for creating notifications with common patterns.
    """
    
    @staticmethod
    def notify_resource_uploaded(resource, uploader):
        """
        Create notification when a resource is uploaded.
        
        Args:
            resource: Resource object that was uploaded
            uploader: User who uploaded the resource
        
        Returns:
            Notification instance
        """
        # Get all users who should be notified (e.g., teachers, students in same subject)
        recipients = User.objects.filter(
            role__in=['teacher', 'student']
        ).exclude(id=uploader.id)
        
        notifications = []
        for recipient in recipients:
            notification = Notification.create_notification(
                recipient=recipient,
                verb="uploaded a resource",
                actor=uploader,
                target=resource,
                notification_type='resource',
                data={
                    'resource_title': resource.title,
                    'resource_type': resource.resource_type,
                    'subject': resource.subject
                }
            )
            notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_event_created(event, creator):
        """
        Create notification when an event is created.
        
        Args:
            event: Event object that was created
            creator: User who created the event
        
        Returns:
            Notification instance
        """
        # Get all users who should be notified
        recipients = User.objects.filter(
            role__in=['teacher', 'student']
        ).exclude(id=creator.id)
        
        notifications = []
        for recipient in recipients:
            notification = Notification.create_notification(
                recipient=recipient,
                verb="created an event",
                actor=creator,
                target=event,
                notification_type='event',
                data={
                    'event_title': event.title,
                    'event_date': event.start_time.isoformat(),
                    'location': event.location
                }
            )
            notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_chat_join_request(room, requester):
        """
        Create notification when someone requests to join a chat room.
        
        Args:
            room: Room object that was requested to join
            requester: User who requested to join
        
        Returns:
            Notification instance
        """
        return Notification.create_notification(
            recipient=room.host,
            verb="requested to join",
            actor=requester,
            target=room,
            notification_type='chat',
            data={
                'room_name': room.name,
                'room_id': room.id,
                'requester_name': requester.username,
                'action_type': 'join_request'
            }
        )
    
    @staticmethod
    def notify_chat_join_approved(room, approved_user, approved_by):
        """
        Create notification when a join request is approved.
        
        Args:
            room: Room object
            approved_user: User who was approved
            approved_by: User who approved the request (host)
        
        Returns:
            Notification instance
        """
        return Notification.create_notification(
            recipient=approved_user,
            verb="approved your request to join",
            actor=approved_by,
            target=room,
            notification_type='chat',
            data={
                'room_name': room.name,
                'room_id': room.id,
                'action_type': 'join_approved'
            }
        )
    
    
    @staticmethod
    def notify_user_mentioned(user, mentioned_by, context_object, context_type):
        """
        Create notification when a user is mentioned.
        
        Args:
            user: User who was mentioned
            mentioned_by: User who mentioned them
            context_object: Object where mention occurred
            context_type: Type of context (forum, etc.)
        
        Returns:
            Notification instance
        """
        return Notification.create_notification(
            recipient=user,
            verb="mentioned you in",
            actor=mentioned_by,
            target=context_object,
            notification_type=context_type,
            data={
                'context_type': context_type,
                'mentioned_by': mentioned_by.username
            }
        )
    
    @staticmethod
    def notify_system_message(recipient, message, data=None):
        """
        Create a system notification.
        
        Args:
            recipient: User who will receive the notification
            message: System message
            data: Additional data
        
        Returns:
            Notification instance
        """
        return Notification.create_notification(
            recipient=recipient,
            verb=message,
            actor=None,  # System notification
            target=None,
            notification_type='system',
            data=data or {}
        )
    
    @staticmethod
    def notify_bulk_action(recipients, verb, actor, target=None, notification_type='other', data=None):
        """
        Create notifications for multiple recipients.
        
        Args:
            recipients: QuerySet or list of User objects
            verb: Action description
            actor: User who performed the action
            target: Target object (optional)
            notification_type: Type of notification
            data: Additional data
        
        Returns:
            List of Notification instances
        """
        notifications = []
        for recipient in recipients:
            notification = Notification.create_notification(
                recipient=recipient,
                verb=verb,
                actor=actor,
                target=target,
                notification_type=notification_type,
                data=data or {}
            )
            notifications.append(notification)
        
        return notifications


def create_notification_for_resource_upload(resource, uploader):
    """
    Convenience function to create notification for resource upload.
    """
    return NotificationManager.notify_resource_uploaded(resource, uploader)


def create_notification_for_event_creation(event, creator):
    """
    Convenience function to create notification for event creation.
    """
    return NotificationManager.notify_event_created(event, creator)




def create_system_notification(recipient, message, data=None):
    """
    Convenience function to create system notification.
    """
    return NotificationManager.notify_system_message(recipient, message, data)


def get_user_notifications(user, limit=20, unread_only=False):
    """
    Get notifications for a user with optional filtering.
    
    Args:
        user: User object
        limit: Maximum number of notifications to return
        unread_only: If True, only return unread notifications
    
    Returns:
        QuerySet of Notification objects
    """
    queryset = Notification.objects.filter(recipient=user)
    
    if unread_only:
        queryset = queryset.filter(is_read=False)
    
    return queryset.order_by('-created_at')[:limit]


def mark_notifications_as_read(user, notification_ids=None):
    """
    Mark notifications as read for a user.
    
    Args:
        user: User object
        notification_ids: List of notification IDs to mark as read (optional)
    
    Returns:
        Number of notifications marked as read
    """
    queryset = Notification.objects.filter(recipient=user, is_read=False)
    
    if notification_ids:
        queryset = queryset.filter(id__in=notification_ids)
    
    return queryset.update(is_read=True)


def cleanup_old_notifications(days=30):
    """
    Clean up old notifications.
    
    Args:
        days: Number of days to keep notifications
    
    Returns:
        Number of notifications deleted
    """
    return Notification.cleanup_old_notifications(days)
