from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os

from .models import Resource


class ResourceTypeFilter(admin.SimpleListFilter):
    """Custom filter for resource types."""
    title = 'Resource Type'
    parameter_name = 'resource_type'

    def lookups(self, request, model_admin):
        return (
            ('file', 'File Uploads'),
            ('url', 'URL Resources'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'file':
            return queryset.filter(resource_type='file')
        elif self.value() == 'url':
            return queryset.filter(resource_type='url')


class SubjectFilter(admin.SimpleListFilter):
    """Custom filter for subjects."""
    title = 'Subject'
    parameter_name = 'subject'

    def lookups(self, request, model_admin):
        return Resource.SUBJECT_CHOICES

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(subject=self.value())


class PublicStatusFilter(admin.SimpleListFilter):
    """Custom filter for public/private status."""
    title = 'Visibility'
    parameter_name = 'is_public'

    def lookups(self, request, model_admin):
        return (
            ('public', 'Public Resources'),
            ('private', 'Private Resources'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'public':
            return queryset.filter(is_public=True)
        elif self.value() == 'private':
            return queryset.filter(is_public=False)


class UploadDateFilter(admin.SimpleListFilter):
    """Custom filter for upload dates."""
    title = 'Upload Date'
    parameter_name = 'upload_date'

    def lookups(self, request, model_admin):
        return (
            ('today', 'Today'),
            ('week', 'This Week'),
            ('month', 'This Month'),
            ('year', 'This Year'),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == 'today':
            return queryset.filter(created_at__date=now.date())
        elif self.value() == 'week':
            return queryset.filter(created_at__gte=now - timedelta(days=7))
        elif self.value() == 'month':
            return queryset.filter(created_at__gte=now - timedelta(days=30))
        elif self.value() == 'year':
            return queryset.filter(created_at__gte=now - timedelta(days=365))


class DownloadCountFilter(admin.SimpleListFilter):
    """Custom filter for download counts."""
    title = 'Download Count'
    parameter_name = 'download_count'

    def lookups(self, request, model_admin):
        return (
            ('popular', 'Popular (10+ downloads)'),
            ('moderate', 'Moderate (1-9 downloads)'),
            ('unused', 'Unused (0 downloads)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'popular':
            return queryset.filter(download_count__gte=10)
        elif self.value() == 'moderate':
            return queryset.filter(download_count__gte=1, download_count__lt=10)
        elif self.value() == 'unused':
            return queryset.filter(download_count=0)


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    """
    Custom Resource admin configuration for managing resources in Django admin.
    """
    
    # Display fields in the resource list
    list_display = (
        'id', 'title', 'get_uploaded_by_display', 'get_subject_display_colored',
        'get_resource_type_display', 'get_file_info', 'is_public', 'download_count',
        'created_at', 'get_tags_display', 'resource_actions'
    )
    
    # Fields that can be searched
    search_fields = ('title', 'description', 'tags', 'uploaded_by__username', 'uploaded_by__email')
    
    # Filters for the right sidebar
    list_filter = (
        ResourceTypeFilter, SubjectFilter, PublicStatusFilter, 
        UploadDateFilter, DownloadCountFilter, 'created_at', 'updated_at'
    )
    
    # Fields to display in the resource detail view
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'subject', 'tags')
        }),
        ('Resource Content', {
            'fields': ('resource_type', 'file', 'url'),
            'description': 'Either upload a file or provide a URL, not both.'
        }),
        ('Visibility & Access', {
            'fields': ('is_public', 'uploaded_by'),
            'description': 'Control who can see and access this resource.'
        }),
        ('Statistics', {
            'fields': ('download_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Fields for adding a new resource
    add_fieldsets = (
        ('Basic Information', {
            'classes': ('wide',),
            'fields': ('title', 'description', 'subject', 'tags')
        }),
        ('Resource Content', {
            'classes': ('wide',),
            'fields': ('resource_type', 'file', 'url')
        }),
        ('Visibility', {
            'classes': ('wide', 'collapse'),
            'fields': ('is_public', 'uploaded_by')
        }),
    )
    
    # Fields that are read-only
    readonly_fields = ('created_at', 'updated_at', 'download_count')
    
    # Ordering
    ordering = ('-created_at',)
    
    # Items per page
    list_per_page = 25
    
    # Custom actions
    actions = [
        'make_public', 'make_private', 'reset_downloads', 
        'duplicate_resources', 'export_resources'
    ]
    
    def get_uploaded_by_display(self, obj):
        """Display uploader information with link to user admin."""
        if obj.uploaded_by:
            url = reverse('admin:users_user_change', args=[obj.uploaded_by.pk])
            return format_html(
                '<a href="{}">{} ({})</a>',
                url,
                obj.uploaded_by.username,
                obj.uploaded_by.get_role_display()
            )
        return '-'
    get_uploaded_by_display.short_description = 'Uploaded By'
    get_uploaded_by_display.admin_order_field = 'uploaded_by__username'
    
    def get_subject_display_colored(self, obj):
        """Display subject with color coding."""
        colors = {
            'mathematics': '#007bff',
            'science': '#28a745',
            'english': '#dc3545',
            'history': '#ffc107',
            'art': '#6f42c1',
            'music': '#fd7e14',
            'physical_education': '#20c997',
            'computer_science': '#6c757d',
            'foreign_language': '#17a2b8',
            'other': '#6c757d'
        }
        color = colors.get(obj.subject, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_subject_display()
        )
    get_subject_display_colored.short_description = 'Subject'
    get_subject_display_colored.admin_order_field = 'subject'
    
    def get_resource_type_display(self, obj):
        """Display resource type with icons."""
        if obj.resource_type == 'file':
            return format_html('<span style="color: #28a745;">📁 File</span>')
        elif obj.resource_type == 'url':
            return format_html('<span style="color: #007bff;">🔗 URL</span>')
        return obj.get_resource_type_display()
    get_resource_type_display.short_description = 'Type'
    get_resource_type_display.admin_order_field = 'resource_type'
    
    def get_file_info(self, obj):
        """Display file information."""
        if obj.resource_type == 'file' and obj.file:
            size = obj.get_file_size_display()
            extension = obj.get_file_extension()
            return format_html(
                '<span title="{}">{} ({})</span>',
                obj.file.name,
                extension,
                size
            )
        elif obj.resource_type == 'url' and obj.url:
            return format_html(
                '<a href="{}" target="_blank" title="{}">🔗 Link</a>',
                obj.url,
                obj.url
            )
        return '-'
    get_file_info.short_description = 'File/URL Info'
    
    def get_tags_display(self, obj):
        """Display tags as badges."""
        if obj.tags:
            tags = [tag.strip() for tag in obj.tags.split(',') if tag.strip()]
            if tags:
                tag_html = ' '.join([
                    f'<span style="background-color: #e9ecef; color: #495057; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 3px;">{tag}</span>'
                    for tag in tags[:3]  # Show only first 3 tags
                ])
                if len(tags) > 3:
                    tag_html += f' <span style="color: #6c757d;">+{len(tags) - 3} more</span>'
                return format_html(tag_html)
        return '-'
    get_tags_display.short_description = 'Tags'
    
    def resource_actions(self, obj):
        """Display custom action buttons for each resource."""
        if obj.pk:
            toggle_url = reverse('admin:resources_resource_toggle_public', args=[obj.pk])
            download_url = reverse('admin:resources_resource_download', args=[obj.pk])
            reset_downloads_url = reverse('admin:resources_resource_reset_downloads', args=[obj.pk])
            
            # Color code buttons based on resource status
            toggle_style = "background-color: #28a745; color: white; padding: 3px 8px; text-decoration: none; border-radius: 3px; margin-right: 3px; font-size: 11px;"
            download_style = "background-color: #007bff; color: white; padding: 3px 8px; text-decoration: none; border-radius: 3px; margin-right: 3px; font-size: 11px;"
            reset_style = "background-color: #ffc107; color: black; padding: 3px 8px; text-decoration: none; border-radius: 3px; font-size: 11px;"
            
            actions_html = f'''
            <a class="button" href="{toggle_url}" style="{toggle_style}">Toggle Public</a>
            <a class="button" href="{download_url}" style="{download_style}">Download</a>
            <a class="button" href="{reset_downloads_url}" style="{reset_style}">Reset Downloads</a>
            '''
            return format_html(actions_html)
        return '-'
    resource_actions.short_description = 'Actions'
    resource_actions.allow_tags = True
    
    def get_queryset(self, request):
        """Optimize queryset for better performance."""
        return super().get_queryset(request).select_related('uploaded_by')
    
    def make_public(self, request, queryset):
        """Bulk make selected resources public."""
        updated = queryset.update(is_public=True)
        self.message_user(request, f'{updated} resources were successfully made public.')
    make_public.short_description = 'Make selected resources public'
    
    def make_private(self, request, queryset):
        """Bulk make selected resources private."""
        updated = queryset.update(is_public=False)
        self.message_user(request, f'{updated} resources were successfully made private.')
    make_private.short_description = 'Make selected resources private'
    
    def reset_downloads(self, request, queryset):
        """Bulk reset download counts."""
        updated = queryset.update(download_count=0)
        self.message_user(request, f'Download counts reset for {updated} resources.')
    reset_downloads.short_description = 'Reset download counts'
    
    
    def duplicate_resources(self, request, queryset):
        """Duplicate selected resources."""
        duplicated_count = 0
        for resource in queryset:
            # Create a copy
            resource.pk = None
            resource.title = f"{resource.title} (Copy)"
            resource.download_count = 0
            resource.save()
            duplicated_count += 1
        
        self.message_user(request, f'{duplicated_count} resources were successfully duplicated.')
    duplicate_resources.short_description = 'Duplicate selected resources'
    
    def export_resources(self, request, queryset):
        """Export selected resources information."""
        # This is a placeholder - in a real implementation, you'd generate a CSV or Excel file
        self.message_user(request, f'Export functionality for {queryset.count()} resources would be implemented here.')
    export_resources.short_description = 'Export selected resources'
    
    def get_urls(self):
        """Add custom admin URLs."""
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:resource_id>/toggle-public/',
                self.admin_site.admin_view(self.toggle_public),
                name='resources_resource_toggle_public',
            ),
            path(
                '<int:resource_id>/download/',
                self.admin_site.admin_view(self.download_resource),
                name='resources_resource_download',
            ),
            path(
                '<int:resource_id>/reset-downloads/',
                self.admin_site.admin_view(self.reset_resource_downloads),
                name='resources_resource_reset_downloads',
            ),
        ]
        return custom_urls + urls
    
    def toggle_public(self, request, resource_id):
        """Toggle resource public/private status."""
        resource = get_object_or_404(Resource, pk=resource_id)
        resource.is_public = not resource.is_public
        resource.save()
        
        status_text = 'public' if resource.is_public else 'private'
        messages.success(request, f'Resource "{resource.title}" is now {status_text}.')
        return redirect('admin:resources_resource_change', resource_id)
    
    def download_resource(self, request, resource_id):
        """Download resource file."""
        resource = get_object_or_404(Resource, pk=resource_id)
        
        if resource.resource_type == 'file' and resource.file:
            # Increment download count
            resource.download_count += 1
            resource.save(update_fields=['download_count'])
            
            # Return file for download
            try:
                response = HttpResponseRedirect(resource.file.url)
                return response
            except:
                messages.error(request, 'File not found on server.')
                return redirect('admin:resources_resource_change', resource_id)
        else:
            messages.error(request, 'This resource is not available for download.')
            return redirect('admin:resources_resource_change', resource_id)
    
    def reset_resource_downloads(self, request, resource_id):
        """Reset download count for a specific resource."""
        resource = get_object_or_404(Resource, pk=resource_id)
        old_count = resource.download_count
        resource.download_count = 0
        resource.save(update_fields=['download_count'])
        
        messages.success(request, f'Download count for "{resource.title}" reset from {old_count} to 0.')
        return redirect('admin:resources_resource_change', resource_id)
    
    def get_form(self, request, obj=None, **kwargs):
        """Customize form based on user permissions."""
        form = super().get_form(request, obj, **kwargs)
        
        # If user is not superuser, limit uploaded_by choices
        if not request.user.is_superuser:
            form.base_fields['uploaded_by'].queryset = form.base_fields['uploaded_by'].queryset.filter(
                Q(is_staff=True) | Q(role='teacher')
            )
        
        return form


# Customize admin site headers
admin.site.site_header = "WIOSHARE Resource Management"
admin.site.site_title = "WIOSHARE Admin"
admin.site.index_title = "Resource Administration"
