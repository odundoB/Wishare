from rest_framework import permissions
from .models import User


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow admin users to modify objects,
    while allowing read-only access for other users.
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed for admin users
        return request.user and request.user.is_staff


class IsTeacher(permissions.BasePermission):
    """
    Custom permission to allow access only to users with role='teacher'.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'teacher'
        )


class IsStudent(permissions.BasePermission):
    """
    Custom permission to allow access only to users with role='student'.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'student'
        )


class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow teachers to modify objects,
    while allowing read-only access for other authenticated users.
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed for teachers
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'teacher'
        )


class IsStudentOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow students to modify objects,
    while allowing read-only access for other authenticated users.
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed for students
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'student'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow users to access only their own objects,
    or admin users to access any object.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access any object
        if request.user and request.user.is_staff:
            return True
        
        # Users can only access their own objects
        return obj == request.user


class IsOwnerOrTeacher(permissions.BasePermission):
    """
    Custom permission to allow users to access their own objects,
    or teachers to access any object.
    """
    
    def has_object_permission(self, request, view, obj):
        # Teachers can access any object
        if (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'teacher'
        ):
            return True
        
        # Users can only access their own objects
        return obj == request.user


class IsOwnerOrAdminOrTeacher(permissions.BasePermission):
    """
    Custom permission to allow users to access their own objects,
    or admin/teacher users to access any object.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access any object
        if request.user and request.user.is_staff:
            return True
        
        # Teachers can access any object
        if (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'teacher'
        ):
            return True
        
        # Users can only access their own objects
        return obj == request.user


class IsTeacherOrStudent(permissions.BasePermission):
    """
    Custom permission to allow access only to users with role='teacher' or 'student'.
    Excludes admin users from accessing certain views.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['teacher', 'student']
        )


class IsActiveUser(permissions.BasePermission):
    """
    Custom permission to allow access only to active users.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_active
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow users to modify only their own objects,
    while allowing read-only access for other authenticated users.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed for the owner of the object
        return obj == request.user


class IsAdminOrTeacher(permissions.BasePermission):
    """
    Custom permission to allow access only to admin users or teachers.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.role == 'teacher')
        )


class IsAdminOrTeacherOrOwner(permissions.BasePermission):
    """
    Custom permission to allow access to admin users, teachers, or object owners.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users can access any object
        if request.user and request.user.is_staff:
            return True
        
        # Teachers can access any object
        if (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'teacher'
        ):
            return True
        
        # Users can access their own objects
        return obj == request.user
