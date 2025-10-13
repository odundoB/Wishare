from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, StudentProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Handles username, email, password, and role validation.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'role', 'first_name', 'last_name')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate_email(self, value):
        """Ensure email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Ensure username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        """Create a new user with hashed password."""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Accepts username/email and password.
    """
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate user credentials."""
        username_or_email = attrs.get('username_or_email')
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
                attrs['user'] = user
                return attrs
            else:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'username_or_email' and 'password'.")


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for returning user profile information.
    Excludes sensitive fields like password.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'role', 'role_display', 'profile_photo', 
            'profile_photo_url', 'date_joined', 'last_login', 'is_active'
        )
        read_only_fields = ('id', 'username', 'date_joined', 'last_login')
    
    def get_full_name(self, obj):
        """Return user's full name."""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_profile_photo_url(self, obj):
        """Return the URL of the profile photo if it exists."""
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for users to update their own profile.
    Excludes sensitive fields and role changes.
    """
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email')
    
    def validate_email(self, value):
        """Ensure email is unique (excluding current user)."""
        if self.instance and User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value


class UserManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for admin user management.
    Allows viewing and editing all user fields including role and permissions.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'role', 'role_display', 'password',
            'is_active', 'is_staff', 'is_superuser', 
            'date_joined', 'last_login'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')
    
    def get_full_name(self, obj):
        """Return user's full name."""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def validate_email(self, value):
        """Ensure email is unique (excluding current user)."""
        if self.instance and User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Ensure username is unique (excluding current user)."""
        if self.instance and User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def update(self, instance, validated_data):
        """Update user, handling password separately."""
        password = validated_data.pop('password', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for user lists.
    Used in admin interfaces and user listings.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'role', 'role_display', 'is_active', 
            'date_joined', 'last_login'
        )
    
    def get_full_name(self, obj):
        """Return user's full name."""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
    
    def validate(self, attrs):
        """Validate new password confirmation."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def save(self):
        """Update user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for StudentProfile model.
    Handles all student profile fields including profile picture.
    """
    profile_picture_url = serializers.SerializerMethodField()
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    year_display = serializers.CharField(source='get_year_of_study_display', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'user_username', 'user_email', 'full_name', 'email', 'username',
            'gender', 'gender_display', 'date_of_birth', 'bio', 'profile_picture',
            'profile_picture_url', 'department', 'year_of_study', 'year_display',
            'contact', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def get_profile_picture_url(self, obj):
        """Return the URL of the profile picture if it exists."""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def validate_email(self, value):
        """Ensure email is unique (excluding current user)."""
        if self.instance and StudentProfile.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A student profile with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Ensure username is unique (excluding current user)."""
        if self.instance and StudentProfile.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A student profile with this username already exists.")
        return value
    
    def validate_date_of_birth(self, value):
        """Validate date of birth is not in the future."""
        if value:
            from django.utils import timezone
            if value > timezone.now().date():
                raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value
    
    def create(self, validated_data):
        """Create a new student profile."""
        # Ensure the user field is set to the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update student profile."""
        # Update the profile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class StudentProfileCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating student profiles.
    Simplified version for initial profile creation.
    """
    class Meta:
        model = StudentProfile
        fields = [
            'full_name', 'email', 'username', 'gender', 'date_of_birth',
            'bio', 'profile_picture', 'department', 'year_of_study', 'contact'
        ]
    
    def validate_email(self, value):
        """Ensure email is unique."""
        if StudentProfile.objects.filter(email=value).exists():
            raise serializers.ValidationError("A student profile with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Ensure username is unique."""
        if StudentProfile.objects.filter(username=value).exists():
            raise serializers.ValidationError("A student profile with this username already exists.")
        return value
    
    def create(self, validated_data):
        """Create a new student profile."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
