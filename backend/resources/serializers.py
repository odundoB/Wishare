from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from .models import Resource

User = get_user_model()


class ResourceSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying full resource details.
    Includes uploaded_by user information and computed fields.
    """
    uploaded_by = serializers.StringRelatedField(read_only=True)
    uploaded_by_id = serializers.IntegerField(source='uploaded_by.id', read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    uploaded_by_role = serializers.CharField(source='uploaded_by.role', read_only=True)
    
    subject_display = serializers.CharField(source='get_subject_display', read_only=True)
    file_extension = serializers.CharField(source='get_file_extension', read_only=True)
    file_size_display = serializers.CharField(source='get_file_size_display', read_only=True)
    form_level_display = serializers.CharField(source='get_form_level_display', read_only=True)
    
    file_url = serializers.SerializerMethodField()
    is_accessible = serializers.SerializerMethodField()
    
    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'resource_type', 'file', 'url',
            'uploaded_by', 'uploaded_by_id', 'uploaded_by_username', 
            'uploaded_by_email', 'uploaded_by_role',
            'subject', 'subject_display', 'form_level', 'form_level_display',
            'is_public', 'download_count', 'file_size', 'file_size_display',
            'file_extension', 'file_url', 'is_accessible',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'uploaded_by_id', 'uploaded_by_username',
            'uploaded_by_email', 'uploaded_by_role', 'download_count',
            'file_size', 'file_extension', 'file_size_display', 'form_level_display',
            'is_accessible', 'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        """Get the file URL if it's a file upload."""
        if obj.file and obj.resource_type == 'file':
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_is_accessible(self, obj):
        """Check if the current user can access this resource."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.is_accessible_by(request.user)
        return obj.is_public


class ResourceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating resources (primarily for teachers).
    Handles file uploads and URL resources with validation.
    """
    file = serializers.FileField(
        required=False,
        allow_null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 
                                 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif', 
                                 'mp4', 'mp3', 'wav']
            )
        ]
    )
    
    url = serializers.URLField(required=False, allow_blank=True)
    form_level = serializers.CharField(required=True)
    
    class Meta:
        model = Resource
        fields = [
            'title', 'description', 'file', 'url', 'subject', 'form_level', 'is_public'
        ]
    
    def validate(self, attrs):
        """Validate that either file or URL is provided, but not both."""
        file = attrs.get('file')
        url = attrs.get('url')
        
        # Check if both file and URL are provided
        if file and url:
            raise serializers.ValidationError(
                "Cannot provide both file and URL. Please choose one."
            )
        
        # Check if neither file nor URL is provided
        if not file and not url:
            raise serializers.ValidationError(
                "Either file or URL must be provided."
            )
        
        # Validate file size (max 50MB)
        if file and hasattr(file, 'size'):
            max_size = 50 * 1024 * 1024  # 50MB
            if file.size > max_size:
                raise serializers.ValidationError(
                    f"File size too large. Maximum size allowed is {max_size // (1024*1024)}MB."
                )
        
        return attrs
    
    def validate_title(self, value):
        """Validate title length and content."""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long.")
        
        if len(value) > 200:
            raise serializers.ValidationError("Title must be no more than 200 characters.")
        
        return value.strip()
    
    def validate_description(self, value):
        """Validate description content."""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Description must be at least 5 characters long.")
        
        return value.strip()
    
    def validate_tags(self, value):
        """Validate and clean tags."""
        if value:
            # Split by comma and clean
            tags = [tag.strip() for tag in value.split(',') if tag.strip()]
            
            # Check for too many tags
            if len(tags) > 10:
                raise serializers.ValidationError("Maximum 10 tags allowed.")
            
            # Check tag length
            for tag in tags:
                if len(tag) > 50:
                    raise serializers.ValidationError("Each tag must be no more than 50 characters.")
            
            return ', '.join(tags)
        
        return value
    
    def create(self, validated_data):
        """Create a new resource with the current user as uploader."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['uploaded_by'] = request.user
        else:
            raise serializers.ValidationError("User must be authenticated to create resources.")
        
        return super().create(validated_data)


class ResourceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing resources.
    Allows partial updates with validation.
    """
    file = serializers.FileField(
        required=False,
        allow_null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 
                                 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif', 
                                 'mp4', 'mp3', 'wav']
            )
        ]
    )
    
    url = serializers.URLField(required=False, allow_blank=True)
    form_level = serializers.CharField(required=False)
    
    class Meta:
        model = Resource
        fields = [
            'title', 'description', 'file', 'url', 'subject', 'form_level', 'is_public'
        ]
    
    def validate(self, attrs):
        """Validate resource update data."""
        file = attrs.get('file')
        url = attrs.get('url')
        
        # Get current instance data
        instance = self.instance
        current_file = instance.file if instance else None
        current_url = instance.url if instance else None
        
        # Determine final values (new or existing)
        final_file = file if file is not None else current_file
        final_url = url if url is not None else current_url
        
        # Check if both file and URL would be set
        if final_file and final_url:
            raise serializers.ValidationError(
                "Cannot have both file and URL. Please choose one."
            )
        
        # Check if neither file nor URL would be set
        if not final_file and not final_url:
            raise serializers.ValidationError(
                "Either file or URL must be provided."
            )
        
        # Validate file size if new file is provided
        if file and hasattr(file, 'size'):
            max_size = 50 * 1024 * 1024  # 50MB
            if file.size > max_size:
                raise serializers.ValidationError(
                    f"File size too large. Maximum size allowed is {max_size // (1024*1024)}MB."
                )
        
        return attrs
    
    def validate_title(self, value):
        """Validate title length and content."""
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long.")
        
        if value and len(value) > 200:
            raise serializers.ValidationError("Title must be no more than 200 characters.")
        
        return value.strip() if value else value
    
    def validate_description(self, value):
        """Validate description content."""
        if value and len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long.")
        
        return value.strip() if value else value
    
    def validate_tags(self, value):
        """Validate and clean tags."""
        if value:
            # Split by comma and clean
            tags = [tag.strip() for tag in value.split(',') if tag.strip()]
            
            # Check for too many tags
            if len(tags) > 10:
                raise serializers.ValidationError("Maximum 10 tags allowed.")
            
            # Check tag length
            for tag in tags:
                if len(tag) > 50:
                    raise serializers.ValidationError("Each tag must be no more than 50 characters.")
            
            return ', '.join(tags)
        
        return value


class ResourceListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for resource listings.
    Optimized for performance with minimal data.
    """
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    subject_display = serializers.CharField(source='get_subject_display', read_only=True)
    file_extension = serializers.CharField(source='get_file_extension', read_only=True)
    file_size_display = serializers.CharField(source='get_file_size_display', read_only=True)
    form_level_display = serializers.CharField(source='get_form_level_display', read_only=True)
    
    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'resource_type', 'subject', 'subject_display',
            'uploaded_by_username', 'form_level', 'form_level_display', 'is_public', 'download_count',
            'file_extension', 'file_size_display', 'created_at'
        ]


class ResourceDownloadSerializer(serializers.Serializer):
    """
    Serializer for handling resource downloads.
    Tracks download count and validates access.
    """
    resource_id = serializers.IntegerField()
    
    def validate_resource_id(self, value):
        """Validate that the resource exists and is accessible."""
        try:
            resource = Resource.objects.get(id=value)
        except Resource.DoesNotExist:
            raise serializers.ValidationError("Resource not found.")
        
        # Check if user can access this resource
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if not resource.is_accessible_by(request.user):
                raise serializers.ValidationError("You don't have permission to access this resource.")
        
        return value


class ResourceSearchSerializer(serializers.Serializer):
    """
    Serializer for resource search functionality.
    """
    query = serializers.CharField(max_length=200, required=False)
    subject = serializers.ChoiceField(choices=Resource.SUBJECT_CHOICES, required=False)
    resource_type = serializers.ChoiceField(choices=Resource.RESOURCE_TYPE_CHOICES, required=False)
    is_public = serializers.BooleanField(required=False)
    uploaded_by = serializers.IntegerField(required=False)
    tags = serializers.CharField(max_length=200, required=False)
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    ordering = serializers.ChoiceField(
        choices=[
            ('-created_at', 'Newest First'),
            ('created_at', 'Oldest First'),
            ('title', 'Title A-Z'),
            ('-title', 'Title Z-A'),
            ('-download_count', 'Most Downloaded'),
            ('download_count', 'Least Downloaded'),
        ],
        required=False,
        default='-created_at'
    )
