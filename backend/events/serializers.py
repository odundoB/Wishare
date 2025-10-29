from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Event

User = get_user_model()


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for full event details.
    Used for listing and retrieving events.
    """
    
    created_by = serializers.StringRelatedField(read_only=True)
    created_by_id = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_role = serializers.CharField(source='created_by.get_role_display', read_only=True)
    created_by_full_name = serializers.SerializerMethodField()
    
    # Event status properties
    is_past = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Duration calculation
    duration = serializers.DurationField(read_only=True)
    duration_display = serializers.SerializerMethodField()
    
    # Time formatting
    start_time_display = serializers.SerializerMethodField()
    end_time_display = serializers.SerializerMethodField()
    created_at_display = serializers.SerializerMethodField()
    updated_at_display = serializers.SerializerMethodField()
    
    # Time until event
    time_until_start = serializers.SerializerMethodField()
    time_until_end = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'location',
            'start_time', 'end_time', 'created_by',
            'created_at', 'updated_at',
            # Additional fields
            'created_by_id', 'created_by_username', 'created_by_role', 'created_by_full_name',
            'is_past', 'is_upcoming', 'is_ongoing', 'status_display',
            'duration', 'duration_display',
            'start_time_display', 'end_time_display',
            'created_at_display', 'updated_at_display',
            'time_until_start', 'time_until_end'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_created_by_id(self, obj):
        """Get the ID of the event creator."""
        return obj.created_by.id if obj.created_by else None
    
    def get_created_by_full_name(self, obj):
        """Get the full name of the event creator."""
        if obj.created_by:
            full_name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return full_name if full_name else obj.created_by.username
        return "Unknown"
    
    def get_duration_display(self, obj):
        """Get human-readable duration."""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            if hours > 0:
                return f"{hours}h {minutes}m"
            elif minutes > 0:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        return "Unknown"
    
    def get_start_time_display(self, obj):
        """Format start time for display."""
        if obj.start_time:
            return obj.start_time.strftime("%Y-%m-%d %H:%M")
        return None
    
    def get_end_time_display(self, obj):
        """Format end time for display."""
        if obj.end_time:
            return obj.end_time.strftime("%Y-%m-%d %H:%M")
        return None
    
    def get_created_at_display(self, obj):
        """Format created_at for display."""
        if obj.created_at:
            return obj.created_at.strftime("%Y-%m-%d %H:%M")
        return None
    
    def get_updated_at_display(self, obj):
        """Format updated_at for display."""
        if obj.updated_at:
            return obj.updated_at.strftime("%Y-%m-%d %H:%M")
        return None
    
    def get_time_until_start(self, obj):
        """Calculate time until event starts."""
        if obj.start_time:
            now = timezone.now()
            if obj.start_time > now:
                delta = obj.start_time - now
                return self._format_timedelta(delta)
            else:
                return "Event has started"
        return None
    
    def get_time_until_end(self, obj):
        """Calculate time until event ends."""
        if obj.end_time:
            now = timezone.now()
            if obj.end_time > now:
                delta = obj.end_time - now
                return self._format_timedelta(delta)
            else:
                return "Event has ended"
        return None
    
    def _format_timedelta(self, delta):
        """Format timedelta for human reading."""
        total_seconds = int(delta.total_seconds())
        
        if total_seconds < 60:
            return f"{total_seconds} seconds"
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''}"
        elif total_seconds < 86400:
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            if minutes > 0:
                return f"{hours}h {minutes}m"
            else:
                return f"{hours} hour{'s' if hours != 1 else ''}"
        else:
            days = total_seconds // 86400
            hours = (total_seconds % 86400) // 3600
            if hours > 0:
                return f"{days}d {hours}h"
            else:
                return f"{days} day{'s' if days != 1 else ''}"


class EventCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating events.
    Used by teachers and admins to create new events.
    """
    
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'location',
            'start_time', 'end_time'
        ]
    
    def validate_title(self, value):
        """Validate event title."""
        if not value or not value.strip():
            raise serializers.ValidationError("Event title cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Event title must be at least 3 characters long.")
        
        return value.strip()
    
    def validate_description(self, value):
        """Validate event description."""
        if not value or not value.strip():
            raise serializers.ValidationError("Event description cannot be empty.")
        
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Event description must be at least 10 characters long.")
        
        return value.strip()
    
    def validate_location(self, value):
        """Validate event location."""
        if not value or not value.strip():
            raise serializers.ValidationError("Event location cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Event location must be at least 3 characters long.")
        
        return value.strip()
    
    def validate_start_time(self, value):
        """Validate start time."""
        if not value:
            raise serializers.ValidationError("Start time is required.")
        
        # Check if start time is in the past (allow more tolerance for timezone issues)
        now = timezone.now()
        # Allow events to be created up to 30 minutes in the past to handle timezone differences
        if value < now - timedelta(minutes=30):
            raise serializers.ValidationError("Start time cannot be more than 30 minutes in the past.")
        
        return value
    
    def validate_end_time(self, value):
        """Validate end time."""
        if not value:
            raise serializers.ValidationError("End time is required.")
        
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        if start_time and end_time:
            # Check that end time is after start time
            if end_time <= start_time:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time.'
                })
            
            # Check that event duration is reasonable (not too long)
            duration = end_time - start_time
            max_duration = timedelta(days=7)  # Maximum 7 days
            if duration > max_duration:
                raise serializers.ValidationError({
                    'end_time': f'Event duration cannot exceed {max_duration.days} days.'
                })
            
            # Check that event duration is reasonable (not too short)
            min_duration = timedelta(minutes=15)  # Minimum 15 minutes
            if duration < min_duration:
                raise serializers.ValidationError({
                    'end_time': f'Event duration must be at least {min_duration.seconds // 60} minutes.'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create a new event."""
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EventUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating events.
    Used by event creators and admins to update events.
    """
    
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'location',
            'start_time', 'end_time'
        ]
    
    def validate_title(self, value):
        """Validate event title."""
        if not value or not value.strip():
            raise serializers.ValidationError("Event title cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Event title must be at least 3 characters long.")
        
        return value.strip()
    
    def validate_description(self, value):
        """Validate event description."""
        if not value or not value.strip():
            raise serializers.ValidationError("Event description cannot be empty.")
        
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Event description must be at least 10 characters long.")
        
        return value.strip()
    
    def validate_location(self, value):
        """Validate event location."""
        if not value or not value.strip():
            raise serializers.ValidationError("Event location cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Event location must be at least 3 characters long.")
        
        return value.strip()
    
    def validate_start_time(self, value):
        """Validate start time."""
        if not value:
            raise serializers.ValidationError("Start time is required.")
        
        return value
    
    def validate_end_time(self, value):
        """Validate end time."""
        if not value:
            raise serializers.ValidationError("End time is required.")
        
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        if start_time and end_time:
            # Check that end time is after start time
            if end_time <= start_time:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time.'
                })
            
            # Check that event duration is reasonable
            duration = end_time - start_time
            max_duration = timedelta(days=7)
            min_duration = timedelta(minutes=15)
            
            if duration > max_duration:
                raise serializers.ValidationError({
                    'end_time': f'Event duration cannot exceed {max_duration.days} days.'
                })
            
            if duration < min_duration:
                raise serializers.ValidationError({
                    'end_time': f'Event duration must be at least {min_duration.seconds // 60} minutes.'
                })
        
        return attrs


class EventListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for event listing.
    Used when listing multiple events to reduce response size.
    """
    
    created_by_id = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_display = serializers.SerializerMethodField()
    start_time_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'location',
            'start_time', 'end_time', 'created_by_id', 'created_by_username',
            'status_display', 'duration_display', 'start_time_display',
            'created_at'
        ]
    
    def get_created_by_id(self, obj):
        """Get the ID of the event creator."""
        return obj.created_by.id if obj.created_by else None
    
    def get_duration_display(self, obj):
        """Get human-readable duration."""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            if hours > 0:
                return f"{hours}h {minutes}m"
            elif minutes > 0:
                return f"{minutes}m"
            else:
                return f"{seconds}s"
        return "Unknown"
    
    def get_start_time_display(self, obj):
        """Format start time for display."""
        if obj.start_time:
            return obj.start_time.strftime("%Y-%m-%d %H:%M")
        return None


class EventSearchSerializer(serializers.ModelSerializer):
    """
    Serializer for event search results.
    Used when searching for events.
    """
    
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    snippet = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'location',
            'start_time', 'end_time', 'created_by_username',
            'status_display', 'snippet', 'created_at'
        ]
    
    def get_snippet(self, obj):
        """Get a snippet of the description for search results."""
        if obj.description:
            # Return first 150 characters of description
            snippet = obj.description[:150]
            if len(obj.description) > 150:
                snippet += "..."
            return snippet
        return ""
