from rest_framework import generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import Http404, FileResponse
from django.utils import timezone
from datetime import timedelta

from .models import Resource
from .serializers import (
    ResourceSerializer, ResourceCreateSerializer, ResourceUpdateSerializer,
    ResourceListSerializer, ResourceDownloadSerializer, ResourceSearchSerializer
)
from .permissions import IsOwnerOrAdmin, IsOwnerOrAdminOrTeacher, IsTeacher, IsOwnerOrReadOnly, IsTeacherOrReadOnly
from users.permissions import IsTeacher as UserIsTeacher


class ResourceListCreateView(generics.ListCreateAPIView):
    """
    Combined view for listing and creating resources.
    GET /resources/ → list all resources
    POST /resources/ → upload resource (teachers only)
    """
    permission_classes = [IsAuthenticated, IsTeacherOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'resource_type', 'is_public', 'uploaded_by']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'title', 'download_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter resources based on user permissions."""
        queryset = Resource.objects.select_related('uploaded_by').all()
        
        # If user is not staff, only show public resources or their own
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(uploaded_by=self.request.user)
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method == 'POST':
            return ResourceCreateSerializer
        return ResourceListSerializer
    
    def perform_create(self, serializer):
        """Set the uploaded_by field to the current user."""
        serializer.save(uploaded_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create resource and return detailed response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        resource = serializer.save()
        
        # Return full resource details
        response_serializer = ResourceSerializer(resource, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ResourceRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Combined view for retrieving, updating, and destroying resources.
    GET /resources/<id>/ → retrieve one resource
    PUT /resources/<id>/ → update (owner/admin only)
    DELETE /resources/<id>/ → delete (owner/admin only)
    """
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """Filter resources based on user permissions."""
        queryset = Resource.objects.select_related('uploaded_by').all()
        
        # If user is not staff, only show accessible resources
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(uploaded_by=self.request.user)
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.request.method == 'GET':
            return ResourceSerializer
        return ResourceUpdateSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve resource and increment view count if accessed."""
        instance = self.get_object()
        
        # Increment view count (not download count)
        instance.views_count = getattr(instance, 'views_count', 0) + 1
        instance.save(update_fields=['views_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update resource and return full details."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        resource = serializer.save()
        
        # Return full resource details
        response_serializer = ResourceSerializer(resource, context={'request': request})
        return Response(response_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete resource with confirmation."""
        instance = self.get_object()
        resource_title = instance.title
        
        # Perform the deletion
        self.perform_destroy(instance)
        
        return Response(
            {'message': f'Resource "{resource_title}" has been successfully deleted.'},
            status=status.HTTP_204_NO_CONTENT
        )


class ResourceListView(generics.ListAPIView):
    """
    List all resources with pagination and filtering.
    Supports search by title, description, subject, and tags.
    """
    serializer_class = ResourceListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'resource_type', 'is_public', 'uploaded_by']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'title', 'download_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter resources based on user permissions."""
        queryset = Resource.objects.select_related('uploaded_by').all()
        
        # If user is not staff, only show public resources or their own
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(uploaded_by=self.request.user)
            )
        
        return queryset


class ResourceDetailView(generics.RetrieveAPIView):
    """
    Retrieve a single resource by ID.
    Includes full details and access control.
    """
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter resources based on user permissions."""
        queryset = Resource.objects.select_related('uploaded_by').all()
        
        # If user is not staff, only show accessible resources
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(uploaded_by=self.request.user)
            )
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve resource and increment download count if accessed."""
        instance = self.get_object()
        
        # Increment view count (not download count)
        instance.views_count = getattr(instance, 'views_count', 0) + 1
        instance.save(update_fields=['views_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ResourceUploadView(generics.CreateAPIView):
    """
    Upload a new resource (restricted to teachers).
    Handles both file uploads and URL resources.
    """
    serializer_class = ResourceCreateSerializer
    permission_classes = [IsAuthenticated, UserIsTeacher]
    
    def perform_create(self, serializer):
        """Set the uploaded_by field to the current user."""
        serializer.save(uploaded_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create resource and return detailed response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        resource = serializer.save()
        
        # Return full resource details
        response_serializer = ResourceSerializer(resource, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ResourceUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    Update and delete resources (owner, admin, or teacher).
    Teachers can manage any resource.
    """
    serializer_class = ResourceUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrTeacher]
    
    def get_queryset(self):
        """Filter resources based on user permissions."""
        queryset = Resource.objects.select_related('uploaded_by').all()
        
        # If user is not staff and not a teacher, only show their own resources
        if not self.request.user.is_staff and not (hasattr(self.request.user, 'role') and self.request.user.role == 'teacher'):
            queryset = queryset.filter(uploaded_by=self.request.user)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.request.method == 'GET':
            return ResourceSerializer
        return ResourceUpdateSerializer
    
    def update(self, request, *args, **kwargs):
        """Update resource and return full details."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        resource = serializer.save()
        
        # Return full resource details
        response_serializer = ResourceSerializer(resource, context={'request': request})
        return Response(response_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete resource with confirmation."""
        instance = self.get_object()
        resource_title = instance.title
        
        # Perform the deletion
        self.perform_destroy(instance)
        
        return Response(
            {'message': f'Resource "{resource_title}" has been successfully deleted.'},
            status=status.HTTP_204_NO_CONTENT
        )


class ResourceSearchView(generics.ListAPIView):
    """
    Advanced search for resources with multiple filters.
    Supports text search, subject filtering, date ranges, and more.
    """
    serializer_class = ResourceListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'resource_type', 'is_public', 'uploaded_by']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'title', 'download_count', 'views_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter resources based on search parameters and user permissions."""
        queryset = Resource.objects.select_related('uploaded_by').all()
        
        # Apply user permission filtering
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(uploaded_by=self.request.user)
            )
        
        # Get search parameters
        search_serializer = ResourceSearchSerializer(data=self.request.query_params)
        if search_serializer.is_valid():
            data = search_serializer.validated_data
            
            # Text search
            query = data.get('query')
            if query:
                queryset = queryset.filter(
                    Q(title__icontains=query) |
                    Q(description__icontains=query) |
                    Q(tags__icontains=query)
                )
            
            # Subject filter
            subject = data.get('subject')
            if subject:
                queryset = queryset.filter(subject=subject)
            
            # Resource type filter
            resource_type = data.get('resource_type')
            if resource_type:
                queryset = queryset.filter(resource_type=resource_type)
            
            # Public/Private filter
            is_public = data.get('is_public')
            if is_public is not None:
                queryset = queryset.filter(is_public=is_public)
            
            # Uploaded by filter
            uploaded_by = data.get('uploaded_by')
            if uploaded_by:
                queryset = queryset.filter(uploaded_by_id=uploaded_by)
            
            # Tags filter
            tags = data.get('tags')
            if tags:
                tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
                for tag in tag_list:
                    queryset = queryset.filter(tags__icontains=tag)
            
            # Date range filter
            date_from = data.get('date_from')
            date_to = data.get('date_to')
            if date_from:
                queryset = queryset.filter(created_at__date__gte=date_from)
            if date_to:
                queryset = queryset.filter(created_at__date__lte=date_to)
            
            # Ordering
            ordering = data.get('ordering', '-created_at')
            queryset = queryset.order_by(ordering)
        
        return queryset


class ResourceDownloadView(generics.RetrieveAPIView):
    """
    Handle resource downloads with access control and download tracking.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter resources based on user permissions."""
        queryset = Resource.objects.select_related('uploaded_by').all()
        
        # If user is not staff, only show accessible resources
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(uploaded_by=self.request.user)
            )
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Handle resource download."""
        resource = self.get_object()
        
        # Check if resource is accessible
        if not resource.is_accessible_by(request.user):
            return Response(
                {'error': 'You do not have permission to download this resource.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if it's a file resource
        if resource.resource_type != 'file' or not resource.file:
            return Response(
                {'error': 'This resource is not available for download.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Increment download count
        resource.download_count += 1
        resource.save(update_fields=['download_count'])
        
        # Return file for download
        try:
            # Get the original filename
            filename = resource.file.name.split('/')[-1]
            
            # Detect MIME type based on file extension
            import mimetypes
            
            # Add custom MIME type mappings for better support
            custom_mime_types = {
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.ppt': 'application/vnd.ms-powerpoint',
                '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.zip': 'application/zip',
                '.rar': 'application/x-rar-compressed',
                '.mp4': 'video/mp4',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.pdf': 'application/pdf',
                '.txt': 'text/plain',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            }
            
            # Get file extension
            file_extension = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
            
            # Use custom mapping if available, otherwise use mimetypes
            if file_extension in custom_mime_types:
                mime_type = custom_mime_types[file_extension]
            else:
                mime_type, _ = mimetypes.guess_type(filename)
                if not mime_type:
                    mime_type = 'application/octet-stream'
            
            # Create file response with proper headers
            response = FileResponse(
                resource.file,
                as_attachment=True,
                filename=filename
            )
            
            # Set proper headers for better download experience
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Content-Type'] = mime_type
            
            return response
        except FileNotFoundError:
            return Response(
                {'error': 'File not found on server.'},
                status=status.HTTP_404_NOT_FOUND
            )


class ResourceStatsView(generics.ListAPIView):
    """
    Get resource statistics for admin users.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = ResourceListSerializer
    
    def get_queryset(self):
        """Return resources for statistics."""
        return Resource.objects.select_related('uploaded_by').all()
    
    def list(self, request, *args, **kwargs):
        """Return resource statistics."""
        queryset = self.get_queryset()
        
        # Calculate statistics
        total_resources = queryset.count()
        public_resources = queryset.filter(is_public=True).count()
        private_resources = total_resources - public_resources
        
        file_resources = queryset.filter(resource_type='file').count()
        url_resources = queryset.filter(resource_type='url').count()
        
        total_downloads = sum(resource.download_count for resource in queryset)
        
        # Recent resources (last 7 days)
        recent_cutoff = timezone.now() - timedelta(days=7)
        recent_resources = queryset.filter(created_at__gte=recent_cutoff).count()
        
        # Subject breakdown
        subject_stats = {}
        for subject_code, subject_name in Resource.SUBJECT_CHOICES:
            count = queryset.filter(subject=subject_code).count()
            if count > 0:
                subject_stats[subject_name] = count
        
        # Top resources by downloads
        top_resources = queryset.order_by('-download_count')[:5]
        top_resources_data = ResourceListSerializer(top_resources, many=True, context={'request': request}).data
        
        stats = {
            'total_resources': total_resources,
            'public_resources': public_resources,
            'private_resources': private_resources,
            'file_resources': file_resources,
            'url_resources': url_resources,
            'total_downloads': total_downloads,
            'recent_resources': recent_resources,
            'subject_breakdown': subject_stats,
            'top_resources': top_resources_data
        }
        
        return Response(stats)


class ResourceManagementViewSet(ModelViewSet):
    """
    Admin-only resource management with full CRUD operations.
    """
    queryset = Resource.objects.select_related('uploaded_by').all()
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ResourceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ResourceUpdateSerializer
        elif self.action == 'list':
            return ResourceListSerializer
        else:
            return ResourceSerializer
    
    @action(detail=True, methods=['post'])
    def toggle_public(self, request, pk=None):
        """Toggle resource public/private status."""
        resource = self.get_object()
        resource.is_public = not resource.is_public
        resource.save(update_fields=['is_public'])
        
        status_text = 'public' if resource.is_public else 'private'
        return Response({
            'message': f'Resource "{resource.title}" is now {status_text}.',
            'is_public': resource.is_public
        })
    
    @action(detail=True, methods=['post'])
    def reset_downloads(self, request, pk=None):
        """Reset download count for a resource."""
        resource = self.get_object()
        old_count = resource.download_count
        resource.download_count = 0
        resource.save(update_fields=['download_count'])
        
        return Response({
            'message': f'Download count reset from {old_count} to 0.',
            'download_count': resource.download_count
        })
    
    @action(detail=False, methods=['get'])
    def bulk_actions(self, request):
        """Get available bulk actions for admin."""
        actions = [
            {'name': 'make_public', 'description': 'Make selected resources public'},
            {'name': 'make_private', 'description': 'Make selected resources private'},
            {'name': 'delete_selected', 'description': 'Delete selected resources'},
            {'name': 'reset_downloads', 'description': 'Reset download counts'},
        ]
        return Response(actions)
