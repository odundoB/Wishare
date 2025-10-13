from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()


class Event(models.Model):
    """
    Model for storing events with title, description, location, and timing.
    Events are ordered by start_time by default.
    """
    
    title = models.CharField(
        max_length=200,
        help_text="Title of the event"
    )
    
    description = models.TextField(
        help_text="Detailed description of the event"
    )
    
    location = models.CharField(
        max_length=200,
        help_text="Location where the event will take place"
    )
    
    start_time = models.DateTimeField(
        help_text="When the event starts"
    )
    
    end_time = models.DateTimeField(
        help_text="When the event ends"
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_events',
        help_text="User who created this event"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this event was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this event was last updated"
    )
    
    class Meta:
        ordering = ['start_time']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        indexes = [
            models.Index(fields=['start_time']),
            models.Index(fields=['created_by']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
    
    def clean(self):
        """Validate the event data."""
        super().clean()
        
        # Check that end_time is after start_time
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError({
                    'end_time': 'End time must be after start time.'
                })
        
        # Check that start_time is not in the past (optional validation)
        if self.start_time and self.start_time < timezone.now():
            # This is a warning, not an error - past events might be valid
            pass
    
    def save(self, *args, **kwargs):
        """Override save to run validation."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def duration(self):
        """Calculate the duration of the event."""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return None
    
    @property
    def is_past(self):
        """Check if the event has already ended."""
        if self.end_time:
            return self.end_time < timezone.now()
        return False
    
    @property
    def is_upcoming(self):
        """Check if the event is in the future."""
        if self.start_time:
            return self.start_time > timezone.now()
        return False
    
    @property
    def is_ongoing(self):
        """Check if the event is currently happening."""
        now = timezone.now()
        if self.start_time and self.end_time:
            return self.start_time <= now <= self.end_time
        return False
    
    def get_status_display(self):
        """Get human-readable status of the event."""
        if self.is_past:
            return "Past"
        elif self.is_ongoing:
            return "Ongoing"
        elif self.is_upcoming:
            return "Upcoming"
        else:
            return "Unknown"
