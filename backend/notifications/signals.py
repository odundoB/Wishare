"""
Django signals for automatically creating notifications.
Connects to model signals to create notifications when certain actions occur.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType

from .models import Notification
from .utils import NotificationManager
from .websocket_service import send_notification_realtime, send_notification_update_realtime, send_notification_deletion_realtime

User = get_user_model()


@receiver(post_save, sender='resources.Resource')
def notify_resource_uploaded(sender, instance, created, **kwargs):
    """
    Create notification when a resource is uploaded.
    """
    if created and instance.uploaded_by:
        # Only notify if the resource is public or for specific subjects
        if instance.is_public:
            try:
                notifications = NotificationManager.notify_resource_uploaded(instance, instance.uploaded_by)
                # Send real-time notification via WebSocket
                if notifications:
                    for notification in notifications:
                        send_notification_realtime(notification)
            except Exception as e:
                # Log error but don't fail the resource upload
                print(f"Error creating notification for resource upload: {str(e)}")
                pass


@receiver(post_save, sender='events.Event')
def notify_event_created(sender, instance, created, **kwargs):
    """
    Create notification when an event is created.
    """
    if created and instance.created_by:
        try:
            notifications = NotificationManager.notify_event_created(instance, instance.created_by)
            # Send real-time notification via WebSocket
            if notifications:
                for notification in notifications:
                    send_notification_realtime(notification)
        except Exception as e:
            # Log error but don't fail the event creation
            print(f"Error creating notification for event creation: {str(e)}")
            pass




@receiver(post_save, sender='users.User')
def notify_user_registration(sender, instance, created, **kwargs):
    """
    Create notification for new user registration.
    """
    if created:
        # Notify admins about new user registration
        admins = User.objects.filter(is_staff=True)
        for admin in admins:
            Notification.create_notification(
                recipient=admin,
                verb="registered on the platform",
                actor=instance,
                target=None,
                notification_type='user',
                data={
                    'user_role': instance.role,
                    'registration_date': instance.date_joined.isoformat()
                }
            )


@receiver(post_delete, sender='resources.Resource')
def notify_resource_deleted(sender, instance, **kwargs):
    """
    Create notification when a resource is deleted.
    """
    if instance.uploaded_by:
        # Notify users who might have been interested in this resource
        interested_users = User.objects.filter(
            role__in=['teacher', 'student']
        ).exclude(id=instance.uploaded_by.id)
        
        for user in interested_users:
            Notification.create_notification(
                recipient=user,
                verb="deleted a resource",
                actor=instance.uploaded_by,
                target=None,
                notification_type='resource',
                data={
                    'resource_title': instance.title,
                    'resource_type': instance.resource_type,
                    'subject': instance.subject
                }
            )


@receiver(post_delete, sender='events.Event')
def notify_event_cancelled(sender, instance, **kwargs):
    """
    Create notification when an event is cancelled/deleted.
    """
    if instance.created_by:
        # Notify users who might have been interested in this event
        interested_users = User.objects.filter(
            role__in=['teacher', 'student']
        ).exclude(id=instance.created_by.id)
        
        for user in interested_users:
            Notification.create_notification(
                recipient=user,
                verb="cancelled an event",
                actor=instance.created_by,
                target=None,
                notification_type='event',
                data={
                    'event_title': instance.title,
                    'event_date': instance.start_time.isoformat(),
                    'location': instance.location
                }
            )


# Custom signal for user mentions
from django.dispatch import Signal

user_mentioned = Signal()


@receiver(user_mentioned)
def handle_user_mention(sender, user, mentioned_by, context_object, context_type, **kwargs):
    """
    Handle user mention notifications.
    """
    NotificationManager.notify_user_mentioned(user, mentioned_by, context_object, context_type)


# Custom signal for system announcements
system_announcement = Signal()


@receiver(system_announcement)
def handle_system_announcement(sender, message, recipients, data=None, **kwargs):
    """
    Handle system announcement notifications.
    """
    for recipient in recipients:
        notification = Notification.create_notification(
            recipient=recipient,
            verb=message,
            actor=None,
            target=None,
            notification_type='system',
            data=data or {}
        )
        # Send real-time notification via WebSocket
        if notification:
            send_notification_realtime(notification)


# Notification update and deletion signals
@receiver(post_save, sender=Notification)
def notify_notification_updated(sender, instance, created, **kwargs):
    """
    Send real-time update when a notification is modified.
    """
    if not created:  # Only for updates, not creation
        send_notification_update_realtime(instance)


@receiver(post_delete, sender=Notification)
def notify_notification_deleted(sender, instance, **kwargs):
    """
    Send real-time deletion event when a notification is deleted.
    """
    send_notification_deletion_realtime(instance.recipient.id, instance.id)
