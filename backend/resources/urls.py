from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'manage', views.ResourceManagementViewSet, basename='resource-management')

urlpatterns = [
    # Main API routes as specified
    # GET /resources/ → list all resources
    # POST /resources/ → upload resource (teachers only)
    path('', views.ResourceListCreateView.as_view(), name='resource-list-create'),
    
    # GET /resources/<id>/ → retrieve one resource
    # PUT /resources/<id>/ → update (owner/admin only)
    # DELETE /resources/<id>/ → delete (owner/admin only)
    path('<int:pk>/', views.ResourceRetrieveUpdateDestroyView.as_view(), name='resource-detail'),
    
    # GET /resources/search/?q=keyword → search by title, description, or subject
    path('search/', views.ResourceSearchView.as_view(), name='resource-search'),
    
    # Additional utility routes
    path('<int:pk>/download/', views.ResourceDownloadView.as_view(), name='resource-download'),
    path('stats/', views.ResourceStatsView.as_view(), name='resource-stats'),
    
    # Include router URLs for admin management
    path('', include(router.urls)),
]