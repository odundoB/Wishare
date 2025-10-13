from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
import logging

from .services import SearchService
from .serializers import (
    SearchRequestSerializer, SearchResponseSerializer, SearchSuggestionSerializer,
    PopularSearchesSerializer, SearchStatsSerializer, AdvancedSearchSerializer
)

logger = logging.getLogger(__name__)


class SearchView(generics.GenericAPIView):
    """
    Main search endpoint that queries multiple apps and returns structured results.
    
    Access: All authenticated users (students and teachers)
    Denied: Non-authenticated users
    """
    serializer_class = SearchRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        """Perform comprehensive search across multiple apps."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        query = serializer.validated_data['query']
        app_types = serializer.validated_data.get('app_types')
        limit_per_app = serializer.validated_data.get('limit_per_app', 10)
        include_suggestions = serializer.validated_data.get('include_suggestions', False)
        
        # Perform search
        search_service = SearchService()
        results = search_service.search(
            query=query,
            app_types=app_types,
            user=request.user,
            limit_per_app=limit_per_app
        )
        
        # Add suggestions if requested
        if include_suggestions:
            suggestions = search_service.get_search_suggestions(query)
            results['suggestions'] = suggestions
        
        # Serialize response
        response_serializer = SearchResponseSerializer(results)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    def get(self, request, *args, **kwargs):
        """GET method for simple search queries."""
        query = request.GET.get('q', '').strip()
        app_types = request.GET.getlist('apps')
        limit_per_app = int(request.GET.get('limit', 10))
        
        if not query:
            return Response({
                'error': 'Query parameter "q" is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Perform search
        search_service = SearchService()
        results = search_service.search(
            query=query,
            app_types=app_types if app_types else None,
            user=request.user,
            limit_per_app=limit_per_app
        )
        
        # Serialize response
        response_serializer = SearchResponseSerializer(results)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_suggestions(request):
    """
    Get search suggestions based on partial query.
    
    Access: All authenticated users (students and teachers)
    Denied: Non-authenticated users
    """
    query = request.GET.get('q', '').strip()
    
    if not query or len(query) < 2:
        return Response({
            'suggestions': []
        }, status=status.HTTP_200_OK)
    
    search_service = SearchService()
    suggestions = search_service.get_search_suggestions(query)
    
    serializer = SearchSuggestionSerializer({'suggestions': suggestions})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def popular_searches(request):
    """
    Get popular search terms.
    
    Access: All authenticated users (students and teachers)
    Denied: Non-authenticated users
    """
    search_service = SearchService()
    popular_searches = search_service.get_popular_searches()
    
    serializer = PopularSearchesSerializer({'popular_searches': popular_searches})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_stats(request):
    """
    Get search statistics (placeholder for future implementation).
    
    Access: All authenticated users (students and teachers)
    Denied: Non-authenticated users
    """
    # This would typically come from a search analytics system
    stats = {
        'total_searches_today': 0,
        'total_searches_this_week': 0,
        'total_searches_this_month': 0,
        'most_searched_terms': [],
        'most_active_apps': []
    }
    
    serializer = SearchStatsSerializer(stats)
    return Response(serializer.data, status=status.HTTP_200_OK)


class AdvancedSearchView(generics.GenericAPIView):
    """
    Advanced search with multiple filters and sorting options.
    
    Access: All authenticated users (students and teachers)
    Denied: Non-authenticated users
    """
    serializer_class = AdvancedSearchSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        """Perform advanced search with filters."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract search parameters
        query = serializer.validated_data['query']
        app_types = serializer.validated_data.get('app_types')
        date_from = serializer.validated_data.get('date_from')
        date_to = serializer.validated_data.get('date_to')
        subject = serializer.validated_data.get('subject')
        resource_type = serializer.validated_data.get('resource_type')
        is_public = serializer.validated_data.get('is_public')
        uploaded_by = serializer.validated_data.get('uploaded_by')
        tags = serializer.validated_data.get('tags')
        sort_by = serializer.validated_data.get('sort_by', 'relevance')
        sort_order = serializer.validated_data.get('sort_order', 'desc')
        limit_per_app = serializer.validated_data.get('limit_per_app', 10)
        
        # Perform basic search first
        search_service = SearchService()
        results = search_service.search(
            query=query,
            app_types=app_types,
            user=request.user,
            limit_per_app=limit_per_app
        )
        
        # Apply additional filters (this would be enhanced in a real implementation)
        filtered_results = self._apply_advanced_filters(
            results, date_from, date_to, subject, resource_type, 
            is_public, uploaded_by, tags, sort_by, sort_order
        )
        
        # Serialize response
        response_serializer = SearchResponseSerializer(filtered_results)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    def _apply_advanced_filters(self, results, date_from, date_to, subject, 
                               resource_type, is_public, uploaded_by, tags, 
                               sort_by, sort_order):
        """Apply advanced filters to search results."""
        # This is a simplified implementation
        # In a real system, you'd apply these filters at the database level
        
        filtered_results = results.copy()
        
        # Apply filters to each app's results
        for app_type, app_results in filtered_results['results_by_type'].items():
            if 'results' in app_results:
                filtered_items = app_results['results']
                
                # Apply date filters
                if date_from:
                    filtered_items = [
                        item for item in filtered_items 
                        if item.get('created_at') and 
                        item['created_at'] >= date_from.isoformat()
                    ]
                
                if date_to:
                    filtered_items = [
                        item for item in filtered_items 
                        if item.get('created_at') and 
                        item['created_at'] <= date_to.isoformat()
                    ]
                
                # Apply subject filter
                if subject:
                    filtered_items = [
                        item for item in filtered_items 
                        if item.get('subject') and 
                        subject.lower() in item['subject'].lower()
                    ]
                
                # Apply resource type filter
                if resource_type:
                    filtered_items = [
                        item for item in filtered_items 
                        if item.get('subtype') == resource_type
                    ]
                
                # Apply public/private filter
                if is_public is not None:
                    filtered_items = [
                        item for item in filtered_items 
                        if item.get('is_public') == is_public
                    ]
                
                # Apply uploader filter
                if uploaded_by:
                    filtered_items = [
                        item for item in filtered_items 
                        if item.get('uploaded_by') and 
                        str(uploaded_by) in str(item.get('uploaded_by'))
                    ]
                
                # Apply tags filter
                if tags:
                    tag_list = [tag.strip().lower() for tag in tags.split(',')]
                    filtered_items = [
                        item for item in filtered_items 
                        if item.get('tags') and 
                        any(tag in [t.lower() for t in item['tags']] for tag in tag_list)
                    ]
                
                # Apply sorting
                if sort_by == 'date':
                    filtered_items.sort(
                        key=lambda x: x.get('created_at', ''),
                        reverse=(sort_order == 'desc')
                    )
                elif sort_by == 'title':
                    filtered_items.sort(
                        key=lambda x: x.get('title', '').lower(),
                        reverse=(sort_order == 'desc')
                    )
                elif sort_by == 'downloads':
                    filtered_items.sort(
                        key=lambda x: x.get('download_count', 0),
                        reverse=(sort_order == 'desc')
                    )
                
                # Update results
                app_results['results'] = filtered_items
                app_results['total_count'] = len(filtered_items)
        
        # Recalculate total results
        filtered_results['total_results'] = sum(
            len(app_results.get('results', []))
            for app_results in filtered_results['results_by_type'].values()
        )
        
        return filtered_results


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_health(request):
    """
    Health check endpoint for search service.
    
    Access: All authenticated users (students and teachers)
    Denied: Non-authenticated users
    """
    try:
        search_service = SearchService()
        # Test search with a simple query
        test_results = search_service.search("test", limit_per_app=1)
        
        return Response({
            'status': 'healthy',
            'service': 'search',
            'available_apps': list(search_service.searchable_apps.keys()),
            'test_search_working': True
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Search service health check failed: {str(e)}")
        return Response({
            'status': 'unhealthy',
            'service': 'search',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
