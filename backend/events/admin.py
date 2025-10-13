from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import Event


class EventStatusFilter(admin.SimpleListFilter):
    """Filter events by their status (upcoming, ongoing, past)."""
    title = 'Event Status'
    parameter_name = 'status'

    def lookups(self, request, model_admin):
        return (
            ('upcoming', 'Upcoming Events'),
            ('ongoing', 'Ongoing Events'),
            ('past', 'Past Events'),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == 'upcoming':
            return queryset.filter(start_time__gt=now)
        elif self.value() == 'ongoing':
            return queryset.filter(
                start_time__lte=now,
                end_time__gte=now
            )
        elif self.value() == 'past':
            return queryset.filter(end_time__lt=now)


class EventDurationFilter(admin.SimpleListFilter):
    """Filter events by duration."""
    title = 'Event Duration'
    parameter_name = 'duration'

    def lookups(self, request, model_admin):
        return (
            ('short', 'Short (< 1 hour)'),
            ('medium', 'Medium (1-4 hours)'),
            ('long', 'Long (4+ hours)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'short':
            return queryset.extra(
                where=["EXTRACT(EPOCH FROM (end_time - start_time)) < 3600"]
            )
        elif self.value() == 'medium':
            return queryset.extra(
                where=["EXTRACT(EPOCH FROM (end_time - start_time)) BETWEEN 3600 AND 14400"]
            )
        elif self.value() == 'long':
            return queryset.extra(
                where=["EXTRACT(EPOCH FROM (end_time - start_time)) > 14400"]
            )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin configuration for Event model."""
    
    # List display configuration
    list_display = (
        'id', 'title', 'start_time', 'created_by', 'location',
        'get_status_display', 'get_duration_display', 'created_at'
    )
    
    # Search configuration
    search_fields = ('title', 'location')
    
    # Filter configuration
    list_filter = (
        EventStatusFilter, EventDurationFilter, 'created_by',
        'created_at', 'start_time', 'end_time'
    )
    
    # Ordering
    ordering = ('-start_time',)
    list_per_page = 25
    
    # Fieldsets for add/edit forms
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'location')
        }),
        ('Event Timing', {
            'fields': ('start_time', 'end_time'),
            'description': 'Set the start and end times for the event.'
        }),
        ('Event Creator', {
            'fields': ('created_by',),
            'description': 'The user who created this event.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Automatically managed timestamps.'
        }),
    )
    
    # Read-only fields
    readonly_fields = ('created_at', 'updated_at')
    
    # Add form fieldsets
    add_fieldsets = (
        ('Basic Information', {
            'classes': ('wide',),
            'fields': ('title', 'description', 'location')
        }),
        ('Event Timing', {
            'classes': ('wide',),
            'fields': ('start_time', 'end_time')
        }),
        ('Event Creator', {
            'classes': ('wide', 'collapse'),
            'fields': ('created_by',)
        }),
    )
    
    # Actions
    actions = [
        'mark_as_upcoming', 'mark_as_past', 'duplicate_events',
        'export_events', 'send_reminders'
    ]
    
    def get_status_display(self, obj):
        """Display event status with color coding."""
        if obj.is_past:
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">Past</span>'
            )
        elif obj.is_ongoing:
            return format_html(
                '<span style="color: #ffc107; font-weight: bold;">Ongoing</span>'
            )
        elif obj.is_upcoming:
            return format_html(
                '<span style="color: #28a745; font-weight: bold;">Upcoming</span>'
            )
        else:
            return format_html(
                '<span style="color: #6c757d;">Unknown</span>'
            )
    get_status_display.short_description = 'Status'
    get_status_display.admin_order_field = 'start_time'
    
    def get_duration_display(self, obj):
        """Display event duration in human-readable format."""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            if hours > 0:
                return f"{hours}h {minutes}m"
            elif minutes > 0:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        return "Unknown"
    get_duration_display.short_description = 'Duration'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('created_by')
    
    def get_form(self, request, obj=None, **kwargs):
        """Customize form based on user permissions."""
        form = super().get_form(request, obj, **kwargs)
        
        # If user is not a superuser, limit created_by choices
        if not request.user.is_superuser:
            form.base_fields['created_by'].queryset = form.base_fields['created_by'].queryset.filter(
                Q(is_staff=True) | Q(role='teacher')
            )
        
        return form
    
    def save_model(self, request, obj, form, change):
        """Set created_by to current user if not set."""
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    # Admin actions
    def mark_as_upcoming(self, request, queryset):
        """Mark selected events as upcoming (move to future)."""
        now = timezone.now()
        future_time = now + timedelta(days=7)
        
        updated = 0
        for event in queryset:
            if event.start_time < now:
                # Move event to next week
                time_diff = event.end_time - event.start_time
                event.start_time = future_time
                event.end_time = future_time + time_diff
                event.save()
                updated += 1
        
        self.message_user(request, f'{updated} events marked as upcoming.')
    mark_as_upcoming.short_description = 'Mark selected events as upcoming'
    
    def mark_as_past(self, request, queryset):
        """Mark selected events as past (move to past)."""
        now = timezone.now()
        past_time = now - timedelta(days=1)
        
        updated = 0
        for event in queryset:
            if event.start_time > now:
                # Move event to yesterday
                time_diff = event.end_time - event.start_time
                event.start_time = past_time
                event.end_time = past_time + time_diff
                event.save()
                updated += 1
        
        self.message_user(request, f'{updated} events marked as past.')
    mark_as_past.short_description = 'Mark selected events as past'
    
    def duplicate_events(self, request, queryset):
        """Duplicate selected events."""
        duplicated_count = 0
        for event in queryset:
            event.pk = None
            event.title = f"{event.title} (Copy)"
            event.start_time = event.start_time + timedelta(days=7)
            event.end_time = event.end_time + timedelta(days=7)
            event.save()
            duplicated_count += 1
        
        self.message_user(request, f'{duplicated_count} events were successfully duplicated.')
    duplicate_events.short_description = 'Duplicate selected events'
    
    def export_events(self, request, queryset):
        """Export selected events (placeholder)."""
        self.message_user(request, f'Export functionality for {queryset.count()} events would be implemented here.')
    export_events.short_description = 'Export selected events'
    
    def send_reminders(self, request, queryset):
        """Send reminders for selected events (placeholder)."""
        self.message_user(request, f'Reminder functionality for {queryset.count()} events would be implemented here.')
    send_reminders.short_description = 'Send reminders for selected events'


# Customize admin site headers
admin.site.site_header = "WIOSHARE Event Management"
admin.site.site_title = "WIOSHARE Admin"
admin.site.index_title = "Event Administration"
