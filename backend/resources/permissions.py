from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner or admin
        return obj.uploaded_by == request.user or request.user.is_staff


class IsOwnerOrAdminOrTeacher(permissions.BasePermission):
    """
    Custom permission to allow owners, admins, or teachers to edit/delete resources.
    Teachers can manage any resource.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Debug logging
        print(f"Permission check for user {request.user.username}:")
        print(f"  - User ID: {request.user.id}")
        print(f"  - Is Staff: {request.user.is_staff}")
        print(f"  - Has role attr: {hasattr(request.user, 'role')}")
        print(f"  - Role: {getattr(request.user, 'role', 'NO_ROLE')}")
        print(f"  - Resource uploaded by: {obj.uploaded_by.id}")
        print(f"  - Is owner: {obj.uploaded_by == request.user}")
        
        # Write permissions are allowed to owner, admin, or teacher
        is_owner = obj.uploaded_by == request.user
        is_admin = request.user.is_staff
        is_teacher = hasattr(request.user, 'role') and request.user.role == 'teacher'
        
        result = is_owner or is_admin or is_teacher
        print(f"  - Result: {result} (owner: {is_owner}, admin: {is_admin}, teacher: {is_teacher})")
        
        return result


class IsTeacher(permissions.BasePermission):
    """
    Custom permission to only allow users with role='teacher' to access.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'teacher'
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Others can read.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.uploaded_by == request.user


class IsOwnerOrAdminOrTeacher(permissions.BasePermission):
    """
    Custom permission to allow owners, admins, or teachers to access.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are allowed to owner, admin, or teacher
        return (
            obj.uploaded_by == request.user or
            request.user.is_staff or
            (hasattr(request.user, 'role') and request.user.role == 'teacher')
        )


class CanAccessResource(permissions.BasePermission):
    """
    Custom permission to check if user can access a specific resource.
    """
    def has_object_permission(self, request, view, obj):
        # Check if resource is accessible by the user
        return obj.is_accessible_by(request.user)


class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow teachers to edit resources.
    Others can read.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated request
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to teachers
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'role') and
            request.user.role == 'teacher'
        )


class IsAdminOrTeacher(permissions.BasePermission):
    """
    Custom permission to only allow admins or teachers to access.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or 
             (hasattr(request.user, 'role') and request.user.role == 'teacher'))
        )


class CanDownloadResource(permissions.BasePermission):
    """
    Custom permission to check if user can download a specific resource.
    """
    def has_object_permission(self, request, view, obj):
        # Check if resource is downloadable and accessible
        if obj.resource_type != 'file' or not obj.file:
            return False
        
        return obj.is_accessible_by(request.user)
