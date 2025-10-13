from django.db.models import Q
from django.contrib.auth import get_user_model
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class SearchService:
    """
    Comprehensive search service that queries multiple apps and returns structured results.
    """
    
    def __init__(self):
        self.searchable_apps = {
            'resources': self._search_resources,
            'articles': self._search_articles,
            'forum': self._search_forum_posts,
            'jobs': self._search_jobs,
        }
    
    def search(self, query: str, app_types: Optional[List[str]] = None, 
               user=None, limit_per_app: int = 10) -> Dict[str, Any]:
        """
        Perform a comprehensive search across multiple apps.
        
        Args:
            query: Search keyword
            app_types: List of app types to search (None = all apps)
            user: Current user for permission filtering
            limit_per_app: Maximum results per app type
            
        Returns:
            Structured search results grouped by type
        """
        if not query or not query.strip():
            return self._empty_results()
        
        query = query.strip()
        results = {
            'query': query,
            'total_results': 0,
            'results_by_type': {},
            'search_metadata': {
                'searched_apps': [],
                'total_apps_searched': 0,
                'execution_time': 0
            }
        }
        
        # Determine which apps to search
        apps_to_search = app_types if app_types else list(self.searchable_apps.keys())
        
        import time
        start_time = time.time()
        
        # Search each app
        for app_type in apps_to_search:
            if app_type in self.searchable_apps:
                try:
                    app_results = self.searchable_apps[app_type](
                        query, user, limit_per_app
                    )
                    if app_results['results']:
                        results['results_by_type'][app_type] = app_results
                        results['total_results'] += len(app_results['results'])
                    results['search_metadata']['searched_apps'].append(app_type)
                except Exception as e:
                    logger.error(f"Error searching {app_type}: {str(e)}")
                    results['results_by_type'][app_type] = {
                        'app_name': app_type,
                        'results': [],
                        'total_count': 0,
                        'error': str(e)
                    }
        
        end_time = time.time()
        results['search_metadata']['total_apps_searched'] = len(results['search_metadata']['searched_apps'])
        results['search_metadata']['execution_time'] = round(end_time - start_time, 3)
        
        return results
    
    def _search_resources(self, query: str, user=None, limit: int = 10) -> Dict[str, Any]:
        """Search resources app."""
        try:
            from resources.models import Resource
            
            # Build search query
            search_q = Q(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(tags__icontains=query) |
                Q(subject__icontains=query)
            )
            
            # Apply permission filtering
            queryset = Resource.objects.select_related('uploaded_by')
            if user and not user.is_staff:
                queryset = queryset.filter(
                    Q(is_public=True) | Q(uploaded_by=user)
                )
            
            # Execute search
            resources = queryset.filter(search_q).order_by('-created_at')[:limit]
            
            # Format results
            results = []
            for resource in resources:
                results.append({
                    'id': resource.id,
                    'title': resource.title,
                    'description': resource.description[:200] + '...' if len(resource.description) > 200 else resource.description,
                    'type': 'resource',
                    'subtype': resource.resource_type,
                    'subject': resource.get_subject_display(),
                    'tags': resource.get_tags_list(),
                    'uploaded_by': resource.uploaded_by.username if resource.uploaded_by else None,
                    'uploaded_by_role': resource.uploaded_by.role if resource.uploaded_by else None,
                    'is_public': resource.is_public,
                    'download_count': resource.download_count,
                    'created_at': resource.created_at.isoformat(),
                    'url': f'/api/resources/{resource.id}/',
                    'file_url': resource.file.url if resource.file else None,
                    'external_url': resource.url if resource.resource_type == 'url' else None,
                })
            
            return {
                'app_name': 'resources',
                'app_display_name': 'Resources',
                'results': results,
                'total_count': len(results),
                'has_more': queryset.count() > limit,
                'search_fields': ['title', 'description', 'tags', 'subject']
            }
            
        except ImportError:
            return self._app_not_available('resources')
        except Exception as e:
            logger.error(f"Error searching resources: {str(e)}")
            return self._search_error('resources', str(e))
    
    def _search_articles(self, query: str, user=None, limit: int = 10) -> Dict[str, Any]:
        """Search articles app (placeholder for future implementation)."""
        # Since articles app was removed, return empty results
        return {
            'app_name': 'articles',
            'app_display_name': 'Articles',
            'results': [],
            'total_count': 0,
            'has_more': False,
            'search_fields': ['title', 'content'],
            'note': 'Articles app is not currently available'
        }
    
    def _search_forum_posts(self, query: str, user=None, limit: int = 10) -> Dict[str, Any]:
        """Search forum posts (placeholder for future implementation)."""
        # Since forum app was removed, return empty results
        return {
            'app_name': 'forum',
            'app_display_name': 'Forum Posts',
            'results': [],
            'total_count': 0,
            'has_more': False,
            'search_fields': ['title', 'content'],
            'note': 'Forum app is not currently available'
        }
    
    def _search_jobs(self, query: str, user=None, limit: int = 10) -> Dict[str, Any]:
        """Search jobs (placeholder for future implementation)."""
        # Since jobs app was removed, return empty results
        return {
            'app_name': 'jobs',
            'app_display_name': 'Jobs',
            'results': [],
            'total_count': 0,
            'has_more': False,
            'search_fields': ['title', 'description', 'company'],
            'note': 'Jobs app is not currently available'
        }
    
    def _search_users(self, query: str, user=None, limit: int = 10) -> Dict[str, Any]:
        """Search users (bonus functionality)."""
        try:
            # Build search query
            search_q = Q(
                Q(username__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query)
            )
            
            # Execute search
            users = User.objects.filter(search_q).order_by('-date_joined')[:limit]
            
            # Format results
            results = []
            for user_obj in users:
                results.append({
                    'id': user_obj.id,
                    'title': f"{user_obj.first_name} {user_obj.last_name}".strip() or user_obj.username,
                    'description': f"User ({user_obj.get_role_display()})",
                    'type': 'user',
                    'subtype': user_obj.role,
                    'username': user_obj.username,
                    'email': user_obj.email,
                    'role': user_obj.get_role_display(),
                    'is_active': user_obj.is_active,
                    'date_joined': user_obj.date_joined.isoformat(),
                    'url': f'/api/users/{user_obj.id}/',
                })
            
            return {
                'app_name': 'users',
                'app_display_name': 'Users',
                'results': results,
                'total_count': len(results),
                'has_more': User.objects.filter(search_q).count() > limit,
                'search_fields': ['username', 'first_name', 'last_name', 'email']
            }
            
        except Exception as e:
            logger.error(f"Error searching users: {str(e)}")
            return self._search_error('users', str(e))
    
    def _empty_results(self) -> Dict[str, Any]:
        """Return empty search results structure."""
        return {
            'query': '',
            'total_results': 0,
            'results_by_type': {},
            'search_metadata': {
                'searched_apps': [],
                'total_apps_searched': 0,
                'execution_time': 0
            }
        }
    
    def _app_not_available(self, app_name: str) -> Dict[str, Any]:
        """Return result for unavailable app."""
        return {
            'app_name': app_name,
            'app_display_name': app_name.title(),
            'results': [],
            'total_count': 0,
            'has_more': False,
            'note': f'{app_name.title()} app is not available'
        }
    
    def _search_error(self, app_name: str, error: str) -> Dict[str, Any]:
        """Return error result for failed search."""
        return {
            'app_name': app_name,
            'app_display_name': app_name.title(),
            'results': [],
            'total_count': 0,
            'has_more': False,
            'error': error
        }
    
    def get_search_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """
        Get search suggestions based on partial query.
        
        Args:
            query: Partial search query
            limit: Maximum number of suggestions
            
        Returns:
            List of search suggestions
        """
        suggestions = []
        
        if not query or len(query) < 2:
            return suggestions
        
        try:
            # Get suggestions from resources
            from resources.models import Resource
            
            # Search titles for suggestions
            resource_titles = Resource.objects.filter(
                title__icontains=query
            ).values_list('title', flat=True)[:limit]
            
            suggestions.extend(resource_titles)
            
            # Search tags for suggestions
            resource_tags = Resource.objects.filter(
                tags__icontains=query
            ).values_list('tags', flat=True)
            
            # Extract individual tags
            for tag_string in resource_tags:
                if tag_string:
                    tags = [tag.strip() for tag in tag_string.split(',')]
                    for tag in tags:
                        if query.lower() in tag.lower() and tag not in suggestions:
                            suggestions.append(tag)
                            if len(suggestions) >= limit:
                                break
            
        except Exception as e:
            logger.error(f"Error getting search suggestions: {str(e)}")
        
        return suggestions[:limit]
    
    def get_popular_searches(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get popular search terms (placeholder for future implementation).
        
        Args:
            limit: Maximum number of popular searches
            
        Returns:
            List of popular search terms with counts
        """
        # This would typically come from a search analytics system
        # For now, return some example popular searches
        return [
            {'term': 'mathematics', 'count': 45},
            {'term': 'worksheet', 'count': 32},
            {'term': 'science', 'count': 28},
            {'term': 'homework', 'count': 25},
            {'term': 'practice', 'count': 22},
        ][:limit]
