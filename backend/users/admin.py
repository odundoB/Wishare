from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Q
from .models import User, StudentProfile


class RoleFilter(admin.SimpleListFilter):
    """Custom filter for user roles."""
    title = 'Role'
    parameter_name = 'role'
    
    def lookups(self, request, model_admin):
        return (
            ('teacher', 'Teachers'),
            ('student', 'Students'),
            ('admin', 'Admins'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'teacher':
            return queryset.filter(role='teacher')
        elif self.value() == 'student':
            return queryset.filter(role='student')
        elif self.value() == 'admin':
            return queryset.filter(is_staff=True)


class ActiveStatusFilter(admin.SimpleListFilter):
    """Custom filter for user active status."""
    title = 'Active Status'
    parameter_name = 'active_status'
    
    def lookups(self, request, model_admin):
        return (
            ('active', 'Active Users'),
            ('inactive', 'Inactive Users'),
            ('recent', 'Recently Joined'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'active':
            return queryset.filter(is_active=True)
        elif self.value() == 'inactive':
            return queryset.filter(is_active=False)
        elif self.value() == 'recent':
            from django.utils import timezone
            from datetime import timedelta
            return queryset.filter(date_joined__gte=timezone.now() - timedelta(days=7))


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin configuration for managing users in Django admin.
    """
    
    # Display fields in the user list
    list_display = (
        'id', 'username', 'email', 'first_name', 'last_name', 
        'get_role_display_colored', 'is_active', 'is_staff', 'is_superuser', 
        'date_joined', 'last_login', 'user_actions'
    )
    
    # Fields that can be searched
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # Filters for the right sidebar
    list_filter = (
        RoleFilter, ActiveStatusFilter, 'is_staff', 'is_superuser', 
        'date_joined', 'last_login'
    )
    
    # Fields to display in the user detail view
    fieldsets = (
        ('Personal Information', {
            'fields': ('username', 'email', 'first_name', 'last_name')
        }),
        ('Role & Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    # Fields for adding a new user
    add_fieldsets = (
        ('Personal Information', {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
        ('Permissions', {
            'classes': ('wide', 'collapse'),
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
    )
    
    # Fields that are read-only
    readonly_fields = ('date_joined', 'last_login')
    
    # Ordering
    ordering = ('-date_joined',)
    
    # Items per page
    list_per_page = 25
    
    # Custom actions
    actions = ['activate_users', 'deactivate_users', 'make_teachers', 'make_students']
    
    def user_actions(self, obj):
        """Display custom action buttons for each user."""
        if obj.pk:
            activate_url = reverse('admin:users_user_activate', args=[obj.pk])
            deactivate_url = reverse('admin:users_user_deactivate', args=[obj.pk])
            reset_password_url = reverse('admin:users_user_reset_password', args=[obj.pk])
            
            # Color code buttons based on user status
            activate_style = "background-color: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; margin-right: 5px;"
            deactivate_style = "background-color: #dc3545; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; margin-right: 5px;"
            reset_style = "background-color: #ffc107; color: black; padding: 5px 10px; text-decoration: none; border-radius: 3px;"
            
            actions_html = f'''
            <a class="button" href="{activate_url}" style="{activate_style}">Activate</a>
            <a class="button" href="{deactivate_url}" style="{deactivate_style}">Deactivate</a>
            <a class="button" href="{reset_password_url}" style="{reset_style}">Reset Password</a>
            '''
            return format_html(actions_html)
        return '-'
    
    user_actions.short_description = 'Actions'
    user_actions.allow_tags = True
    
    def get_role_display_colored(self, obj):
        """Display role with color coding."""
        if obj.role == 'teacher':
            return format_html('<span style="color: #007bff; font-weight: bold;">👨‍🏫 Teacher</span>')
        elif obj.role == 'student':
            return format_html('<span style="color: #28a745; font-weight: bold;">👨‍🎓 Student</span>')
        else:
            return format_html('<span style="color: #6c757d; font-weight: bold;">👤 User</span>')
    
    get_role_display_colored.short_description = 'Role'
    get_role_display_colored.allow_tags = True
    
    def get_queryset(self, request):
        """Optimize queryset for better performance."""
        return super().get_queryset(request).select_related()
    
    def activate_users(self, request, queryset):
        """Bulk activate selected users."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users were successfully activated.')
    activate_users.short_description = 'Activate selected users'
    
    def deactivate_users(self, request, queryset):
        """Bulk deactivate selected users."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users were successfully deactivated.')
    deactivate_users.short_description = 'Deactivate selected users'
    
    def make_teachers(self, request, queryset):
        """Bulk change selected users to teachers."""
        updated = queryset.update(role='teacher')
        self.message_user(request, f'{updated} users were successfully changed to teachers.')
    make_teachers.short_description = 'Make selected users teachers'
    
    def make_students(self, request, queryset):
        """Bulk change selected users to students."""
        updated = queryset.update(role='student')
        self.message_user(request, f'{updated} users were successfully changed to students.')
    make_students.short_description = 'Make selected users students'
    
    def get_urls(self):
        """Add custom admin URLs."""
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:user_id>/activate/',
                self.admin_site.admin_view(self.activate_user),
                name='users_user_activate',
            ),
            path(
                '<int:user_id>/deactivate/',
                self.admin_site.admin_view(self.deactivate_user),
                name='users_user_deactivate',
            ),
            path(
                '<int:user_id>/reset-password/',
                self.admin_site.admin_view(self.reset_password),
                name='users_user_reset_password',
            ),
        ]
        return custom_urls + urls
    
    def activate_user(self, request, user_id):
        """Activate a specific user."""
        from django.shortcuts import get_object_or_404, redirect
        from django.contrib import messages
        
        user = get_object_or_404(User, pk=user_id)
        user.is_active = True
        user.save()
        messages.success(request, f'User {user.username} has been activated.')
        return redirect('admin:users_user_change', user_id)
    
    def deactivate_user(self, request, user_id):
        """Deactivate a specific user."""
        from django.shortcuts import get_object_or_404, redirect
        from django.contrib import messages
        
        user = get_object_or_404(User, pk=user_id)
        user.is_active = False
        user.save()
        messages.success(request, f'User {user.username} has been deactivated.')
        return redirect('admin:users_user_change', user_id)
    
    def reset_password(self, request, user_id):
        """Reset password for a specific user."""
        from django.shortcuts import get_object_or_404, redirect
        from django.contrib import messages
        from django.contrib.auth.hashers import make_password
        
        user = get_object_or_404(User, pk=user_id)
        new_password = 'temp_password_123'  # In production, generate a secure password
        user.set_password(new_password)
        user.save()
        messages.success(request, f'Password for {user.username} has been reset to: {new_password}')
        return redirect('admin:users_user_change', user_id)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for StudentProfile model.
    """
    
    list_display = (
        'id', 'full_name', 'username', 'email', 'department', 
        'year_of_study', 'gender', 'contact', 'created_at', 'updated_at'
    )
    
    list_filter = (
        'department', 'year_of_study', 'gender', 'created_at', 'updated_at'
    )
    
    search_fields = (
        'full_name', 'username', 'email', 'department', 'bio'
    )
    
    readonly_fields = ('created_at', 'updated_at', 'profile_picture_preview')
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'full_name', 'username', 'email', 'gender', 'date_of_birth')
        }),
        ('Academic Information', {
            'fields': ('department', 'year_of_study')
        }),
        ('Contact & Bio', {
            'fields': ('contact', 'bio')
        }),
        ('Profile Picture', {
            'fields': ('profile_picture', 'profile_picture_preview'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ('-updated_at',)
    list_per_page = 25
    
    def profile_picture_preview(self, obj):
        """Display profile picture preview."""
        if obj.profile_picture:
            return format_html(
                '<img src="{}" width="100" height="100" style="border-radius: 50%;" />',
                obj.profile_picture.url
            )
        return "No profile picture"
    
    profile_picture_preview.short_description = "Profile Picture Preview"
    profile_picture_preview.allow_tags = True
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('user')


# Customize admin site headers
admin.site.site_header = "WIOSHARE Administration"
admin.site.site_title = "WIOSHARE Admin"
admin.site.index_title = "Welcome to WIOSHARE Administration"


# Add custom admin dashboard
from django.contrib.admin.views.main import ChangeList
from django.db.models import Count

class UserChangeList(ChangeList):
    """Custom change list to show user statistics."""
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Add user statistics to context
        total_users = self.queryset.count()
        active_users = self.queryset.filter(is_active=True).count()
        teachers = self.queryset.filter(role='teacher').count()
        students = self.queryset.filter(role='student').count()
        
        context['user_stats'] = {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'teachers': teachers,
            'students': students,
        }
        
        return context


# Override the changelist for UserAdmin
UserAdmin.changelist_view = lambda self, request, extra_context=None: super(UserAdmin, self).changelist_view(request, extra_context)
