"""
Custom permissions for the notifications app.
Ensures users can only access their own notifications, while admins can view all.
"""

from rest_framework import permissions
from .models import Notification


class IsNotificationRecipientOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users to access their own notifications.
    Admins can access all notifications for debugging purposes.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can access the notification object."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can access all notifications
        if request.user.is_staff:
            return True

        # Users can only access their own notifications
        if isinstance(obj, Notification):
            return obj.recipient == request.user

        return False


class IsNotificationOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users to modify their own notifications.
    Admins can modify any notification.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can modify the notification object."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can modify any notification
        if request.user.is_staff:
            return True

        # Users can only modify their own notifications
        if isinstance(obj, Notification):
            return obj.recipient == request.user

        return False


class CanViewAllNotifications(permissions.BasePermission):
    """
    Custom permission to allow admins to view all notifications for debugging.
    Regular users are denied access.
    """
    
    def has_permission(self, request, view):
        """Check if user is admin."""
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )

    def has_object_permission(self, request, view, obj):
        """Check if user can access the notification object."""
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )


class CanCreateNotification(permissions.BasePermission):
    """
    Custom permission to control who can create notifications.
    Only admins and system can create notifications directly.
    """
    
    def has_permission(self, request, view):
        """Check if user can create notifications."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Only admins can create notifications directly via API
        return request.user.is_staff

    def has_object_permission(self, request, view, obj):
        """Check object-level permissions."""
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )


class CanDeleteNotification(permissions.BasePermission):
    """
    Custom permission to control who can delete notifications.
    Users can delete their own notifications, admins can delete any.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can delete the notification object."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can delete any notification
        if request.user.is_staff:
            return True

        # Users can only delete their own notifications
        if isinstance(obj, Notification):
            return obj.recipient == request.user

        return False


class CanBulkModifyNotifications(permissions.BasePermission):
    """
    Custom permission for bulk notification operations.
    Users can only bulk modify their own notifications.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can bulk modify notifications."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can bulk modify any notifications
        if request.user.is_staff:
            return True

        # For bulk operations, we need to check the notification IDs
        # This will be handled in the view logic
        return True


class IsNotificationRecipient(permissions.BasePermission):
    """
    Custom permission to only allow notification recipients to access their notifications.
    No admin override - strict recipient-only access.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user is the notification recipient."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Only the recipient can access their notification
        if isinstance(obj, Notification):
            return obj.recipient == request.user

        return False


class CanViewNotificationStats(permissions.BasePermission):
    """
    Custom permission for viewing notification statistics.
    Users can view their own stats, admins can view all stats.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can view notification statistics."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can view all stats
        if request.user.is_staff:
            return True

        # Users can only view their own stats
        # This will be handled in the view logic by filtering by recipient
        return True


class CanAccessNotificationWebSocket(permissions.BasePermission):
    """
    Custom permission for WebSocket notification access.
    Users can only connect to their own notification channel.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can access WebSocket notifications."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Users can only access their own notification channel
        # This is enforced by the WebSocket consumer
        return True


class IsNotificationActorOrAdmin(permissions.BasePermission):
    """
    Custom permission for notification actors (users who triggered the notification).
    Allows actors to view notifications they created, admins can view all.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user is the notification actor or admin."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can access all notifications
        if request.user.is_staff:
            return True

        # Users can access notifications where they are the actor
        if isinstance(obj, Notification):
            return obj.actor == request.user

        return False


class CanModifyNotificationStatus(permissions.BasePermission):
    """
    Custom permission for modifying notification status (read/unread).
    Users can modify their own notifications, admins can modify any.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can modify notification status."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can modify any notification status
        if request.user.is_staff:
            return True

        # Users can only modify their own notification status
        if isinstance(obj, Notification):
            return obj.recipient == request.user

        return False


class CanViewNotificationHistory(permissions.BasePermission):
    """
    Custom permission for viewing notification history.
    Users can view their own history, admins can view all.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can view notification history."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can view all notification history
        if request.user.is_staff:
            return True

        # Users can only view their own notification history
        if isinstance(obj, Notification):
            return obj.recipient == request.user

        return False


class CanExportNotifications(permissions.BasePermission):
    """
    Custom permission for exporting notifications.
    Users can export their own notifications, admins can export all.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can export notifications."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can export all notifications
        if request.user.is_staff:
            return True

        # Users can only export their own notifications
        if isinstance(obj, Notification):
            return obj.recipient == request.user

        return False


class CanManageNotificationSettings(permissions.BasePermission):
    """
    Custom permission for managing notification settings.
    Users can manage their own settings, admins can manage any.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Check if user can manage notification settings."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Admins can manage any notification settings
        if request.user.is_staff:
            return True

        # Users can only manage their own notification settings
        # This would typically be for user preference objects
        return True


class IsNotificationSystemOrAdmin(permissions.BasePermission):
    """
    Custom permission for system-level notification operations.
    Only system processes and admins can perform these operations.
    """
    
    def has_permission(self, request, view):
        """Check if user is system or admin."""
        if not (request.user and request.user.is_authenticated):
            return False

        # Only admins and system can perform system operations
        return request.user.is_staff or getattr(request.user, 'is_system', False)

    def has_object_permission(self, request, view, obj):
        """Check if user can perform system operations."""
        if not (request.user and request.user.is_authenticated):
            return False

        return request.user.is_staff or getattr(request.user, 'is_system', False)
