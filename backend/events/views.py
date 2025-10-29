from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import Event
from .serializers import (
    EventSerializer, EventCreateSerializer, EventUpdateSerializer,
    EventListSerializer, EventSearchSerializer
)
from .permissions import (
    IsTeacherOrAdmin, IsOwnerOrAdmin, CanViewEvents, IsStudentReadOnly
)


class EventListCreateView(generics.ListCreateAPIView):
    """
    Combined view for listing and creating events.
    GET /events/ → list all events (upcoming first)
    POST /events/ → create new event (teachers/admins only)
    """
    permission_classes = [IsAuthenticated]  # Temporarily allow all authenticated users
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['created_by', 'location']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_time', 'created_at', 'title']
    ordering = ['start_time']  # Upcoming events first
    
    def get_queryset(self):
        """Get events with proper ordering and filtering."""
        queryset = Event.objects.select_related('created_by').all()
        
        # Filter by status if provided
        status = self.request.query_params.get('status')
        if status:
            from django.utils import timezone
            now = timezone.now()
            
            if status == 'upcoming':
                queryset = queryset.filter(start_time__gt=now)
            elif status == 'ongoing':
                queryset = queryset.filter(start_time__lte=now, end_time__gte=now)
            elif status == 'past':
                queryset = queryset.filter(end_time__lt=now)
        
        # Order by start_time (upcoming first)
        return queryset.order_by('start_time')
    
    def get_serializer_class(self):
        """Use different serializers for different methods."""
        if self.request.method == 'POST':
            return EventCreateSerializer
        return EventListSerializer
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create to return full event details."""
        print(f"Event creation request data: {request.data}")
        print(f"User: {request.user}, User ID: {request.user.id}, Role: {getattr(request.user, 'role', 'No role')}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"Request headers: {dict(request.headers)}")
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                event = serializer.save()
                response_serializer = EventSerializer(event, context={'request': request})
                print(f"Event created successfully: {response_serializer.data}")
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error saving event: {e}")
                return Response({'detail': f'Error saving event: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        print(f"Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Combined view for retrieving, updating, and destroying events.
    GET /events/<id>/ → retrieve single event details
    PUT /events/<id>/ → update event (creator/admin only)
    DELETE /events/<id>/ → delete event (creator/admin only)
    """
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """Get events with related data."""
        return Event.objects.select_related('created_by').all()
    
    def get_serializer_class(self):
        """Use different serializers for different methods."""
        if self.request.method == 'GET':
            return EventSerializer
        return EventUpdateSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve event with full details."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update event with validation."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        response_serializer = EventSerializer(event, context={'request': request})
        return Response(response_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete event with confirmation message."""
        instance = self.get_object()
        event_title = instance.title
        self.perform_destroy(instance)
        return Response(
            {'message': f'Event "{event_title}" has been successfully deleted.'},
            status=status.HTTP_204_NO_CONTENT
        )


class EventUpcomingView(generics.ListAPIView):
    """
    List upcoming events (events that haven't started yet).
    GET /events/upcoming/ → list upcoming events
    """
    permission_classes = [IsAuthenticated, CanViewEvents]
    serializer_class = EventListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['created_by', 'location']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_time', 'created_at', 'title']
    ordering = ['start_time']
    
    def get_queryset(self):
        """Get upcoming events only."""
        now = timezone.now()
        return Event.objects.select_related('created_by').filter(
            start_time__gt=now
        ).order_by('start_time')


class EventPastView(generics.ListAPIView):
    """
    List past events (events that have ended).
    GET /events/past/ → list past events
    """
    permission_classes = [IsAuthenticated, CanViewEvents]
    serializer_class = EventListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['created_by', 'location']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_time', 'created_at', 'title']
    ordering = ['-start_time']  # Most recent past events first
    
    def get_queryset(self):
        """Get past events only."""
        now = timezone.now()
        return Event.objects.select_related('created_by').filter(
            end_time__lt=now
        ).order_by('-start_time')


class EventOngoingView(generics.ListAPIView):
    """
    List ongoing events (events that are currently happening).
    GET /events/ongoing/ → list ongoing events
    """
    permission_classes = [IsAuthenticated, CanViewEvents]
    serializer_class = EventListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['created_by', 'location']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_time', 'created_at', 'title']
    ordering = ['start_time']
    
    def get_queryset(self):
        """Get ongoing events only."""
        now = timezone.now()
        return Event.objects.select_related('created_by').filter(
            start_time__lte=now,
            end_time__gte=now
        ).order_by('start_time')


class EventSearchView(generics.ListAPIView):
    """
    Search events by title, description, or location.
    GET /events/search/?q=keyword → search events
    """
    permission_classes = [IsAuthenticated, CanViewEvents]
    serializer_class = EventSearchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_time', 'created_at', 'title']
    ordering = ['start_time']
    
    def get_queryset(self):
        """Get events with search functionality."""
        queryset = Event.objects.select_related('created_by').all()
        
        # Get search query
        search_query = self.request.query_params.get('q', '')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(location__icontains=search_query)
            )
        
        return queryset.order_by('start_time')


class EventMyEventsView(generics.ListAPIView):
    """
    List events created by the current user.
    GET /events/my/ → list user's own events
    """
    permission_classes = [IsAuthenticated, CanViewEvents]
    serializer_class = EventListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_time', 'created_at', 'title']
    ordering = ['start_time']
    
    def get_queryset(self):
        """Get events created by the current user."""
        return Event.objects.select_related('created_by').filter(
            created_by=self.request.user
        ).order_by('start_time')


class EventStatsView(generics.GenericAPIView):
    """
    Get event statistics.
    GET /events/stats/ → get event statistics
    """
    permission_classes = [IsAuthenticated, CanViewEvents]
    
    def get(self, request, *args, **kwargs):
        """Return event statistics."""
        now = timezone.now()
        
        # Get basic counts
        total_events = Event.objects.count()
        upcoming_events = Event.objects.filter(start_time__gt=now).count()
        past_events = Event.objects.filter(end_time__lt=now).count()
        ongoing_events = Event.objects.filter(
            start_time__lte=now,
            end_time__gte=now
        ).count()
        
        # Get events by creator
        user_events = Event.objects.filter(created_by=request.user).count()
        
        # Get recent events (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        recent_events = Event.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()
        
        # Get upcoming events in next 7 days
        seven_days_later = now + timedelta(days=7)
        upcoming_week = Event.objects.filter(
            start_time__gte=now,
            start_time__lte=seven_days_later
        ).count()
        
        stats = {
            'total_events': total_events,
            'upcoming_events': upcoming_events,
            'past_events': past_events,
            'ongoing_events': ongoing_events,
            'user_events': user_events,
            'recent_events': recent_events,
            'upcoming_week': upcoming_week,
            'timestamp': now.isoformat()
        }
        
        return Response(stats, status=status.HTTP_200_OK)
