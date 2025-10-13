from rest_framework import serializers
from typing import Dict, Any, Optional
from django.urls import reverse


class BaseSearchResultSerializer(serializers.Serializer):
    """
    Base serializer for all search results with consistent fields.
    """
    model_type = serializers.CharField(help_text="Type of model (resource, article, forum, job)")
    title = serializers.CharField(help_text="Title of the result")
    description = serializers.CharField(help_text="Description or snippet of the result")
    link = serializers.URLField(help_text="URL to view details")
    
    # Optional additional fields
    id = serializers.IntegerField(required=False, help_text="Unique identifier")
    created_at = serializers.DateTimeField(required=False, help_text="Creation timestamp")
    updated_at = serializers.DateTimeField(required=False, help_text="Last update timestamp")
    author = serializers.CharField(required=False, allow_null=True, help_text="Author or uploader")
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
        help_text="Tags associated with the result"
    )
    metadata = serializers.DictField(required=False, help_text="Additional metadata")


class ResourceSearchResultSerializer(BaseSearchResultSerializer):
    """
    Serializer for resource search results.
    """
    model_type = serializers.CharField(default="resource", read_only=True)
    resource_type = serializers.CharField(required=False, help_text="Type of resource (file, url)")
    subject = serializers.CharField(required=False, allow_null=True, help_text="Subject area")
    is_public = serializers.BooleanField(required=False, help_text="Whether resource is public")
    download_count = serializers.IntegerField(required=False, help_text="Number of downloads")
    file_url = serializers.URLField(required=False, allow_null=True, help_text="Direct file URL")
    external_url = serializers.URLField(required=False, allow_null=True, help_text="External URL")
    
    def to_representation(self, instance):
        """Convert resource instance to search result format."""
        if isinstance(instance, dict):
            # Already formatted data
            return instance
        
        # Convert Resource model instance
        data = {
            'model_type': 'resource',
            'id': instance.id,
            'title': instance.title,
            'description': self._create_snippet(instance.description),
            'link': reverse('resource-detail', args=[instance.id]),
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
            'author': instance.uploaded_by.username if instance.uploaded_by else None,
            'tags': instance.get_tags_list() if hasattr(instance, 'get_tags_list') else [],
            'resource_type': instance.resource_type,
            'subject': instance.get_subject_display(),
            'is_public': instance.is_public,
            'download_count': instance.download_count,
            'metadata': {
                'file_size': getattr(instance, 'file_size', None),
                'file_extension': getattr(instance, 'file_extension', None),
            }
        }
        
        # Add file-specific URLs
        if instance.resource_type == 'file' and instance.file:
            data['file_url'] = instance.file.url
        elif instance.resource_type == 'url' and instance.url:
            data['external_url'] = instance.url
        
        return data
    
    def _create_snippet(self, text: str, max_length: int = 150) -> str:
        """Create a snippet from text."""
        if not text:
            return ""
        
        if len(text) <= max_length:
            return text
        
        # Find last complete word within limit
        snippet = text[:max_length]
        last_space = snippet.rfind(' ')
        if last_space > max_length * 0.8:  # If we can find a good break point
            snippet = snippet[:last_space]
        
        return snippet + "..."


class ArticleSearchResultSerializer(BaseSearchResultSerializer):
    """
    Serializer for article search results (placeholder for future implementation).
    """
    model_type = serializers.CharField(default="article", read_only=True)
    category = serializers.CharField(required=False, allow_null=True, help_text="Article category")
    status = serializers.CharField(required=False, help_text="Publication status")
    view_count = serializers.IntegerField(required=False, help_text="Number of views")
    
    def to_representation(self, instance):
        """Convert article instance to search result format."""
        if isinstance(instance, dict):
            return instance
        
        # Placeholder implementation
        return {
            'model_type': 'article',
            'id': getattr(instance, 'id', None),
            'title': getattr(instance, 'title', ''),
            'description': self._create_snippet(getattr(instance, 'body', '')),
            'link': f'/api/articles/{getattr(instance, "id", "")}/',
            'created_at': getattr(instance, 'created_at', None),
            'updated_at': getattr(instance, 'updated_at', None),
            'author': getattr(instance, 'author', {}).get('username', '') if hasattr(instance, 'author') else None,
            'category': getattr(instance, 'category', None),
            'status': getattr(instance, 'status', None),
            'view_count': getattr(instance, 'view_count', 0),
        }
    
    def _create_snippet(self, text: str, max_length: int = 150) -> str:
        """Create a snippet from text."""
        if not text:
            return ""
        
        if len(text) <= max_length:
            return text
        
        snippet = text[:max_length]
        last_space = snippet.rfind(' ')
        if last_space > max_length * 0.8:
            snippet = snippet[:last_space]
        
        return snippet + "..."


