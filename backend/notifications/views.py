"""
DRF views for the notifications app.
Handles notification listing, updates, and management.
"""

from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

from .models import Notification
from .serializers import (
    NotificationSerializer,
    NotificationUpdateSerializer,
    NotificationListSerializer,
    NotificationBulkUpdateSerializer,
    NotificationFilterSerializer,
    NotificationStatsSerializer
)
from .permissions import (
    IsNotificationRecipientOrAdmin,
    IsNotificationOwnerOrAdmin,
    CanViewAllNotifications,
    CanDeleteNotification,
    CanBulkModifyNotifications,
    CanViewNotificationStats,
    CanModifyNotificationStatus,
    CanViewNotificationHistory,
    CanExportNotifications,
    CanManageNotificationSettings,
    IsNotificationSystemOrAdmin
)


class NotificationPagination(PageNumberPagination):
    """
    Custom pagination for notifications.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        """Add additional metadata to paginated response."""
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'page_info': {
                'current_page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'page_size': self.page.paginator.per_page,
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous(),
            }
        })


class NotificationListView(generics.ListAPIView):
    """
    List all notifications for the logged-in user.
    GET /notifications/ → list user's notifications with pagination
    """
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated, IsNotificationRecipientOrAdmin]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'actor']
    search_fields = ['verb']
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get notifications for the current user or all for admins."""
        user = self.request.user
        
        # Admins can view all notifications for debugging
        if user.is_staff:
            queryset = Notification.objects.all().select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')
        else:
            # Regular users can only view their own notifications
            queryset = Notification.objects.filter(recipient=user).select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')
        
        # Apply additional filters
        queryset = self.apply_filters(queryset)
        
        return queryset

    def apply_filters(self, queryset):
        """Apply custom filters to the queryset."""
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by notification type
        notification_type = self.request.query_params.get('notification_type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter by actor
        actor_id = self.request.query_params.get('actor_id')
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = timezone.datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = timezone.datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__lte=date_to)
            except ValueError:
                pass
        
        # Filter by recent/old
        time_filter = self.request.query_params.get('time_filter')
        if time_filter == 'recent':
            # Last 24 hours
            recent_time = timezone.now() - timedelta(hours=24)
            queryset = queryset.filter(created_at__gte=recent_time)
        elif time_filter == 'old':
            # Older than 7 days
            old_time = timezone.now() - timedelta(days=7)
            queryset = queryset.filter(created_at__lt=old_time)
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Override list to add additional context."""
        response = super().list(request, *args, **kwargs)
        
        # Add unread count to response
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        response.data['unread_count'] = unread_count
        return response


class NotificationDetailView(generics.RetrieveAPIView):
    """
    Retrieve a single notification.
    GET /notifications/<id>/ → get notification details
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsNotificationRecipientOrAdmin]

    def get_queryset(self):
        """Get notifications for the current user or all for admins."""
        user = self.request.user
        
        # Admins can view all notifications for debugging
        if user.is_staff:
            return Notification.objects.all().select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')
        else:
            # Regular users can only view their own notifications
            return Notification.objects.filter(recipient=user).select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')


class NotificationDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    Combined view for notification detail, update, and delete operations.
    GET /notifications/<id>/ → get notification details
    PATCH /notifications/<id>/ → mark as read/unread
    DELETE /notifications/<id>/ → delete notification
    """
    permission_classes = [IsAuthenticated, IsNotificationRecipientOrAdmin]

    def get_queryset(self):
        """Get notifications for the current user or all for admins."""
        user = self.request.user
        
        # Admins can view all notifications for debugging
        if user.is_staff:
            return Notification.objects.all().select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')
        else:
            # Regular users can only view their own notifications
            return Notification.objects.filter(recipient=user).select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')

    def get_serializer_class(self):
        """Use different serializers for different methods."""
        if self.request.method == 'GET':
            return NotificationSerializer
        elif self.request.method in ['PATCH', 'PUT']:
            return NotificationUpdateSerializer
        return NotificationSerializer

    def update(self, request, *args, **kwargs):
        """Override update to return full notification data."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return full notification data
        response_serializer = NotificationSerializer(instance, context={'request': request})
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to return confirmation message."""
        instance = self.get_object()
        notification_id = instance.id
        self.perform_destroy(instance)
        
        return Response({
            'message': f'Notification {notification_id} has been deleted successfully.',
            'deleted_id': notification_id
        }, status=status.HTTP_200_OK)


class NotificationUpdateView(generics.UpdateAPIView):
    """
    Mark a single notification as read/unread.
    PUT /notifications/<id>/ → update notification status
    PATCH /notifications/<id>/ → partial update notification status
    """
    serializer_class = NotificationUpdateSerializer
    permission_classes = [IsAuthenticated, CanModifyNotificationStatus]

    def get_queryset(self):
        """Get notifications for the current user or all for admins."""
        user = self.request.user
        
        # Admins can modify any notification
        if user.is_staff:
            return Notification.objects.all()
        else:
            # Regular users can only modify their own notifications
            return Notification.objects.filter(recipient=user)

    def update(self, request, *args, **kwargs):
        """Override update to return full notification data."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return full notification data
        response_serializer = NotificationSerializer(instance, context={'request': request})
        return Response(response_serializer.data)


