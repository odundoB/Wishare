"""
URL patterns for the notifications app.
Defines API routes for notification management.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Core notification routes (as requested)
    # GET /notifications/ → list user's notifications
    path('', views.NotificationListView.as_view(), name='notification-list'),
    
    # Individual notification operations
    # GET /notifications/<id>/ → get notification details
    # PATCH /notifications/<id>/ → mark as read/unread  
    # DELETE /notifications/<id>/ → delete a notification
    path('<int:pk>/', views.NotificationDetailUpdateDeleteView.as_view(), name='notification-detail-update-delete'),
    
    # POST /notifications/mark-all-read/ → mark all as read
    path('mark-all-read/', views.NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    
    # POST /notifications/mark-all-unread/ → mark all as unread
    path('mark-all-unread/', views.NotificationMarkAllUnreadView.as_view(), name='notification-mark-all-unread'),
    
    # Additional utility routes
    # Bulk operations
    # POST /notifications/bulk-update/ → update multiple notifications
    path('bulk-update/', views.NotificationBulkUpdateView.as_view(), name='notification-bulk-update'),
    
    # POST /notifications/bulk-delete/ → delete multiple notifications
    path('bulk-delete/', views.NotificationBulkDeleteView.as_view(), name='notification-bulk-delete'),
    
    # Statistics and utilities
    # GET /notifications/stats/ → get notification statistics
    path('stats/', views.NotificationStatsView.as_view(), name='notification-stats'),
    
    # GET /notifications/search/ → search notifications with advanced filtering
    path('search/', views.NotificationSearchView.as_view(), name='notification-search'),
    
    # GET /notifications/unread-count/ → get unread notification count
    path('unread-count/', views.notification_unread_count, name='notification-unread-count'),
    
    # POST /notifications/mark-recent-read/ → mark recent notifications as read
    path('mark-recent-read/', views.notification_mark_recent_as_read, name='notification-mark-recent-read'),
]