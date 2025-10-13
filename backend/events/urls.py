from django.urls import path
from . import views

urlpatterns = [
    # Main API routes
    # GET /events/ → list all events (upcoming first)
    # POST /events/ → create new event (teachers/admins only)
    path('', views.EventListCreateView.as_view(), name='event-list-create'),
    
    # GET /events/<id>/ → retrieve single event details
    # PUT /events/<id>/ → update event (creator/admin only)
    # DELETE /events/<id>/ → delete event (creator/admin only)
    path('<int:pk>/', views.EventRetrieveUpdateDestroyView.as_view(), name='event-detail'),
    
    # Event filtering routes
    # GET /events/upcoming/ → list upcoming events
    path('upcoming/', views.EventUpcomingView.as_view(), name='event-upcoming'),
    
    # GET /events/past/ → list past events
    path('past/', views.EventPastView.as_view(), name='event-past'),
    
    # GET /events/ongoing/ → list ongoing events
    path('ongoing/', views.EventOngoingView.as_view(), name='event-ongoing'),
    
    # Search and user-specific routes
    # GET /events/search/?q=keyword → search events
    path('search/', views.EventSearchView.as_view(), name='event-search'),
    
    # GET /events/my/ → list user's own events
    path('my/', views.EventMyEventsView.as_view(), name='event-my'),
    
    # Statistics route
    # GET /events/stats/ → get event statistics
    path('stats/', views.EventStatsView.as_view(), name='event-stats'),
]
