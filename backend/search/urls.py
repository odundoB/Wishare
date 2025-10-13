from django.urls import path
from . import views
from . import simple_views

urlpatterns = [
    # Main search endpoint - GET /search/?q=keyword
    path('', simple_views.UnifiedSearchView.as_view(), name='search'),
    
    # Alternative search endpoints
    path('advanced/', views.SearchView.as_view(), name='advanced-search'),
    path('complex/', views.AdvancedSearchView.as_view(), name='complex-search'),
    
    # Search utility endpoints
    path('suggestions/', views.search_suggestions, name='search-suggestions'),
    path('popular/', views.popular_searches, name='popular-searches'),
    path('stats/', views.search_stats, name='search-stats'),
    path('health/', views.search_health, name='search-health'),
]
