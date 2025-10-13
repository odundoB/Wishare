import React from 'react'
import { Card, Badge, Button, Dropdown } from 'react-bootstrap'

const EventCard = ({ 
  event, 
  onView, 
  onEdit, 
  onDelete, 
  onRegister,
  onUnregister,
  canEdit, 
  canDelete,
  isRegistered = false
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const getEventStatus = (startTime, endTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (now < start) {
      return { status: 'upcoming', color: 'primary', text: 'Upcoming' }
    } else if (now >= start && now <= end) {
      return { status: 'ongoing', color: 'success', text: 'Ongoing' }
    } else {
      return { status: 'past', color: 'secondary', text: 'Past' }
    }
  }

  const getEventIcon = (event) => {
    // You can customize this based on event type or category
    return '📅'
  }

  const eventStatus = getEventStatus(event.start_time, event.end_time)

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <span className="text-primary me-2 fs-4">
              {getEventIcon(event)}
            </span>
            <Badge bg={eventStatus.color} className="me-2">
              {eventStatus.text}
            </Badge>
            {event.is_private && (
              <Badge bg="warning">Private</Badge>
            )}
          </div>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              ⋮
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onView(event)}>
                👁️ View Details
              </Dropdown.Item>
              {isRegistered ? (
                <Dropdown.Item onClick={() => onUnregister(event)}>
                  ❌ Unregister
                </Dropdown.Item>
              ) : (
                <Dropdown.Item onClick={() => onRegister(event)}>
                  ✅ Register
                </Dropdown.Item>
              )}
              {canEdit && (
                <Dropdown.Item onClick={() => onEdit(event)}>
                  ✏️ Edit
                </Dropdown.Item>
              )}
              {canDelete && (
                <Dropdown.Item 
                  className="text-danger"
                  onClick={() => onDelete(event)}
                >
                  🗑️ Delete
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <h6 className="card-title mb-2">{event.title}</h6>
        <p className="card-text text-muted small mb-3">
          {event.description.length > 100 
            ? `${event.description.substring(0, 100)}...`
            : event.description
          }
        </p>

        <div className="mb-3">
          <div className="d-flex align-items-center text-muted small mb-1">
            <span className="me-2">📍</span>
            <span>{event.location || 'Location TBD'}</span>
          </div>
          <div className="d-flex align-items-center text-muted small mb-1">
            <span className="me-2">🕐</span>
            <span>{formatDate(event.start_time)}</span>
          </div>
          <div className="d-flex align-items-center text-muted small">
            <span className="me-2">⏱️</span>
            <span>{formatDuration(event.start_time, event.end_time)}</span>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center text-muted small mb-2">
          <div>
            👤 {event.created_by?.username || 'Unknown'}
          </div>
          <div>
            📅 {new Date(event.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            👥 {event.attendees_count || 0} attendees
          </div>
          <div className="d-flex gap-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onView(event)}
            >
              👁️ View
            </Button>
            {isRegistered ? (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onUnregister(event)}
              >
                ❌ Unregister
              </Button>
            ) : (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => onRegister(event)}
              >
                ✅ Register
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default EventCard
