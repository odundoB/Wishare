"""
Django admin configuration for the notifications app.
Provides comprehensive admin interface for notification management.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import Notification


class NotificationRecipientFilter(admin.SimpleListFilter):
    """Filter notifications by recipient."""
    title = 'Recipient'
    parameter_name = 'recipient'

    def lookups(self, request, model_admin):
        """Return filter options for recipients."""
        # Get unique recipients
        recipients = Notification.objects.values_list('recipient__id', 'recipient__username', 'recipient__email').distinct()
        return [(recipient[0], f"{recipient[1]} ({recipient[2]})") for recipient in recipients]

    def queryset(self, request, queryset):
        """Filter queryset based on selected recipient."""
        if self.value():
            return queryset.filter(recipient__id=self.value())
        return queryset


class NotificationActorFilter(admin.SimpleListFilter):
    """Filter notifications by actor."""
    title = 'Actor'
    parameter_name = 'actor'

    def lookups(self, request, model_admin):
        """Return filter options for actors."""
        # Get unique actors (excluding None)
        actors = Notification.objects.exclude(actor__isnull=True).values_list('actor__id', 'actor__username', 'actor__email').distinct()
        return [(actor[0], f"{actor[1]} ({actor[2]})") for actor in actors]

    def queryset(self, request, queryset):
        """Filter queryset based on selected actor."""
        if self.value():
            return queryset.filter(actor__id=self.value())
        return queryset


class NotificationTypeFilter(admin.SimpleListFilter):
    """Filter notifications by type."""
    title = 'Notification Type'
    parameter_name = 'notification_type'

    def lookups(self, request, model_admin):
        """Return filter options for notification types."""
        return [
            ('resource', 'Resource'),
            ('event', 'Event'),
            ('forum', 'Forum'),
            ('user', 'User'),
            ('system', 'System'),
            ('other', 'Other'),
        ]

    def queryset(self, request, queryset):
        """Filter queryset based on selected notification type."""
        if self.value():
            return queryset.filter(notification_type=self.value())
        return queryset


class NotificationReadStatusFilter(admin.SimpleListFilter):
    """Filter notifications by read status."""
    title = 'Read Status'
    parameter_name = 'is_read'

    def lookups(self, request, model_admin):
        """Return filter options for read status."""
        return [
            ('read', 'Read'),
            ('unread', 'Unread'),
        ]

    def queryset(self, request, queryset):
        """Filter queryset based on selected read status."""
        if self.value() == 'read':
            return queryset.filter(is_read=True)
        elif self.value() == 'unread':
            return queryset.filter(is_read=False)
        return queryset


class NotificationTimeFilter(admin.SimpleListFilter):
    """Filter notifications by time period."""
    title = 'Time Period'
    parameter_name = 'time_period'

    def lookups(self, request, model_admin):
        """Return filter options for time periods."""
        return [
            ('today', 'Today'),
            ('yesterday', 'Yesterday'),
            ('this_week', 'This Week'),
            ('last_week', 'Last Week'),
            ('this_month', 'This Month'),
            ('last_month', 'Last Month'),
            ('older', 'Older than 1 month'),
        ]

    def queryset(self, request, queryset):
        """Filter queryset based on selected time period."""
        now = timezone.now()
        
        if self.value() == 'today':
            return queryset.filter(created_at__date=now.date())
        elif self.value() == 'yesterday':
            yesterday = now.date() - timedelta(days=1)
            return queryset.filter(created_at__date=yesterday)
        elif self.value() == 'this_week':
            week_start = now.date() - timedelta(days=now.weekday())
            return queryset.filter(created_at__date__gte=week_start)
        elif self.value() == 'last_week':
            last_week_start = now.date() - timedelta(days=now.weekday() + 7)
            last_week_end = now.date() - timedelta(days=now.weekday() + 1)
            return queryset.filter(created_at__date__gte=last_week_start, created_at__date__lte=last_week_end)
        elif self.value() == 'this_month':
            return queryset.filter(created_at__year=now.year, created_at__month=now.month)
        elif self.value() == 'last_month':
            if now.month == 1:
                return queryset.filter(created_at__year=now.year-1, created_at__month=12)
            else:
                return queryset.filter(created_at__year=now.year, created_at__month=now.month-1)
        elif self.value() == 'older':
            month_ago = now - timedelta(days=30)
            return queryset.filter(created_at__lt=month_ago)
        return queryset


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for Notification model."""

    # List display configuration
    list_display = (
        'id', 'recipient', 'verb', 'target_display', 'created_at', 
        'is_read', 'notification_type', 'actor_display', 'time_since_created'
    )

    # Search configuration
    search_fields = (
        'verb', 'recipient__username', 'recipient__email', 
        'actor__username', 'actor__email', 'data'
    )

    # Filter configuration
    list_filter = (
        NotificationReadStatusFilter,
        NotificationTypeFilter,
        NotificationRecipientFilter,
        NotificationActorFilter,
        NotificationTimeFilter,
        'created_at',
    )

    # Ordering
    ordering = ('-created_at',)
    list_per_page = 50

    # Fieldsets for add/edit forms
    fieldsets = (
        ('Basic Information', {
            'fields': ('recipient', 'actor', 'verb', 'notification_type')
        }),
        ('Target Information', {
            'fields': ('content_type', 'object_id'),
            'description': 'Optional target object this notification refers to.'
        }),
        ('Status', {
            'fields': ('is_read',),
            'description': 'Whether the notification has been read by the recipient.'
        }),
        ('Additional Data', {
            'fields': ('data',),
            'classes': ('collapse',),
            'description': 'Additional JSON data for the notification.'
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',),
            'description': 'Automatically managed timestamp.'
        }),
    )

    # Read-only fields
    readonly_fields = ('created_at',)

    # Actions
    actions = [
        'mark_as_read', 'mark_as_unread', 'mark_all_as_read', 
        'mark_all_as_unread', 'delete_selected', 'export_notifications'
    ]

    # Custom display methods
    def target_display(self, obj):
        """Display target object information."""
        if not obj.target:
            return format_html('<span style="color: #6c757d;">No target</span>')
        
        target_name = obj.target_display_name
        target_url = obj.target_url
        
        if target_url:
            return format_html(
                '<a href="{}" target="_blank">{}</a>',
                target_url,
                target_name
            )
        else:
            return target_name
    target_display.short_description = 'Target'
    target_display.admin_order_field = 'content_type'

    def actor_display(self, obj):
        """Display actor information."""
        if not obj.actor:
            return format_html('<span style="color: #6c757d;">System</span>')
        
        return format_html(
            '<strong>{}</strong><br><small>{}</small>',
            obj.actor.username,
            obj.actor.email
        )
    actor_display.short_description = 'Actor'
    actor_display.admin_order_field = 'actor__username'

    def time_since_created(self, obj):
        """Display time since creation."""
        return obj.time_since_created
    time_since_created.short_description = 'Time Ago'
    time_since_created.admin_order_field = 'created_at'

    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related."""
        return super().get_queryset(request).select_related(
            'recipient', 'actor', 'content_type'
        )

    # Admin actions
    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read."""
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notifications were marked as read.')
    mark_as_read.short_description = 'Mark selected notifications as read'

    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread."""
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notifications were marked as unread.')
    mark_as_unread.short_description = 'Mark selected notifications as unread'

    def mark_all_as_read(self, request, queryset):
        """Mark all notifications as read."""
        # This would mark ALL notifications, not just the selected ones
        total_updated = Notification.objects.filter(is_read=False).update(is_read=True)
        self.message_user(request, f'{total_updated} notifications were marked as read.')
    mark_all_as_read.short_description = 'Mark ALL notifications as read'

    def mark_all_as_unread(self, request, queryset):
        """Mark all notifications as unread."""
        # This would mark ALL notifications, not just the selected ones
        total_updated = Notification.objects.filter(is_read=True).update(is_read=False)
        self.message_user(request, f'{total_updated} notifications were marked as unread.')
    mark_all_as_unread.short_description = 'Mark ALL notifications as unread'

    def export_notifications(self, request, queryset):
        """Export selected notifications (placeholder)."""
        self.message_user(request, f'Export functionality for {queryset.count()} notifications would be implemented here.')
    export_notifications.short_description = 'Export selected notifications'

    def get_list_display(self, request):
        """Customize list display based on user permissions."""
        list_display = list(super().get_list_display(request))
        
        # Add additional fields for superusers
        if request.user.is_superuser:
            list_display.extend(['data_preview'])
        
        return list_display

    def data_preview(self, obj):
        """Preview of notification data (for superusers only)."""
        if obj.data:
            data_str = str(obj.data)[:100]
            if len(str(obj.data)) > 100:
                data_str += '...'
            return format_html('<code>{}</code>', data_str)
        return format_html('<span style="color: #6c757d;">No data</span>')
    data_preview.short_description = 'Data Preview'

    def get_readonly_fields(self, request, obj=None):
        """Make certain fields read-only based on user permissions."""
        readonly_fields = list(super().get_readonly_fields(request, obj))
        
        # Only superusers can edit certain fields
        if not request.user.is_superuser:
            readonly_fields.extend(['recipient', 'actor', 'verb', 'content_type', 'object_id'])
        
        return readonly_fields

    def has_add_permission(self, request):
        """Only superusers can add notifications manually."""
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        """Only superusers can delete notifications."""
        return request.user.is_superuser

    def get_actions(self, request):
        """Customize available actions based on user permissions."""
        actions = super().get_actions(request)
        
        # Only superusers can perform bulk operations
        if not request.user.is_superuser:
            actions_to_remove = ['mark_all_as_read', 'mark_all_as_unread', 'delete_selected']
            for action in actions_to_remove:
                if action in actions:
                    del actions[action]
        
        return actions


# Optional: Custom admin site configuration
class NotificationAdminSite(admin.AdminSite):
    """Custom admin site for notifications (optional)."""
    site_header = "WIOSHARE Notifications Administration"
    site_title = "Notifications Admin"
    index_title = "Notification Management"

    def index(self, request, extra_context=None):
        """Custom index page with notification statistics."""
        extra_context = extra_context or {}
        
        # Add notification statistics
        total_notifications = Notification.objects.count()
        unread_notifications = Notification.objects.filter(is_read=False).count()
        recent_notifications = Notification.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        extra_context.update({
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'recent_notifications': recent_notifications,
        })
        
        return super().index(request, extra_context)