class NotificationMarkAllReadView(generics.GenericAPIView):
    """
    Mark all notifications as read for the logged-in user.
    POST /notifications/mark-all-read/ → mark all notifications as read
    """
    permission_classes = [IsAuthenticated, CanModifyNotificationStatus]

    def post(self, request):
        """Mark all notifications as read."""
        user = request.user
        
        # Get count before update
        unread_count = Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()
        
        # Mark all as read
        updated_count = Notification.mark_all_as_read(user)
        
        return Response({
            'message': f'Successfully marked {updated_count} notifications as read.',
            'updated_count': updated_count,
            'previous_unread_count': unread_count
        }, status=status.HTTP_200_OK)


class NotificationMarkAllUnreadView(generics.GenericAPIView):
    """
    Mark all notifications as unread for the logged-in user.
    POST /notifications/mark-all-unread/ → mark all notifications as unread
    """
    permission_classes = [IsAuthenticated, CanModifyNotificationStatus]

    def post(self, request):
        """Mark all notifications as unread."""
        user = request.user
        
        # Get count before update
        read_count = Notification.objects.filter(
            recipient=user,
            is_read=True
        ).count()
        
        # Mark all as unread
        updated_count = Notification.objects.filter(
            recipient=user,
            is_read=True
        ).update(is_read=False)
        
        return Response({
            'message': f'Successfully marked {updated_count} notifications as unread.',
            'updated_count': updated_count,
            'previous_read_count': read_count
        }, status=status.HTTP_200_OK)


