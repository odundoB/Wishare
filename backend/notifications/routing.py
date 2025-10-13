"""
WebSocket routing for the notifications app.
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # User notification channel - individual user notifications
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    
    # Broadcast notification channel - for admin/system broadcasts
    re_path(r'ws/notifications/broadcast/$', consumers.NotificationBroadcastConsumer.as_asgi()),
]
