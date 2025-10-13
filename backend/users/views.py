from rest_framework import status, generics, viewsets, permissions, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .permissions import (
    IsAdminUserOrReadOnly, IsTeacher, IsStudent, IsTeacherOrReadOnly,
    IsStudentOrReadOnly, IsOwnerOrAdmin, IsOwnerOrTeacher, IsOwnerOrAdminOrTeacher,
    IsTeacherOrStudent, IsActiveUser, IsOwnerOrReadOnly, IsAdminOrTeacher,
    IsAdminOrTeacherOrOwner
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from .models import User, StudentProfile
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserDetailSerializer,
    UserManagementSerializer, UserUpdateSerializer, UserListSerializer,
    ChangePasswordSerializer, StudentProfileSerializer, StudentProfileCreateSerializer
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that allows login with username or email.
    """
    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        
        if username_or_email and password:
            # Try to authenticate with username first
            user = authenticate(username=username_or_email, password=password)
            
            # If username fails, try with email
            if not user:
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("User account is disabled.")
                
                # Add custom claims to the token
                refresh = self.get_token(user)
                data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserDetailSerializer(user).data
                }
                return data
            else:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.")


class UserRegisterView(generics.CreateAPIView):
    """
    API view for user registration.
    Allows new users to create accounts with role assignment.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully',
                'user': UserDetailSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(TokenObtainPairView):
    """
    API view for user login.
    Returns JWT tokens upon successful authentication.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(generics.GenericAPIView):
    """
    API view for user logout.
    Blacklists the refresh token to invalidate it.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                    return Response({
                        'message': 'Successfully logged out'
                    }, status=status.HTTP_200_OK)
                except Exception as token_error:
                    # Token might already be blacklisted or invalid
                    return Response({
                        'message': 'Successfully logged out (token was already invalid)'
                    }, status=status.HTTP_200_OK)
            else:
                # If no refresh token provided, just return success
                # This allows frontend to logout even without refresh token
                return Response({
                    'message': 'Successfully logged out'
                }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


# class UserProfileView(generics.RetrieveUpdateAPIView):
#     """
#     API view for user profile management.
#     Allows users to view and update their own profile.
#     """
#     serializer_class = UserDetailSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_object(self):
#         return self.request.user
    
#     def get_serializer_class(self):
#         if self.request.method in ['PUT', 'PATCH']:
#             return UserUpdateSerializer
#         return UserDetailSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    user = request.user
    serializer = UserDetailSerializer(user)
    return Response(serializer.data)


class ChangePasswordView(generics.GenericAPIView):
    """
    API view for changing user password.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfilePhotoView(generics.GenericAPIView):
    """
    API view for managing user profile photos.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Upload or update profile photo."""
        if 'photo' not in request.FILES:
            return Response(
                {'error': 'No photo file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        photo = request.FILES['photo']
        
        # Validate file type
        if not photo.content_type.startswith('image/'):
            return Response(
                {'error': 'File must be an image'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        if photo.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File size must be less than 5MB'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user profile photo
        user = request.user
        user.profile_photo = photo
        user.save()
        
        # Return updated user data
        serializer = UserDetailSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request):
        """Delete profile photo."""
        user = request.user
        if user.profile_photo:
            user.profile_photo.delete()
            user.profile_photo = None
            user.save()
        
        # Return updated user data
        serializer = UserDetailSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin user management.
    Allows admins to list, create, update, and delete users.
    Teachers can view users, but only admins can modify them.
    """
    queryset = User.objects.all()
    permission_classes = [IsAdminUserOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return UserManagementSerializer
        return UserDetailSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'list':
            # Allow authenticated users to list users
            permission_classes = [IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only admins can modify users
            permission_classes = [IsAdminUser]
        else:
            # For other actions, use the default permission
            permission_classes = [IsAdminUserOrReadOnly]
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account."""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({
            'message': f'User {user.username} has been activated'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({
            'message': f'User {user.username} has been deactivated'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password (admin only)."""
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response({
                'error': 'New password is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': f'Password reset successfully for user {user.username}'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def by_role(self, request):
        """Get users filtered by role."""
        role = request.query_params.get('role')
        if role not in ['student', 'teacher']:
            return Response({
                'error': 'Invalid role. Must be "student" or "teacher"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(role=role)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class UserStatsView(generics.GenericAPIView):
    """
    API view for user statistics (admin only).
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        students = User.objects.filter(role='student').count()
        teachers = User.objects.filter(role='teacher').count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'students': students,
            'teachers': teachers,
            'last_updated': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)


class TeacherOnlyView(generics.GenericAPIView):
    """
    Example view that only teachers can access.
    """
    permission_classes = [IsTeacher]
    
    def get(self, request):
        return Response({
            'message': 'This view is only accessible to teachers',
            'user_role': request.user.role,
            'user_name': request.user.username
        }, status=status.HTTP_200_OK)


class StudentOnlyView(generics.GenericAPIView):
    """
    Example view that only students can access.
    """
    permission_classes = [IsStudent]
    
    def get(self, request):
        return Response({
            'message': 'This view is only accessible to students',
            'user_role': request.user.role,
            'user_name': request.user.username
        }, status=status.HTTP_200_OK)


class TeacherOrStudentView(generics.GenericAPIView):
    """
    Example view that teachers and students can access, but not admins.
    """
    permission_classes = [IsTeacherOrStudent]
    
    def get(self, request):
        return Response({
            'message': 'This view is accessible to teachers and students',
            'user_role': request.user.role,
            'user_name': request.user.username
        }, status=status.HTTP_200_OK)


class AdminOrTeacherView(generics.GenericAPIView):
    """
    Example view that admins and teachers can access.
    """
    permission_classes = [IsAdminOrTeacher]
    
    def get(self, request):
        return Response({
            'message': 'This view is accessible to admins and teachers',
            'user_role': request.user.role,
            'is_admin': request.user.is_staff,
            'user_name': request.user.username
        }, status=status.HTTP_200_OK)


class StudentProfileDetailView(generics.RetrieveAPIView):
    """
    View for retrieving current student's profile.
    GET /api/users/profile/ → retrieve current student's profile
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StudentProfileSerializer
    
    def get_object(self):
        """Get or create the student profile for the current user."""
        profile, created = StudentProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'full_name': f"{self.request.user.first_name} {self.request.user.last_name}".strip() or self.request.user.username,
                'email': self.request.user.email,
                'username': self.request.user.username,
                'department': 'Not specified',
                'year_of_study': 1
            }
        )
        return profile


class StudentProfileUpdateView(generics.UpdateAPIView):
    """
    View for updating current student's profile.
    PUT /api/users/profile/update/ → update current student's profile
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StudentProfileSerializer
    
    def get_object(self):
        """Get or create the student profile for the current user."""
        profile, created = StudentProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'full_name': f"{self.request.user.first_name} {self.request.user.last_name}".strip() or self.request.user.username,
                'email': self.request.user.email,
                'username': self.request.user.username,
                'department': 'Not specified',
                'year_of_study': 1
            }
        )
        return profile
    
    def update(self, request, *args, **kwargs):
        """Update the student profile."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data, status=status.HTTP_200_OK)