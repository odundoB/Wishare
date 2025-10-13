"""
Test file to demonstrate the Event permission classes.
This file shows how the permission classes work with different user roles.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework import permissions

from .permissions import IsTeacherOrAdmin, IsOwnerOrAdmin, CanViewEvents, IsStudentReadOnly
from .models import Event
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class EventPermissionTests(TestCase):
    """Test cases for Event permission classes."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role='teacher',  # Admin users have teacher role
            is_staff=True
        )
        
        self.teacher_user = User.objects.create_user(
            username='teacher',
            email='teacher@test.com',
            password='testpass123',
            role='teacher'
        )
        
        self.student_user = User.objects.create_user(
            username='student',
            email='student@test.com',
            password='testpass123',
            role='student'
        )
        
        # Create test event
        self.event = Event.objects.create(
            title='Test Event',
            description='Test Description',
            location='Test Location',
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=2),
            created_by=self.teacher_user
        )
    
    def test_is_teacher_or_admin_permission(self):
        """Test IsTeacherOrAdmin permission class."""
        permission = IsTeacherOrAdmin()
        
        # Test GET request (read access)
        request = self.factory.get('/events/')
        request.user = self.student_user
        self.assertTrue(permission.has_permission(request, None))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
        
        # Test POST request (create access)
        request = self.factory.post('/events/')
        request.user = self.student_user
        self.assertFalse(permission.has_permission(request, None))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
    
    def test_is_owner_or_admin_permission(self):
        """Test IsOwnerOrAdmin permission class."""
        permission = IsOwnerOrAdmin()
        
        # Test GET request (read access)
        request = self.factory.get('/events/1/')
        request.user = self.student_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        # Test PUT request (update access)
        request = self.factory.put('/events/1/')
        request.user = self.student_user
        self.assertFalse(permission.has_permission(request, None))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
    
    def test_can_view_events_permission(self):
        """Test CanViewEvents permission class."""
        permission = CanViewEvents()
        
        # Test with authenticated users
        request = self.factory.get('/events/')
        request.user = self.student_user
        self.assertTrue(permission.has_permission(request, None))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with unauthenticated user
        request.user = None
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_student_read_only_permission(self):
        """Test IsStudentReadOnly permission class."""
        permission = IsStudentReadOnly()
        
        # Test GET request (read access)
        request = self.factory.get('/events/')
        request.user = self.student_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        # Test POST request (create access)
        request = self.factory.post('/events/')
        request.user = self.student_user
        self.assertFalse(permission.has_permission(request, None))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
        
        # Test PUT request (update access)
        request = self.factory.put('/events/1/')
        request.user = self.student_user
        self.assertFalse(permission.has_permission(request, None))
        self.assertFalse(permission.has_object_permission(request, None, self.event))
        
        request.user = self.teacher_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))
        
        request.user = self.admin_user
        self.assertTrue(permission.has_permission(request, None))
        self.assertTrue(permission.has_object_permission(request, None, self.event))


def demonstrate_permission_usage():
    """
    Demonstrate how to use the permission classes in views.
    This is for documentation purposes.
    """
    
    # Example 1: EventListCreateView
    # Students can read, teachers/admins can create
    class EventListCreateView:
        permission_classes = [IsAuthenticated, IsTeacherOrAdmin]
        # Students: GET allowed, POST denied
        # Teachers: GET allowed, POST allowed
        # Admins: GET allowed, POST allowed
    
    # Example 2: EventRetrieveUpdateDestroyView
    # Students can read, only creator/admin can edit/delete
    class EventRetrieveUpdateDestroyView:
        permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
        # Students: GET allowed, PUT/DELETE denied
        # Teachers: GET allowed, PUT/DELETE allowed (if creator or admin)
        # Admins: GET allowed, PUT/DELETE allowed
    
    # Example 3: EventListView (read-only)
    # All authenticated users can read
    class EventListView:
        permission_classes = [IsAuthenticated, CanViewEvents]
        # Students: GET allowed
        # Teachers: GET allowed
        # Admins: GET allowed
    
    # Example 4: EventManagementView (admin only)
    # Only teachers and admins can manage
    class EventManagementView:
        permission_classes = [IsAuthenticated, IsStudentReadOnly]
        # Students: GET allowed, POST/PUT/DELETE denied
        # Teachers: GET allowed, POST/PUT/DELETE allowed
        # Admins: GET allowed, POST/PUT/DELETE allowed