class NotificationDeleteView(generics.DestroyAPIView):
    """
    Delete a notification.
    DELETE /notifications/<id>/ → delete notification
    """
    permission_classes = [IsAuthenticated, CanDeleteNotification]

    def get_queryset(self):
        """Get notifications for the current user or all for admins."""
        user = self.request.user
        
        # Admins can delete any notification
        if user.is_staff:
            return Notification.objects.all()
        else:
            # Regular users can only delete their own notifications
            return Notification.objects.filter(recipient=user)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to return confirmation message."""
        instance = self.get_object()
        notification_id = instance.id
        self.perform_destroy(instance)
        
        return Response({
            'message': f'Notification {notification_id} has been deleted successfully.',
            'deleted_id': notification_id
        }, status=status.HTTP_200_OK)


class NotificationBulkUpdateView(generics.GenericAPIView):
    """
    Bulk update multiple notifications.
    POST /notifications/bulk-update/ → update multiple notifications
    """
    serializer_class = NotificationBulkUpdateSerializer
    permission_classes = [IsAuthenticated, CanBulkModifyNotifications]

    def post(self, request):
        """Bulk update notifications."""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        result = serializer.update(None, serializer.validated_data)
        
        return Response({
            'message': f'Successfully updated {result["updated_count"]} notifications.',
            'updated_count': result['updated_count']
        }, status=status.HTTP_200_OK)


class NotificationBulkDeleteView(generics.GenericAPIView):
    """
    Bulk delete multiple notifications.
    POST /notifications/bulk-delete/ → delete multiple notifications
    """
    permission_classes = [IsAuthenticated, CanBulkModifyNotifications]

    def post(self, request):
        """Bulk delete notifications."""
        notification_ids = request.data.get('notification_ids', [])
        
        if not notification_ids:
            return Response({
                'error': 'No notification IDs provided.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate that all notifications belong to the user
        user_notifications = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user
        )
        
        if user_notifications.count() != len(notification_ids):
            invalid_ids = set(notification_ids) - set(user_notifications.values_list('id', flat=True))
            return Response({
                'error': f'Invalid notification IDs: {list(invalid_ids)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete notifications
        deleted_count, _ = user_notifications.delete()
        
        return Response({
            'message': f'Successfully deleted {deleted_count} notifications.',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)


class NotificationStatsView(generics.GenericAPIView):
    """
    Get notification statistics for the logged-in user.
    GET /notifications/stats/ → get notification statistics
    """
    permission_classes = [IsAuthenticated, CanViewNotificationStats]

    def get(self, request):
        """Get notification statistics."""
        user = request.user
        
        # Get basic counts - admins can see all, users see only their own
        if user.is_staff:
            # Admins can view all notification statistics
            total_notifications = Notification.objects.count()
            unread_notifications = Notification.objects.filter(is_read=False).count()
        else:
            # Regular users can only view their own statistics
            total_notifications = Notification.objects.filter(recipient=user).count()
            unread_notifications = Notification.objects.filter(
                recipient=user,
                is_read=False
            ).count()
        
        read_notifications = total_notifications - unread_notifications
        
        # Get recent/old counts
        recent_time = timezone.now() - timedelta(hours=24)
        old_time = timezone.now() - timedelta(days=7)
        
        if user.is_staff:
            # Admins can view all statistics
            recent_notifications = Notification.objects.filter(
                created_at__gte=recent_time
            ).count()
            
            old_notifications = Notification.objects.filter(
                created_at__lt=old_time
            ).count()
            
            # Get notifications by type
            notifications_by_type = dict(
                Notification.objects.all()
                .values('notification_type')
                .annotate(count=Count('id'))
                .values_list('notification_type', 'count')
            )
            
            # Get today's notifications
            today = timezone.now().date()
            notifications_today = Notification.objects.filter(
                created_at__date=today
            ).count()
            
            # Get this week's notifications
            week_start = today - timedelta(days=today.weekday())
            notifications_this_week = Notification.objects.filter(
                created_at__date__gte=week_start
            ).count()
        else:
            # Regular users can only view their own statistics
            recent_notifications = Notification.objects.filter(
                recipient=user,
                created_at__gte=recent_time
            ).count()
            
            old_notifications = Notification.objects.filter(
                recipient=user,
                created_at__lt=old_time
            ).count()
            
            # Get notifications by type
            notifications_by_type = dict(
                Notification.objects.filter(recipient=user)
                .values('notification_type')
                .annotate(count=Count('id'))
                .values_list('notification_type', 'count')
            )
            
            # Get today's notifications
            today = timezone.now().date()
            notifications_today = Notification.objects.filter(
                recipient=user,
                created_at__date=today
            ).count()
            
            # Get this week's notifications
            week_start = today - timedelta(days=today.weekday())
            notifications_this_week = Notification.objects.filter(
                recipient=user,
                created_at__date__gte=week_start
            ).count()
        
        stats_data = {
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'read_notifications': read_notifications,
            'recent_notifications': recent_notifications,
            'old_notifications': old_notifications,
            'notifications_by_type': notifications_by_type,
            'notifications_today': notifications_today,
            'notifications_this_week': notifications_this_week,
        }
        
        serializer = NotificationStatsSerializer(stats_data)
        return Response(serializer.data)


class NotificationSearchView(generics.ListAPIView):
    """
    Search notifications with advanced filtering.
    GET /notifications/search/ → search notifications
    """
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated, IsNotificationRecipientOrAdmin]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'actor']
    search_fields = ['verb']
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get notifications for the current user or all for admins with search."""
        user = self.request.user
        
        # Admins can search all notifications for debugging
        if user.is_staff:
            queryset = Notification.objects.all().select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')
        else:
            # Regular users can only search their own notifications
            queryset = Notification.objects.filter(recipient=user).select_related(
                'actor', 'recipient'
            ).prefetch_related('content_type')
        
        # Apply search query
        search_query = self.request.query_params.get('q')
        if search_query:
            queryset = queryset.filter(
                Q(verb__icontains=search_query) |
                Q(actor__username__icontains=search_query) |
                Q(actor__first_name__icontains=search_query) |
                Q(actor__last_name__icontains=search_query)
            )
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated, CanViewNotificationStats])
def notification_unread_count(request):
    """
    Get unread notification count for the logged-in user.
    GET /notifications/unread-count/ → get unread count
    """
    user = request.user
    
    # Admins can see unread count for all notifications
    if user.is_staff:
        unread_count = Notification.objects.filter(is_read=False).count()
    else:
        # Regular users can only see their own unread count
        unread_count = Notification.get_unread_count(user)
    
    return Response({
        'unread_count': unread_count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, CanModifyNotificationStatus])
def notification_mark_recent_as_read(request):
    """
    Mark recent notifications (last 24 hours) as read.
    POST /notifications/mark-recent-read/ → mark recent notifications as read
    """
    user = request.user
    recent_time = timezone.now() - timedelta(hours=24)
    
    # Get count before update
    if user.is_staff:
        # Admins can mark recent notifications as read for all users
        recent_unread_count = Notification.objects.filter(
            is_read=False,
            created_at__gte=recent_time
        ).count()
        
        # Mark recent as read
        updated_count = Notification.objects.filter(
            is_read=False,
            created_at__gte=recent_time
        ).update(is_read=True)
    else:
        # Regular users can only mark their own recent notifications as read
        recent_unread_count = Notification.objects.filter(
            recipient=user,
            is_read=False,
            created_at__gte=recent_time
        ).count()
        
        # Mark recent as read
        updated_count = Notification.objects.filter(
            recipient=user,
            is_read=False,
            created_at__gte=recent_time
        ).update(is_read=True)
    
    return Response({
        'message': f'Successfully marked {updated_count} recent notifications as read.',
        'updated_count': updated_count,
        'previous_recent_unread_count': recent_unread_count
    }, status=status.HTTP_200_OK)