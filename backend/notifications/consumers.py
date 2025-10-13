"""
Django Channels consumers for the notifications app.
Handles real-time notification delivery via WebSocket.
"""

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

from .models import Notification

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.
    Sends notifications to users in real-time and tracks delivery status.
    """

    async def connect(self):
        """Connect to WebSocket and join user's notification channel."""
        # Get user from scope (set by JWT middleware)
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return

        # Create user-specific channel group
        self.user_group_name = f'notifications_{self.user.id}'
        
        # Join user's notification group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notifications channel',
            'user_id': self.user.id,
            'username': self.user.username,
            'timestamp': timezone.now().isoformat()
        }))
        
        # Send any unread notifications count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'unread_count': unread_count,
            'timestamp': timezone.now().isoformat()
        }))

    async def disconnect(self, close_code):
        """Disconnect from WebSocket and leave user's notification group."""
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_unread_count':
                await self.handle_get_unread_count()
            elif message_type == 'mark_as_read':
                notification_id = data.get('notification_id')
                await self.handle_mark_as_read(notification_id)
            elif message_type == 'mark_all_as_read':
                await self.handle_mark_all_as_read()
            elif message_type == 'get_recent_notifications':
                limit = data.get('limit', 10)
                await self.handle_get_recent_notifications(limit)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}',
                    'timestamp': timezone.now().isoformat()
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format',
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing message: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))

    async def handle_get_unread_count(self):
        """Handle request for unread notification count."""
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'unread_count': unread_count,
            'timestamp': timezone.now().isoformat()
        }))

    async def handle_mark_as_read(self, notification_id):
        """Handle request to mark a notification as read."""
        if not notification_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Notification ID is required',
                'timestamp': timezone.now().isoformat()
            }))
            return

        success = await self.mark_notification_as_read(notification_id)
        if success:
            await self.send(text_data=json.dumps({
                'type': 'notification_marked_read',
                'notification_id': notification_id,
                'message': 'Notification marked as read',
                'timestamp': timezone.now().isoformat()
            }))
            
            # Send updated unread count
            unread_count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'unread_count': unread_count,
                'timestamp': timezone.now().isoformat()
            }))
        else:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to mark notification as read',
                'timestamp': timezone.now().isoformat()
            }))

    async def handle_mark_all_as_read(self):
        """Handle request to mark all notifications as read."""
        updated_count = await self.mark_all_notifications_as_read()
        await self.send(text_data=json.dumps({
            'type': 'all_notifications_marked_read',
            'updated_count': updated_count,
            'message': f'Marked {updated_count} notifications as read',
            'timestamp': timezone.now().isoformat()
        }))

    async def handle_get_recent_notifications(self, limit):
        """Handle request for recent notifications."""
        notifications = await self.get_recent_notifications(limit)
        await self.send(text_data=json.dumps({
            'type': 'recent_notifications',
            'notifications': notifications,
            'count': len(notifications),
            'timestamp': timezone.now().isoformat()
        }))

    # WebSocket group message handlers
    async def notification_created(self, event):
        """Handle notification creation event."""
        notification_data = event['notification']
        
        # Send notification to user
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': notification_data,
            'timestamp': timezone.now().isoformat()
        }))
        
        # Mark as delivered
        notification_id = notification_data.get('id')
        if notification_id:
            await self.mark_notification_as_delivered(notification_id)
        
        # Send updated unread count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'unread_count': unread_count,
            'timestamp': timezone.now().isoformat()
        }))

    async def notification_updated(self, event):
        """Handle notification update event."""
        notification_data = event['notification']
        
        await self.send(text_data=json.dumps({
            'type': 'notification_updated',
            'notification': notification_data,
            'timestamp': timezone.now().isoformat()
        }))

    async def notification_deleted(self, event):
        """Handle notification deletion event."""
        notification_id = event['notification_id']
        
        await self.send(text_data=json.dumps({
            'type': 'notification_deleted',
            'notification_id': notification_id,
            'timestamp': timezone.now().isoformat()
        }))
        
        # Send updated unread count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'unread_count': unread_count,
            'timestamp': timezone.now().isoformat()
        }))

    async def bulk_notification_update(self, event):
        """Handle bulk notification update event."""
        update_data = event['update_data']
        
        await self.send(text_data=json.dumps({
            'type': 'bulk_notification_update',
            'update_data': update_data,
            'timestamp': timezone.now().isoformat()
        }))
        
        # Send updated unread count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'unread_count': unread_count,
            'timestamp': timezone.now().isoformat()
        }))

    # Database operations
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count for the user."""
        return Notification.objects.filter(
            recipient=self.user,
            is_read=False
        ).count()

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Mark a specific notification as read."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_all_notifications_as_read(self):
        """Mark all notifications as read for the user."""
        return Notification.mark_all_as_read(self.user)

    @database_sync_to_async
    def mark_notification_as_delivered(self, notification_id):
        """Mark a notification as delivered."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            # Add delivered timestamp to data field
            data = notification.data or {}
            data['delivered_at'] = timezone.now().isoformat()
            notification.data = data
            notification.save(update_fields=['data'])
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def get_recent_notifications(self, limit=10):
        """Get recent notifications for the user."""
        notifications = Notification.objects.filter(
            recipient=self.user
        ).order_by('-created_at')[:limit]
        
        return [
            {
                'id': notification.id,
                'verb': notification.verb,
                'actor_display_name': notification.actor_display_name,
                'target_display_name': notification.target_display_name,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat(),
                'notification_type': notification.notification_type,
                'time_since_created': notification.time_since_created,
            }
            for notification in notifications
        ]


class NotificationBroadcastConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for broadcasting notifications to multiple users.
    Used by admin or system for sending notifications to multiple recipients.
    """

    async def connect(self):
        """Connect to broadcast channel."""
        # Check if user is admin or staff
        self.user = self.scope['user']
        
        if not self.user.is_authenticated or not self.user.is_staff:
            await self.close()
            return

        self.broadcast_group_name = 'notification_broadcast'
        
        # Join broadcast group
        await self.channel_layer.group_add(
            self.broadcast_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        await self.send(text_data=json.dumps({
            'type': 'broadcast_connected',
            'message': 'Connected to notification broadcast channel',
            'user_id': self.user.id,
            'username': self.user.username,
            'timestamp': timezone.now().isoformat()
        }))

    async def disconnect(self, close_code):
        """Disconnect from broadcast channel."""
        if hasattr(self, 'broadcast_group_name'):
            await self.channel_layer.group_discard(
                self.broadcast_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle incoming broadcast messages."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'broadcast_notification':
                await self.handle_broadcast_notification(data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}',
                    'timestamp': timezone.now().isoformat()
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format',
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing message: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))

    async def handle_broadcast_notification(self, data):
        """Handle broadcast notification request."""
        # This would typically create notifications for multiple users
        # and then broadcast them via the notification system
        await self.send(text_data=json.dumps({
            'type': 'broadcast_sent',
            'message': 'Broadcast notification sent',
            'timestamp': timezone.now().isoformat()
        }))

    async def broadcast_message(self, event):
        """Handle broadcast message from group."""
        await self.send(text_data=json.dumps({
            'type': 'broadcast_message',
            'message': event['message'],
            'data': event.get('data', {}),
            'timestamp': timezone.now().isoformat()
        }))
