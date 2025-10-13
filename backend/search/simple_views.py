from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from typing import List, Dict, Any
import logging

from .result_serializers import (
    SearchResultFactory, UnifiedSearchResponseSerializer
)

logger = logging.getLogger(__name__)


class UnifiedSearchView(generics.GenericAPIView):
    """
    Unified search view that searches across multiple apps and returns
    a clean, consistent response format.
    
    Access: All authenticated users (students and teachers)
    Denied: Non-authenticated users
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """
        Search across multiple apps with query parameter ?q=keyword
        
        Query Parameters:
        - q: Search keyword (required)
        - type: Filter by type (resources, articles, forum, jobs)
        - page: Page number (default: 1)
        - page_size: Results per page (default: 20)
        - limit_per_category: Max results per category (default: 10)
        
        Returns results with type, id, title, snippet, and link
        """
        query = request.GET.get('q', '').strip()
        
        if not query:
            return Response({
                'error': 'Query parameter "q" is required',
                'results': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        limit_per_category = int(request.GET.get('limit_per_category', 10))
        
        # Get type filter
        type_filter = request.GET.get('type', '').strip()
        allowed_types = ['resources', 'articles', 'forum', 'jobs']
        
        if type_filter and type_filter not in allowed_types:
            return Response({
                'error': f'Invalid type filter. Allowed values: {", ".join(allowed_types)}',
                'results': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Perform searches across all apps
        all_results = []
        results_by_category = {}
        
        # Search resources
        if not type_filter or type_filter == 'resources':
            resource_results = self._search_resources(query, request.user, limit_per_category)
            all_results.extend(resource_results)
            results_by_category['resources'] = {
                'count': len(resource_results),
                'display_name': 'Resources'
            }
        
        # Search articles (placeholder)
        if not type_filter or type_filter == 'articles':
            article_results = self._search_articles(query, request.user, limit_per_category)
            all_results.extend(article_results)
            results_by_category['articles'] = {
                'count': len(article_results),
                'display_name': 'Articles'
            }
        
        # Search forum (placeholder)
        if not type_filter or type_filter == 'forum':
            forum_results = self._search_forum(query, request.user, limit_per_category)
            all_results.extend(forum_results)
            results_by_category['forum'] = {
                'count': len(forum_results),
                'display_name': 'Forum Posts'
            }
        
        # Search jobs (placeholder)
        if not type_filter or type_filter == 'jobs':
            job_results = self._search_jobs(query, request.user, limit_per_category)
            all_results.extend(job_results)
            results_by_category['jobs'] = {
                'count': len(job_results),
                'display_name': 'Jobs'
            }
        
        # Sort results by relevance
        all_results.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        
        # Apply pagination
        total_results = len(all_results)
        total_pages = (total_results + page_size - 1) // page_size
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_results = all_results[start_index:end_index]
        
        # Build pagination URLs
        base_url = request.build_absolute_uri(request.path)
        query_params = request.GET.copy()
        
        next_page = None
        previous_page = None
        
        if page < total_pages:
            query_params['page'] = page + 1
            next_page = f"{base_url}?{query_params.urlencode()}"
        
        if page > 1:
            query_params['page'] = page - 1
            previous_page = f"{base_url}?{query_params.urlencode()}"
        
        # Prepare response data
        response_data = {
            'query': query,
            'total_results': total_results,
            'results': paginated_results,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1,
            'next_page': next_page,
            'previous_page': previous_page,
            'results_by_category': results_by_category,
            'filters_applied': {
                'type': type_filter if type_filter else None,
                'limit_per_category': limit_per_category
            }
        }
        
        serializer = UnifiedSearchResponseSerializer(data=response_data)
        if serializer.is_valid():
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(response_data, status=status.HTTP_200_OK)
    
    def _search_resources(self, query: str, user, limit: int = 10) -> List[Dict[str, Any]]:
        """Search in resources (title, description, subject)."""
        try:
            from resources.models import Resource
            
            # Build search query
            search_q = Q(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(subject__icontains=query) |
                Q(tags__icontains=query)
            )
            
            # Apply permission filtering
            queryset = Resource.objects.select_related('uploaded_by')
            if not user.is_staff:
                queryset = queryset.filter(
                    Q(is_public=True) | Q(uploaded_by=user)
                )
            
            # Execute search with limit
            resources = queryset.filter(search_q).order_by('-created_at')[:limit]
            
            # Format results using serializer
            results = []
            for resource in resources:
                # Calculate relevance score
                relevance_score = self._calculate_relevance(resource, query)
                
                # Use serializer to format the result
                result_data = SearchResultFactory.serialize_result(resource, 'resource')
                result_data['relevance_score'] = relevance_score
                
                results.append(result_data)
            
            return results
            
        except ImportError:
            logger.warning("Resources app not available for search")
            return []
        except Exception as e:
            logger.error(f"Error searching resources: {str(e)}")
            return []
    
    def _search_articles(self, query: str, user, limit: int = 10) -> List[Dict[str, Any]]:
        """Search in articles (title, body) - placeholder implementation."""
        # Since articles app was removed, return empty results
        # In a real implementation, this would search the articles model
        # and use SearchResultFactory.serialize_result(article, 'article')
        return []
    
    def _search_forum(self, query: str, user, limit: int = 10) -> List[Dict[str, Any]]:
        """Search in forum (topics, messages) - placeholder implementation."""
        # Since forum app was removed, return empty results
        # In a real implementation, this would search forum topics and messages
        # and use SearchResultFactory.serialize_result(forum_post, 'forum')
        return []
    
    def _search_jobs(self, query: str, user, limit: int = 10) -> List[Dict[str, Any]]:
        """Search in jobs (title, description) - placeholder implementation."""
        # Since jobs app was removed, return empty results
        # In a real implementation, this would search job postings
        # and use SearchResultFactory.serialize_result(job, 'job')
        return []
    
    def _create_snippet(self, text: str, query: str, max_length: int = 150) -> str:
        """Create a snippet from text highlighting the query."""
        if not text:
            return ""
        
        # Find query position in text (case insensitive)
        query_lower = query.lower()
        text_lower = text.lower()
        query_pos = text_lower.find(query_lower)
        
        if query_pos == -1:
            # Query not found, return beginning of text
            snippet = text[:max_length]
            if len(text) > max_length:
                snippet += "..."
            return snippet
        
        # Calculate snippet start and end positions
        start = max(0, query_pos - max_length // 2)
        end = min(len(text), start + max_length)
        
        # Adjust start to avoid cutting words
        if start > 0:
            while start < len(text) and text[start] != ' ':
                start += 1
        
        # Adjust end to avoid cutting words
        if end < len(text):
            while end > 0 and text[end] != ' ':
                end -= 1
        
        snippet = text[start:end]
        
        # Add ellipsis if needed
        if start > 0:
            snippet = "..." + snippet
        if end < len(text):
            snippet = snippet + "..."
        
        return snippet
    
    def _calculate_relevance(self, resource, query: str) -> int:
        """Calculate relevance score for a resource."""
        score = 0
        query_lower = query.lower()
        
        # Title matches are most important
        if query_lower in resource.title.lower():
            score += 10
            # Exact title match gets bonus
            if resource.title.lower() == query_lower:
                score += 5
        
        # Subject matches
        if query_lower in resource.subject.lower():
            score += 8
        
        # Description matches
        if query_lower in resource.description.lower():
            score += 5
        
        # Tag matches
        if resource.tags and query_lower in resource.tags.lower():
            score += 3
        
        # Recent resources get slight boost
        from django.utils import timezone
        days_old = (timezone.now() - resource.created_at).days
        if days_old < 30:
            score += 1
        
        # Popular resources get slight boost
        if resource.download_count > 10:
            score += 1
        
        return score