class ForumSearchResultSerializer(BaseSearchResultSerializer):
    """
    Serializer for forum search results (placeholder for future implementation).
    """
    model_type = serializers.CharField(default="forum", read_only=True)
    forum_category = serializers.CharField(required=False, allow_null=True, help_text="Forum category")
    reply_count = serializers.IntegerField(required=False, help_text="Number of replies")
    is_pinned = serializers.BooleanField(required=False, help_text="Whether topic is pinned")
    last_activity = serializers.DateTimeField(required=False, help_text="Last activity timestamp")
    
    def to_representation(self, instance):
        """Convert forum instance to search result format."""
        if isinstance(instance, dict):
            return instance
        
        # Placeholder implementation
        return {
            'model_type': 'forum',
            'id': getattr(instance, 'id', None),
            'title': getattr(instance, 'title', ''),
            'description': self._create_snippet(getattr(instance, 'content', '')),
            'link': f'/api/forum/{getattr(instance, "id", "")}/',
            'created_at': getattr(instance, 'created_at', None),
            'updated_at': getattr(instance, 'updated_at', None),
            'author': getattr(instance, 'author', {}).get('username', '') if hasattr(instance, 'author') else None,
            'forum_category': getattr(instance, 'category', None),
            'reply_count': getattr(instance, 'reply_count', 0),
            'is_pinned': getattr(instance, 'is_pinned', False),
            'last_activity': getattr(instance, 'last_activity', None),
        }
    
    def _create_snippet(self, text: str, max_length: int = 150) -> str:
        """Create a snippet from text."""
        if not text:
            return ""
        
        if len(text) <= max_length:
            return text
        
        snippet = text[:max_length]
        last_space = snippet.rfind(' ')
        if last_space > max_length * 0.8:
            snippet = snippet[:last_space]
        
        return snippet + "..."


class JobSearchResultSerializer(BaseSearchResultSerializer):
    """
    Serializer for job search results (placeholder for future implementation).
    """
    model_type = serializers.CharField(default="job", read_only=True)
    company = serializers.CharField(required=False, allow_null=True, help_text="Company name")
    location = serializers.CharField(required=False, allow_null=True, help_text="Job location")
    job_type = serializers.CharField(required=False, help_text="Type of job (full-time, part-time, etc.)")
    salary_range = serializers.CharField(required=False, allow_null=True, help_text="Salary range")
    application_deadline = serializers.DateTimeField(required=False, help_text="Application deadline")
    
    def to_representation(self, instance):
        """Convert job instance to search result format."""
        if isinstance(instance, dict):
            return instance
        
        # Placeholder implementation
        return {
            'model_type': 'job',
            'id': getattr(instance, 'id', None),
            'title': getattr(instance, 'title', ''),
            'description': self._create_snippet(getattr(instance, 'description', '')),
            'link': f'/api/jobs/{getattr(instance, "id", "")}/',
            'created_at': getattr(instance, 'created_at', None),
            'updated_at': getattr(instance, 'updated_at', None),
            'author': getattr(instance, 'posted_by', {}).get('username', '') if hasattr(instance, 'posted_by') else None,
            'company': getattr(instance, 'company', None),
            'location': getattr(instance, 'location', None),
            'job_type': getattr(instance, 'job_type', None),
            'salary_range': getattr(instance, 'salary_range', None),
            'application_deadline': getattr(instance, 'application_deadline', None),
        }
    
    def _create_snippet(self, text: str, max_length: int = 150) -> str:
        """Create a snippet from text."""
        if not text:
            return ""
        
        if len(text) <= max_length:
            return text
        
        snippet = text[:max_length]
        last_space = snippet.rfind(' ')
        if last_space > max_length * 0.8:
            snippet = snippet[:last_space]
        
        return snippet + "..."


class UnifiedSearchResponseSerializer(serializers.Serializer):
    """
    Serializer for the unified search response with pagination.
    """
    query = serializers.CharField(help_text="Search query")
    total_results = serializers.IntegerField(help_text="Total number of results")
    results = BaseSearchResultSerializer(many=True, help_text="Search results")
    
    # Pagination fields
    page = serializers.IntegerField(help_text="Current page number")
    page_size = serializers.IntegerField(help_text="Number of results per page")
    total_pages = serializers.IntegerField(help_text="Total number of pages")
    has_next = serializers.BooleanField(help_text="Whether there is a next page")
    has_previous = serializers.BooleanField(help_text="Whether there is a previous page")
    next_page = serializers.URLField(required=False, allow_null=True, help_text="URL for next page")
    previous_page = serializers.URLField(required=False, allow_null=True, help_text="URL for previous page")
    
    # Results by category
    results_by_category = serializers.DictField(
        help_text="Results grouped by category with counts"
    )
    
    # Optional metadata
    search_time = serializers.FloatField(required=False, help_text="Search execution time in seconds")
    searched_apps = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of apps that were searched"
    )
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Search suggestions"
    )
    filters_applied = serializers.DictField(
        required=False,
        help_text="Filters that were applied to the search"
    )


class SearchResultFactory:
    """
    Factory class to create appropriate serializers for different model types.
    """
    
    _serializers = {
        'resource': ResourceSearchResultSerializer,
        'article': ArticleSearchResultSerializer,
        'forum': ForumSearchResultSerializer,
        'job': JobSearchResultSerializer,
    }
    
    @classmethod
    def get_serializer(cls, model_type: str):
        """Get the appropriate serializer for a model type."""
        return cls._serializers.get(model_type, BaseSearchResultSerializer)
    
    @classmethod
    def serialize_result(cls, instance, model_type: str) -> Dict[str, Any]:
        """Serialize a single result using the appropriate serializer."""
        serializer_class = cls.get_serializer(model_type)
        serializer = serializer_class()
        return serializer.to_representation(instance)
    
    @classmethod
    def serialize_results(cls, instances, model_type: str) -> list:
        """Serialize multiple results using the appropriate serializer."""
        serializer_class = cls.get_serializer(model_type)
        serializer = serializer_class(many=True)
        return serializer.to_representation(instances)
