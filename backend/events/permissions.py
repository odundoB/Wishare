from rest_framework import permissions


class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow teachers and admins to create or manage events.
    Students have read-only access.
    """
    def has_permission(self, request, view):
        # All authenticated users can read
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Only teachers and admins can create or manage events
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or 
             (hasattr(request.user, 'role') and request.user.role == 'teacher'))
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow the event creator or an admin to edit/delete an event.
    Students have read-only access.
    """
    def has_permission(self, request, view):
        # All authenticated users can read
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Only teachers and admins can create or manage events
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or 
             (hasattr(request.user, 'role') and request.user.role == 'teacher'))
        )
    
    def has_object_permission(self, request, view, obj):
        # All authenticated users can read
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only the event creator or an admin can edit/delete
        return (
            obj.created_by == request.user or 
            request.user.is_staff
        )


class CanViewEvents(permissions.BasePermission):
    """
    Custom permission to allow all authenticated users to view events.
    Students, teachers, and admins can all view events.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsStudentReadOnly(permissions.BasePermission):
    """
    Custom permission to allow students read-only access to events.
    Teachers and admins have full access.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Students can only read
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Teachers and admins can create/modify
        return (
            request.user.is_staff or 
            (hasattr(request.user, 'role') and request.user.role == 'teacher')
        )
    
    def has_object_permission(self, request, view, obj):
        # All authenticated users can read
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only teachers and admins can modify
        return (
            request.user.is_staff or 
            (hasattr(request.user, 'role') and request.user.role == 'teacher')
        )
