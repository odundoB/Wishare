"""
DRF views for the notifications app.
Handles notification listing, updates, and management.
"""

from rest_framework import generics, status, filters, serializers, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
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


# ============================================================================
# CHAT ROOM VIEWS
# ============================================================================

from .models import ChatRoom, RoomParticipant, JoinRequest, ChatMessage, PrivateChatRoom, PrivateMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages."""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    reply_to_data = serializers.SerializerMethodField()
    reactions_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'message', 'message_type', 'created_at', 'user_id', 'user_username', 'user_name', 'user_role', 
                 'is_edited', 'edited_at', 'reply_to', 'reply_to_data', 'is_private', 'reactions', 'reactions_formatted',
                 'audio_file', 'duration', 'file_attachment', 'file_type', 'file_size', 'original_filename']
        read_only_fields = ['id', 'created_at', 'user_id', 'user_username', 'user_name', 'user_role', 'reply_to_data', 'reactions_formatted']
    
    def get_reply_to_data(self, obj):
        """Get reply-to message data if this is a reply."""
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'message': obj.reply_to.message,
                'user': {
                    'id': obj.reply_to.user.id if obj.reply_to.user else None,
                    'username': obj.reply_to.user.username if obj.reply_to.user else 'System',
                    'displayName': obj.reply_to.user.get_full_name() if obj.reply_to.user else 'System'
                }
            }
        return None
    
    def get_reactions_formatted(self, obj):
        """Format reactions for frontend consumption."""
        if not obj.reactions:
            return []
        
        formatted = []
        for emoji, user_ids in obj.reactions.items():
            if user_ids:  # Only include reactions that have users
                formatted.append({
                    'emoji': emoji,
                    'count': len(user_ids),
                    'users': user_ids
                })
        return formatted


class PrivateMessageSerializer(serializers.ModelSerializer):
    """Serializer for private messages."""
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = PrivateMessage
        fields = ['id', 'message', 'message_type', 'sender_id', 'sender_name', 'sender_username', 
                 'is_read', 'read_at', 'created_at', 'edited_at', 'is_edited', 'reactions',
                 'audio_file', 'duration', 'file_attachment', 'file_type', 'file_size', 'original_filename']
        read_only_fields = ['id', 'sender_id', 'sender_name', 'sender_username', 'created_at', 'read_at']


class PrivateChatRoomSerializer(serializers.ModelSerializer):
    """Serializer for private chat rooms."""
    other_user = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = PrivateChatRoom
        fields = ['id', 'public_room', 'other_user', 'created_at', 'updated_at', 
                 'unread_count', 'last_message']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_other_user(self, obj):
        """Get the other user in this private chat."""
        current_user = self.context['request'].user
        other_user = obj.get_other_user(current_user)
        return {
            'id': other_user.id,
            'username': other_user.username,
            'full_name': other_user.get_full_name(),
        }
    
    def get_unread_count(self, obj):
        """Get unread message count for current user."""
        current_user = self.context['request'].user
        return obj.get_unread_count(current_user)
    
    def get_last_message(self, obj):
        """Get the last message in this private chat."""
        last_message = obj.private_messages.last()
        if last_message:
            return {
                'message': last_message.message,
                'sender': last_message.sender.username,
                'created_at': last_message.created_at,
                'is_read': last_message.is_read
            }
        return None


class ChatRoomSerializer(serializers.ModelSerializer):
    """Serializer for chat rooms."""
    participant_count = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    creator_name = serializers.CharField(source='creator.get_full_name', read_only=True)
    is_participant = serializers.SerializerMethodField()
    has_pending_request = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'description', 'room_type', 'creator', 'creator_name', 
                 'created_at', 'is_active', 'auto_approve', 'max_participants', 
                 'participant_count', 'is_full', 'is_participant', 'has_pending_request']
        read_only_fields = ['id', 'creator', 'created_at']
    
    def get_is_participant(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.participants.filter(user=request.user, is_active=True).exists()
        return False
    
    def get_has_pending_request(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.join_requests.filter(user=request.user, status='pending').exists()
        return False


class ChatRoomViewSet(viewsets.ModelViewSet):
    """ViewSet for chat rooms."""
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatRoom.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        room = serializer.save(creator=self.request.user)
        # Automatically add creator as participant
        RoomParticipant.objects.create(
            room=room, 
            user=self.request.user, 
            is_moderator=True
        )
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a chat room or create join request."""
        room = self.get_object()
        user = request.user
        
        # Check if already a participant
        if room.participants.filter(user=user, is_active=True).exists():
            return Response(
                {'detail': 'You are already a participant in this room.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if room is full
        if room.is_full:
            return Response(
                {'detail': 'Room is full.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for existing join request
        existing_request = room.join_requests.filter(user=user, status='pending').first()
        if existing_request:
            return Response(
                {'detail': 'You already have a pending join request.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if room.auto_approve:
            # Auto-approve: add directly as participant
            RoomParticipant.objects.create(room=room, user=user)
            return Response(
                {'detail': 'Successfully joined the room!'},
                status=status.HTTP_200_OK
            )
        else:
            # Create join request
            join_request = JoinRequest.objects.create(
                room=room, 
                user=user, 
                message=request.data.get('message', '')
            )
            
            # Create notification for room creator
            from .models import Notification
            from django.contrib.contenttypes.models import ContentType
            
            Notification.objects.create(
                recipient=room.creator,
                actor=user,
                verb=f'wants to join your room "{room.name}"',
                content_type=ContentType.objects.get_for_model(JoinRequest),
                object_id=join_request.id,
                notification_type='chat',
                data={
                    'room_id': room.id,
                    'room_name': room.name,
                    'join_request_id': join_request.id,
                    'message': request.data.get('message', ''),
                    'action_type': 'join_request'
                }
            )
            
            return Response(
                {'detail': 'Join request sent successfully!'},
                status=status.HTTP_201_CREATED
            )
    
    @action(detail=False, methods=['get'])
    def my_rooms(self, request):
        """Get rooms where user is a participant."""
        user_rooms = ChatRoom.objects.filter(
            participants__user=request.user,
            participants__is_active=True,
            is_active=True
        )
        serializer = self.get_serializer(user_rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get user's join requests."""
        requests = JoinRequest.objects.filter(user=request.user)
        data = [{
            'id': req.id,
            'room_name': req.room.name,
            'room_id': req.room.id,
            'status': req.status,
            'created_at': req.created_at,
            'message': req.message
        } for req in requests]
        return Response(data)
    
    @action(detail=True, methods=['get'])
    def pending_requests(self, request, pk=None):
        """Get pending join requests for a room (room creator only)."""
        room = self.get_object()
        
        # Only room creator can view pending requests
        if room.creator != request.user:
            return Response(
                {'detail': 'Only room creator can view pending requests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        requests = JoinRequest.objects.filter(room=room, status='pending')
        data = [{
            'id': req.id,
            'user_id': req.user.id,
            'user_name': req.user.get_full_name() or req.user.username,
            'user_role': getattr(req.user, 'role', 'student'),
            'message': req.message,
            'created_at': req.created_at,
        } for req in requests]
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def approve_request(self, request, pk=None):
        """Approve a join request (room creator only)."""
        room = self.get_object()
        
        # Only room creator can approve requests
        if room.creator != request.user:
            return Response(
                {'detail': 'Only room creator can approve requests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        join_request_id = request.data.get('request_id')
        if not join_request_id:
            return Response(
                {'detail': 'request_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            join_request = JoinRequest.objects.get(
                id=join_request_id, 
                room=room, 
                status='pending'
            )
        except JoinRequest.DoesNotExist:
            return Response(
                {'detail': 'Join request not found or already processed.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if room is full
        if room.is_full:
            return Response(
                {'detail': 'Room is full, cannot approve more requests.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve request and add as participant
        join_request.status = 'approved'
        join_request.processed_by = request.user
        join_request.processed_at = timezone.now()
        join_request.save()
        
        # Add user as participant
        RoomParticipant.objects.create(
            room=room, 
            user=join_request.user
        )
        
        # Create notification for the user
        from .models import Notification
        from django.contrib.contenttypes.models import ContentType
        
        Notification.objects.create(
            recipient=join_request.user,
            actor=request.user,
            verb=f'approved your request to join "{room.name}". Click to enter the room.',
            content_type=ContentType.objects.get_for_model(ChatRoom),
            object_id=room.id,
            notification_type='chat',
            data={
                'room_id': room.id,
                'room_name': room.name,
                'action_type': 'request_approved',
                'auto_join': True,
                'redirect_url': f'/chat-room/{room.id}',
                'room_access_granted': True
            }
        )
        
        return Response(
            {
                'detail': 'Join request approved successfully!',
                'user_name': join_request.user.get_full_name() or join_request.user.username,
                'room_name': room.name
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def deny_request(self, request, pk=None):
        """Deny a join request (room creator only)."""
        room = self.get_object()
        
        # Only room creator can deny requests
        if room.creator != request.user:
            return Response(
                {'detail': 'Only room creator can deny requests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        join_request_id = request.data.get('request_id')
        if not join_request_id:
            return Response(
                {'detail': 'request_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            join_request = JoinRequest.objects.get(
                id=join_request_id, 
                room=room, 
                status='pending'
            )
        except JoinRequest.DoesNotExist:
            return Response(
                {'detail': 'Join request not found or already processed.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Deny request
        join_request.status = 'rejected'
        join_request.processed_by = request.user
        join_request.processed_at = timezone.now()
        join_request.save()
        
        # Create notification for the user
        from .models import Notification
        from django.contrib.contenttypes.models import ContentType
        
        Notification.objects.create(
            recipient=join_request.user,
            actor=request.user,
            verb=f'denied your request to join "{room.name}"',
            content_type=ContentType.objects.get_for_model(ChatRoom),
            object_id=room.id,
            notification_type='chat',
            data={
                'room_id': room.id,
                'room_name': room.name,
                'action_type': 'request_denied',
                'reason': request.data.get('reason', '')
            }
        )
        
        return Response(
            {'detail': 'Join request denied.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages for a room (participants only)."""
        room = self.get_object()
        
        # Check if user is a participant or room creator
        if not (room.participants.filter(user=request.user, is_active=True).exists() or 
                room.creator == request.user):
            return Response(
                {'detail': 'You must be a participant to view messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = ChatMessage.objects.filter(room=room).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message to a room (participants only)."""
        room = self.get_object()
        
        # Check if user is a participant or room creator
        if not (room.participants.filter(user=request.user, is_active=True).exists() or 
                room.creator == request.user):
            return Response(
                {'detail': 'You must be a participant to send messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response(
                {'detail': 'Message content is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the message
        message = ChatMessage.objects.create(
            room=room,
            user=request.user,
            message=message_text,
            message_type='text'
        )
        
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def send_voice_message(self, request, pk=None):
        """Send a voice message to a room (participants only)."""
        room = self.get_object()
        
        # Check if user is a participant or room creator
        if not (room.participants.filter(user=request.user, is_active=True).exists() or 
                room.creator == request.user):
            return Response(
                {'detail': 'You must be a participant to send messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if audio file is provided
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response(
                {'detail': 'Audio file is required for voice messages.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get duration (optional) with maximum limit validation
        duration = request.data.get('duration', 0)
        try:
            duration = int(duration) if duration else 0
            # Enforce maximum duration of 3 minutes (180 seconds)
            if duration > 180:
                return Response(
                    {'detail': 'Voice message duration cannot exceed 3 minutes (180 seconds).'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            duration = 0
        
        # Create the voice message
        message = ChatMessage.objects.create(
            room=room,
            user=request.user,
            message=f"Voice message ({duration}s)" if duration > 0 else "Voice message",
            message_type='voice',
            audio_file=audio_file,
            duration=duration
        )
        
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def send_file_message(self, request, pk=None):
        """Send a file message to a room (participants only)."""
        print("=== FILE UPLOAD REQUEST ===")
        print(f"Request method: {request.method}")
        print(f"Room ID (pk): {pk}")
        print(f"User: {request.user}")
        print(f"Request data: {request.data}")
        print(f"Request files: {request.FILES}")
        print(f"Request headers: {dict(request.headers)}")
        
        room = self.get_object()
        print(f"Room object: {room}")
        
        # Check if user is a participant or room creator
        is_participant = room.participants.filter(user=request.user, is_active=True).exists()
        is_creator = room.creator == request.user
        print(f"Is participant: {is_participant}")
        print(f"Is creator: {is_creator}")
        
        if not (is_participant or is_creator):
            print("Access denied: User is not a participant or creator")
            return Response(
                {'detail': 'You must be a participant to send messages.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if file is provided
        file_attachment = request.FILES.get('file')
        print(f"File attachment: {file_attachment}")
        if not file_attachment:
            print("ERROR: No file found in request")
            return Response(
                {'detail': 'File is required for file messages.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get file type
        file_type = request.data.get('file_type', 'document')
        print(f"File type from request: {file_type}")
        if file_type not in ['media', 'document']:
            print(f"ERROR: Invalid file type: {file_type}")
            return Response(
                {'detail': 'Invalid file type. Must be "media" or "document".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (max 50MB)
        max_file_size = 50 * 1024 * 1024  # 50MB in bytes
        print(f"File size: {file_attachment.size} bytes (max: {max_file_size})")
        if file_attachment.size > max_file_size:
            print(f"ERROR: File too large: {file_attachment.size} > {max_file_size}")
            return Response(
                {'detail': 'File size cannot exceed 50MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the file message
        print("Creating file message...")
        message = ChatMessage.objects.create(
            room=room,
            user=request.user,
            message=f"📎 {file_attachment.name}",
            message_type='file',
            file_attachment=file_attachment,
            file_type=file_type,
            file_size=file_attachment.size,
            original_filename=file_attachment.name
        )
        print(f"File message created successfully: {message.id}")
        
        serializer = ChatMessageSerializer(message)
        print(f"Serialized data: {serializer.data}")
        print("=== FILE UPLOAD SUCCESS ===")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Get participants for a room (participants only)."""
        room = self.get_object()
        
        # Check if user is a participant or room creator
        if not (room.participants.filter(user=request.user, is_active=True).exists() or 
                room.creator == request.user):
            return Response(
                {'detail': 'You must be a participant to view participants.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        participants = RoomParticipant.objects.filter(room=room, is_active=True)
        data = [{
            'id': p.user.id,
            'username': p.user.username,
            'full_name': p.user.get_full_name(),
            'role': getattr(p.user, 'role', 'student'),
            'is_moderator': p.is_moderator,
            'joined_at': p.joined_at,
        } for p in participants]
        
        # Add room creator if not already in participants
        creator_as_participant = participants.filter(user=room.creator).first()
        if not creator_as_participant:
            data.append({
                'id': room.creator.id,
                'username': room.creator.username,
                'full_name': room.creator.get_full_name(),
                'role': getattr(room.creator, 'role', 'teacher'),
                'is_moderator': True,
                'joined_at': room.created_at,
            })
        
        return Response(data)

    @action(detail=True, methods=['post'])
    def send_reply(self, request, pk=None):
        """Send a reply to a specific message."""
        room = self.get_object()
        
        # Check if user is a participant or room creator
        if not (room.participants.filter(user=request.user, is_active=True).exists() or 
                room.creator == request.user):
            return Response(
                {'detail': 'You must be a participant to send messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message_text = request.data.get('message', '').strip()
        reply_to_id = request.data.get('replyTo')
        is_private = request.data.get('isPrivate', False)
        
        if not message_text:
            return Response(
                {'detail': 'Message content is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reply_to = None
        if reply_to_id:
            try:
                reply_to = ChatMessage.objects.get(id=reply_to_id, room=room)
            except ChatMessage.DoesNotExist:
                return Response(
                    {'detail': 'Reply target message not found.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create the reply message
        message = ChatMessage.objects.create(
            room=room,
            user=request.user,
            message=message_text,
            message_type='reply' if reply_to else 'text',
            reply_to=reply_to,
            is_private=is_private
        )
        
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'put'], url_path='edit-message/(?P<message_id>[^/.]+)')
    def edit_message(self, request, pk=None, message_id=None):
        """Edit a message (own messages only)."""
        try:
            room = self.get_object()
            message = ChatMessage.objects.get(id=message_id, room=room, user=request.user)
        except ChatMessage.DoesNotExist:
            return Response(
                {'detail': 'Message not found or you do not have permission to edit it.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_text = request.data.get('message', '').strip()
        if not new_text:
            return Response(
                {'detail': 'Message content is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.message = new_text
        message.is_edited = True
        message.edited_at = timezone.now()
        message.save()
        
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='delete-message/(?P<message_id>[^/.]+)')
    def delete_message(self, request, pk=None, message_id=None):
        """Delete a message."""
        try:
            room = self.get_object()
            message = ChatMessage.objects.get(id=message_id, room=room)
        except ChatMessage.DoesNotExist:
            return Response(
                {'detail': 'Message not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        delete_for_all = request.data.get('delete_for_all', False)
        
        # Check permissions
        if delete_for_all:
            # Only message author can delete for all
            if message.user != request.user:
                return Response(
                    {'detail': 'You can only delete your own messages for all.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            message.delete()  # Actually delete the message
        else:
            # Delete for self - mark as deleted for this user
            # For simplicity, we'll just return success - in a full implementation
            # you'd track per-user deletions
            pass
        
        return Response({'detail': 'Message deleted successfully.'})

    @action(detail=True, methods=['post'], url_path='add-reaction/(?P<message_id>[^/.]+)')
    def add_reaction(self, request, pk=None, message_id=None):
        """Add emoji reaction to a message."""
        room = self.get_object()
        
        # Check if user is a participant
        if not (room.participants.filter(user=request.user, is_active=True).exists() or 
                room.creator == request.user):
            return Response(
                {'detail': 'You must be a participant to react to messages.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            message = ChatMessage.objects.get(id=message_id, room=room)
        except ChatMessage.DoesNotExist:
            return Response(
                {'detail': 'Message not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        emoji = request.data.get('emoji')
        if not emoji:
            return Response(
                {'detail': 'Emoji is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For simplicity, we'll store reactions in the message's metadata
        # In a production app, you'd have a separate Reaction model
        if not message.reactions:
            message.reactions = {}
        
        if emoji not in message.reactions:
            message.reactions[emoji] = []
        
        if request.user.id not in message.reactions[emoji]:
            message.reactions[emoji].append(request.user.id)
            message.save()
        
        return Response({'detail': 'Reaction added successfully.', 'message_id': message.id, 'emoji': emoji})

    @action(detail=True, methods=['delete'], url_path='remove-reaction/(?P<message_id>[^/.]+)')
    def remove_reaction(self, request, pk=None, message_id=None):
        """Remove emoji reaction from a message."""
        room = self.get_object()
        
        try:
            message = ChatMessage.objects.get(id=message_id, room=room)
        except ChatMessage.DoesNotExist:
            return Response(
                {'detail': 'Message not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        emoji = request.data.get('emoji')
        if not emoji:
            return Response(
                {'detail': 'Emoji is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove user's reaction
        if message.reactions and emoji in message.reactions:
            if request.user.id in message.reactions[emoji]:
                message.reactions[emoji].remove(request.user.id)
                if not message.reactions[emoji]:  # Remove empty emoji lists
                    del message.reactions[emoji]
                message.save()
        
        return Response({'detail': 'Reaction removed successfully.', 'message_id': message.id, 'emoji': emoji})

    @action(detail=True, methods=['post'])
    def remove_participant(self, request, pk=None):
        """Remove a participant from the room (host only)."""
        room = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'detail': 'user_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if current user is host (creator or moderator)
        is_host = (
            room.creator == request.user or
            room.participants.filter(user=request.user, is_moderator=True, is_active=True).exists()
        )
        
        if not is_host:
            return Response(
                {'detail': 'Only hosts can remove participants.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Prevent host from removing themselves
        if str(user_id) == str(request.user.id):
            return Response(
                {'detail': 'You cannot remove yourself from the room.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Find and deactivate the participant
            participant = room.participants.get(user_id=user_id, is_active=True)
            participant.is_active = False
            participant.save()
            
            # Create notification for removed user
            from .models import Notification
            from django.contrib.contenttypes.models import ContentType
            
            Notification.objects.create(
                recipient_id=user_id,
                actor=request.user,
                verb=f'removed you from room "{room.name}"',
                content_type=ContentType.objects.get_for_model(ChatRoom),
                object_id=room.id,
                notification_type='chat',
                data={
                    'room_id': room.id,
                    'room_name': room.name,
                    'action_type': 'removed_from_room'
                }
            )
            
            return Response({'detail': 'Participant removed successfully.'})
            
        except RoomParticipant.DoesNotExist:
            return Response(
                {'detail': 'Participant not found in this room.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def leave_room(self, request, pk=None):
        """Leave the room voluntarily."""
        room = self.get_object()
        
        try:
            # Find and deactivate the participant
            participant = room.participants.get(user=request.user, is_active=True)
            participant.is_active = False
            participant.save()
            
            # Create notification for room creator if not the one leaving
            if room.creator != request.user:
                from .models import Notification
                from django.contrib.contenttypes.models import ContentType
                
                Notification.objects.create(
                    recipient=room.creator,
                    actor=request.user,
                    verb=f'left room "{room.name}"',
                    content_type=ContentType.objects.get_for_model(ChatRoom),
                    object_id=room.id,
                    notification_type='chat',
                    data={
                        'room_id': room.id,
                        'room_name': room.name,
                        'action_type': 'left_room'
                    }
                )
            
            return Response({'detail': 'Successfully left the room.'})
            
        except RoomParticipant.DoesNotExist:
            return Response(
                {'detail': 'You are not a participant in this room.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def end_meeting(self, request, pk=None):
        """End the meeting (host only) - permanently deletes the room."""
        try:
            room = self.get_object()
            
            # Check if current user is host (creator or moderator)
            is_host = (
                room.creator == request.user or
                room.participants.filter(user=request.user, is_moderator=True, is_active=True).exists()
            )
            
            if not is_host:
                return Response(
                    {'detail': 'Only hosts can end meetings.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Store room info before deletion for notifications
            room_name = room.name
            room_id = room.id
            
            # Get all participants before deletion (excluding the host)
            try:
                participants = room.participants.filter(is_active=True).exclude(user=request.user)
                participant_users = [p.user for p in participants]
            except Exception as e:
                print(f"Error getting participants: {e}")
                participant_users = []
            
            # Notify all participants that the meeting has ended BEFORE deletion
            try:
                for participant in participant_users:
                    Notification.objects.create(
                        recipient=participant,
                        actor=request.user,
                        verb=f'ended and deleted the meeting "{room_name}"',
                        notification_type='chat',
                        data={
                            'room_id': room_id,
                            'room_name': room_name,
                            'action_type': 'meeting_deleted',
                            'message': f'The meeting "{room_name}" has been permanently deleted by the host.'
                        }
                    )
            except Exception as e:
                print(f"Error creating notifications: {e}")
                # Continue with deletion even if notifications fail
            
            # Permanently delete the room and all related data
            # This will cascade delete: participants, messages, join_requests, reactions
            room.delete()
            
            return Response({
                'detail': 'Meeting ended and deleted successfully.',
                'room_name': room_name,
                'deleted': True
            })
            
        except Exception as e:
            print(f"Error in end_meeting: {e}")
            return Response(
                {'detail': f'Failed to end meeting: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PrivateChatRoomViewSet(viewsets.ModelViewSet):
    """ViewSet for private chat rooms within public chat rooms."""
    serializer_class = PrivateChatRoomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get private chat rooms for the current user."""
        user = self.request.user
        return PrivateChatRoom.objects.filter(
            Q(user1=user) | Q(user2=user),
            is_active=True
        )
    
    @action(detail=False, methods=['get'])
    def by_public_room(self, request):
        """Get private chat rooms for a specific public room."""
        public_room_id = request.query_params.get('public_room_id')
        if not public_room_id:
            return Response(
                {'detail': 'public_room_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user is participant in the public room
        try:
            public_room = ChatRoom.objects.get(id=public_room_id)
            if not public_room.participants.filter(user=request.user, is_active=True).exists():
                return Response(
                    {'detail': 'You are not a participant in this room.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except ChatRoom.DoesNotExist:
            return Response(
                {'detail': 'Public room not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get private chats in this public room
        private_chats = self.get_queryset().filter(public_room_id=public_room_id)
        serializer = self.get_serializer(private_chats, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def get_or_create(self, request):
        """Get or create a private chat room with another user."""
        public_room_id = request.data.get('public_room_id')
        other_user_id = request.data.get('other_user_id')
        
        if not public_room_id or not other_user_id:
            return Response(
                {'detail': 'public_room_id and other_user_id are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify users are participants in the public room
        try:
            public_room = ChatRoom.objects.get(id=public_room_id)
            
            # Check if current user is participant or creator
            current_user_is_participant = (
                public_room.participants.filter(user=request.user, is_active=True).exists() or
                public_room.creator == request.user
            )
            
            if not current_user_is_participant:
                return Response(
                    {'detail': 'You are not a participant in this room.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            from django.contrib.auth import get_user_model
            User = get_user_model()
            other_user = User.objects.get(id=other_user_id)
            
            # Check if other user is participant or creator
            other_user_is_participant = (
                public_room.participants.filter(user=other_user, is_active=True).exists() or
                public_room.creator == other_user
            )
            
            if not other_user_is_participant:
                return Response(
                    {'detail': 'The other user is not a participant in this room.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ChatRoom.DoesNotExist:
            return Response(
                {'detail': 'Public room not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except User.DoesNotExist:
            return Response(
                {'detail': 'Other user not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent self-chat
        if request.user.id == int(other_user_id):
            return Response(
                {'detail': 'Cannot create private chat with yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create private chat room (ensure consistent user ordering)
        user1, user2 = sorted([request.user, other_user], key=lambda u: u.id)
        private_chat, created = PrivateChatRoom.objects.get_or_create(
            public_room=public_room,
            user1=user1,
            user2=user2,
            defaults={'is_active': True}
        )
        
        serializer = self.get_serializer(private_chat)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages from a private chat room."""
        private_chat = self.get_object()
        messages = private_chat.private_messages.all()
        
        # Mark messages as read for the current user
        unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
        for message in unread_messages:
            message.mark_as_read(request.user)
        
        serializer = PrivateMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a private chat room."""
        private_chat = self.get_object()
        message_text = request.data.get('message', '').strip()
        
        if not message_text:
            return Response(
                {'detail': 'Message content is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the private message
        private_message = PrivateMessage.objects.create(
            private_chat=private_chat,
            sender=request.user,
            message=message_text
        )
        
        # Update the private chat room timestamp
        private_chat.updated_at = timezone.now()
        private_chat.save()
        
        # Create notification for the other user
        other_user = private_chat.get_other_user(request.user)
        from .models import Notification
        from django.contrib.contenttypes.models import ContentType
        
        Notification.objects.create(
            recipient=other_user,
            actor=request.user,
            verb=f'sent you a private message in "{private_chat.public_room.name}"',
            content_type=ContentType.objects.get_for_model(PrivateMessage),
            object_id=private_message.id,
            notification_type='private_message',
            data={
                'private_chat_id': private_chat.id,
                'public_room_id': private_chat.public_room.id,
                'public_room_name': private_chat.public_room.name,
                'message_preview': message_text[:50],
                'action_type': 'private_message_received'
            }
        )
        
        serializer = PrivateMessageSerializer(private_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_voice_message(self, request, pk=None):
        """Send a voice message in a private chat room."""
        private_chat = self.get_object()
        
        # Check if audio file is provided
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response(
                {'detail': 'Audio file is required for voice messages.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get duration (optional) with maximum limit validation
        duration = request.data.get('duration', 0)
        try:
            duration = int(duration) if duration else 0
            # Enforce maximum duration of 3 minutes (180 seconds)
            if duration > 180:
                return Response(
                    {'detail': 'Voice message duration cannot exceed 3 minutes (180 seconds).'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            duration = 0
        
        # Create the private voice message
        private_message = PrivateMessage.objects.create(
            private_chat=private_chat,
            sender=request.user,
            message=f"Voice message ({duration}s)" if duration > 0 else "Voice message",
            message_type='voice',
            audio_file=audio_file,
            duration=duration
        )
        
        # Update the private chat room timestamp
        private_chat.updated_at = timezone.now()
        private_chat.save()
        
        # Create notification for the other user
        other_user = private_chat.get_other_user(request.user)
        from .models import Notification
        from django.contrib.contenttypes.models import ContentType
        
        Notification.objects.create(
            recipient=other_user,
            actor=request.user,
            verb=f'sent you a voice message in "{private_chat.public_room.name}"',
            content_type=ContentType.objects.get_for_model(PrivateMessage),
            object_id=private_message.id,
            notification_type='private_message',
            data={
                'private_chat_id': private_chat.id,
                'public_room_id': private_chat.public_room.id,
                'public_room_name': private_chat.public_room.name,
                'message_preview': f'Voice message ({duration}s)' if duration > 0 else 'Voice message',
                'action_type': 'private_voice_message_received'
            }
        )
        
        serializer = PrivateMessageSerializer(private_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_file_message(self, request, pk=None):
        """Send a file message in a private chat room."""
        private_chat = self.get_object()
        
        # Check if file is provided
        file_attachment = request.FILES.get('file')
        if not file_attachment:
            return Response(
                {'detail': 'File is required for file messages.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get file type
        file_type = request.data.get('file_type', 'document')
        if file_type not in ['media', 'document']:
            return Response(
                {'detail': 'Invalid file type. Must be "media" or "document".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 50MB)
        max_file_size = 50 * 1024 * 1024  # 50MB in bytes
        if file_attachment.size > max_file_size:
            return Response(
                {'detail': 'File size cannot exceed 50MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the private file message
        private_message = PrivateMessage.objects.create(
            private_chat=private_chat,
            sender=request.user,
            message=f"📎 {file_attachment.name}",
            message_type='file',
            file_attachment=file_attachment,
            file_type=file_type,
            file_size=file_attachment.size,
            original_filename=file_attachment.name
        )
        
        # Update the private chat room timestamp
        private_chat.updated_at = timezone.now()
        private_chat.save()
        
        # Create notification for the other user
        other_user = private_chat.get_other_user(request.user)
        from .models import Notification
        from django.contrib.contenttypes.models import ContentType
        
        Notification.objects.create(
            recipient=other_user,
            actor=request.user,
            verb=f'sent you a file in "{private_chat.public_room.name}"',
            content_type=ContentType.objects.get_for_model(PrivateMessage),
            object_id=private_message.id,
            notification_type='private_message',
            data={
                'private_chat_id': private_chat.id,
                'public_room_id': private_chat.public_room.id,
                'public_room_name': private_chat.public_room.name,
                'message_preview': f'📎 {file_attachment.name}',
                'action_type': 'private_file_message_received'
            }
        )
        
        serializer = PrivateMessageSerializer(private_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

