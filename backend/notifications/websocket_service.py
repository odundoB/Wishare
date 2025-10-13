"""
WebSocket service for sending real-time notifications.
Handles notification delivery via Django Channels.
"""

import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()


class NotificationWebSocketService:
    """
    Service for sending real-time notifications via WebSocket.
    """

    def __init__(self):
        self.channel_layer = get_channel_layer()

    def send_notification_to_user(self, notification):
        """
        Send a notification to a specific user via WebSocket.
        
        Args:
            notification: Notification instance to send
        """
        if not self.channel_layer:
            return False

        try:
            # Serialize notification data
            serializer = NotificationSerializer(notification)
            notification_data = serializer.data

            # Send to user's notification group
            user_group_name = f'notifications_{notification.recipient.id}'
            
            async_to_sync(self.channel_layer.group_send)(
                user_group_name,
                {
                    'type': 'notification_created',
                    'notification': notification_data,
                }
            )
            
            return True
        except Exception as e:
            print(f"Error sending notification to user {notification.recipient.id}: {str(e)}")
            return False

    def send_notification_to_multiple_users(self, notifications):
        """
        Send notifications to multiple users.
        
        Args:
            notifications: List of Notification instances
        """
        if not self.channel_layer:
            return False

        success_count = 0
        for notification in notifications:
            if self.send_notification_to_user(notification):
                success_count += 1

        return success_count

    def send_notification_update(self, notification):
        """
        Send notification update to user.
        
        Args:
            notification: Updated Notification instance
        """
        if not self.channel_layer:
            return False

        try:
            # Serialize notification data
            serializer = NotificationSerializer(notification)
            notification_data = serializer.data

            # Send to user's notification group
            user_group_name = f'notifications_{notification.recipient.id}'
            
            async_to_sync(self.channel_layer.group_send)(
                user_group_name,
                {
                    'type': 'notification_updated',
                    'notification': notification_data,
                }
            )
            
            return True
        except Exception as e:
            print(f"Error sending notification update to user {notification.recipient.id}: {str(e)}")
            return False

    def send_notification_deletion(self, user_id, notification_id):
        """
        Send notification deletion event to user.
        
        Args:
            user_id: ID of the user who should receive the deletion event
            notification_id: ID of the deleted notification
        """
        if not self.channel_layer:
            return False

        try:
            # Send to user's notification group
            user_group_name = f'notifications_{user_id}'
            
            async_to_sync(self.channel_layer.group_send)(
                user_group_name,
                {
                    'type': 'notification_deleted',
                    'notification_id': notification_id,
                }
            )
            
            return True
        except Exception as e:
            print(f"Error sending notification deletion to user {user_id}: {str(e)}")
            return False

    def send_bulk_notification_update(self, user_id, update_data):
        """
        Send bulk notification update to user.
        
        Args:
            user_id: ID of the user who should receive the update
            update_data: Dictionary containing update information
        """
        if not self.channel_layer:
            return False

        try:
            # Send to user's notification group
            user_group_name = f'notifications_{user_id}'
            
            async_to_sync(self.channel_layer.group_send)(
                user_group_name,
                {
                    'type': 'bulk_notification_update',
                    'update_data': update_data,
                }
            )
            
            return True
        except Exception as e:
            print(f"Error sending bulk notification update to user {user_id}: {str(e)}")
            return False

    def send_system_announcement(self, message, target_users=None):
        """
        Send system announcement to users.
        
        Args:
            message: Announcement message
            target_users: List of User instances to send to (None for all users)
        """
        if not self.channel_layer:
            return False

        try:
            announcement_data = {
                'type': 'system_announcement',
                'message': message,
                'timestamp': timezone.now().isoformat(),
            }

            if target_users:
                # Send to specific users
                for user in target_users:
                    user_group_name = f'notifications_{user.id}'
                    async_to_sync(self.channel_layer.group_send)(
                        user_group_name,
                        {
                            'type': 'broadcast_message',
                            'message': announcement_data,
                        }
                    )
            else:
                # Send to all users via broadcast channel
                async_to_sync(self.channel_layer.group_send)(
                    'notification_broadcast',
                    {
                        'type': 'broadcast_message',
                        'message': announcement_data,
                    }
                )
            
            return True
        except Exception as e:
            print(f"Error sending system announcement: {str(e)}")
            return False

    def send_notification_stats_update(self, user_id, stats_data):
        """
        Send notification statistics update to user.
        
        Args:
            user_id: ID of the user who should receive the stats update
            stats_data: Dictionary containing statistics data
        """
        if not self.channel_layer:
            return False

        try:
            # Send to user's notification group
            user_group_name = f'notifications_{user_id}'
            
            async_to_sync(self.channel_layer.group_send)(
                user_group_name,
                {
                    'type': 'notification_stats_update',
                    'stats': stats_data,
                }
            )
            
            return True
        except Exception as e:
            print(f"Error sending notification stats to user {user_id}: {str(e)}")
            return False


# Global instance for easy access
notification_websocket_service = NotificationWebSocketService()


def send_notification_realtime(notification):
    """
    Convenience function to send a notification in real-time.
    
    Args:
        notification: Notification instance to send
    """
    return notification_websocket_service.send_notification_to_user(notification)


def send_notification_update_realtime(notification):
    """
    Convenience function to send a notification update in real-time.
    
    Args:
        notification: Updated Notification instance to send
    """
    return notification_websocket_service.send_notification_update(notification)


def send_notification_deletion_realtime(user_id, notification_id):
    """
    Convenience function to send a notification deletion in real-time.
    
    Args:
        user_id: ID of the user who should receive the deletion event
        notification_id: ID of the deleted notification
    """
    return notification_websocket_service.send_notification_deletion(user_id, notification_id)


def send_bulk_notification_update_realtime(user_id, update_data):
    """
    Convenience function to send a bulk notification update in real-time.
    
    Args:
        user_id: ID of the user who should receive the update
        update_data: Dictionary containing update information
    """
    return notification_websocket_service.send_bulk_notification_update(user_id, update_data)
