from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.utils import timezone
import os

User = get_user_model()


def resource_file_path(instance, filename):
    """Generate file path for resource uploads."""
    # Create a folder structure: resources/year/month/filename
    date = timezone.now()
    return os.path.join('resources', str(date.year), str(date.month), filename)


class Resource(models.Model):
    """
    Model for storing educational resources.
    Supports both file uploads and external URL links.
    """
    
    SUBJECT_CHOICES = [
        ('mathematics', 'Mathematics'),
        ('science', 'Science'),
        ('english', 'English'),
        ('history', 'History'),
        ('geography', 'Geography'),
        ('art', 'Art'),
        ('music', 'Music'),
        ('physical_education', 'Physical Education'),
        ('computer_science', 'Computer Science'),
        ('foreign_language', 'Foreign Language'),
        ('other', 'Other'),
    ]
    
    RESOURCE_TYPE_CHOICES = [
        ('file', 'File Upload'),
        ('url', 'External Link'),
    ]
    
    title = models.CharField(
        max_length=200,
        help_text="Title of the resource"
    )
    
    description = models.TextField(
        help_text="Detailed description of the resource"
    )
    
    resource_type = models.CharField(
        max_length=10,
        choices=RESOURCE_TYPE_CHOICES,
        default='file',
        help_text="Type of resource: file upload or external link"
    )
    
    file = models.FileField(
        upload_to=resource_file_path,
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav']
            )
        ],
        help_text="Upload a file (PDF, DOC, PPT, images, videos, etc.)"
    )
    
    url = models.URLField(
        blank=True,
        null=True,
        help_text="External link to the resource"
    )
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_resources',
        help_text="User who uploaded this resource"
    )
    
    subject = models.CharField(
        max_length=50,
        choices=SUBJECT_CHOICES,
        help_text="Subject category of the resource"
    )
    
    tags = models.CharField(
        max_length=500,
        blank=True,
        help_text="Comma-separated tags for better searchability"
    )
    
    is_public = models.BooleanField(
        default=True,
        help_text="Whether this resource is visible to all users"
    )
    
    download_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times this resource has been downloaded"
    )
    
    file_size = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="File size in bytes"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this resource was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this resource was last updated"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Resource'
        verbose_name_plural = 'Resources'
        indexes = [
            models.Index(fields=['subject']),
            models.Index(fields=['created_at']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_subject_display()})"
    
    def save(self, *args, **kwargs):
        """Override save to calculate file size and validate resource type."""
        # Validate that either file or url is provided
        if not self.file and not self.url:
            raise ValueError("Either file or URL must be provided")
        
        if self.file and self.url:
            raise ValueError("Cannot have both file and URL")
        
        # Set resource type based on what's provided
        if self.file:
            self.resource_type = 'file'
            # Calculate file size
            if hasattr(self.file, 'size'):
                self.file_size = self.file.size
        elif self.url:
            self.resource_type = 'url'
            self.file_size = None
        
        super().save(*args, **kwargs)
    
    def get_file_extension(self):
        """Get file extension if it's a file upload."""
        if self.file and self.resource_type == 'file':
            return os.path.splitext(self.file.name)[1].lower()
        return None
    
    def get_file_size_display(self):
        """Return human-readable file size."""
        if not self.file_size:
            return "N/A"
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"
    
    def increment_download_count(self):
        """Increment download count."""
        self.download_count += 1
        self.save(update_fields=['download_count'])
    
    def get_tags_list(self):
        """Return tags as a list."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    def is_accessible_by(self, user):
        """Check if user can access this resource."""
        if self.is_public:
            return True
        return self.uploaded_by == user or user.is_staff
