import React from 'react'
import { Card, Badge, Button, Dropdown } from 'react-bootstrap'

const NotificationCard = ({ 
  notification, 
  onMarkRead, 
  onMarkUnread,
  onDelete,
  onView
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) {
      return 'Just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getNotificationIcon = (notification) => {
    // Special handling for room approval notifications
    if (notification.data?.action_type === 'request_approved') {
      return '🎉'
    }
    
    const verb = notification.verb.toLowerCase()
    switch (verb) {
      case 'created':
      case 'uploaded':
        return '📄'
      case 'registered':
      case 'joined':
        return '✅'
      case 'commented':
      case 'replied':
        return '💬'
      case 'liked':
      case 'favorited':
        return '❤️'
      case 'approved':
        return '🎉'
      case 'shared':
        return '🔗'
      case 'updated':
        return '✏️'
      case 'deleted':
        return '🗑️'
      case 'invited':
        return '📧'
      case 'mentioned':
        return '👤'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (isRead) => {
    return isRead ? 'light' : 'primary'
  }

  const getNotificationText = (notification) => {
    const { actor, verb, target } = notification
    const actorName = actor?.username || 'Someone'
    const targetName = target?.title || target?.name || 'an item'
    
    return `${actorName} ${verb} ${targetName}`
  }

  return (
    <Card className={`h-100 shadow-sm ${!notification.is_read ? 'border-primary' : ''}`}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <span className="text-primary me-2 fs-4">
              {getNotificationIcon(notification)}
            </span>
            {!notification.is_read && (
              <Badge bg="primary" className="me-2">
                New
              </Badge>
            )}
          </div>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              ⋮
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onView(notification)}>
                👁️ View Details
              </Dropdown.Item>
              {notification.is_read ? (
                <Dropdown.Item onClick={() => onMarkUnread(notification)}>
                  📬 Mark as Unread
                </Dropdown.Item>
              ) : (
                <Dropdown.Item onClick={() => onMarkRead(notification)}>
                  📭 Mark as Read
                </Dropdown.Item>
              )}
              <Dropdown.Item 
                className="text-danger"
                onClick={() => onDelete(notification)}
              >
                🗑️ Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <h6 className="card-title mb-2">
          {getNotificationText(notification)}
        </h6>
        
        {notification.description && (
          <p className="card-text text-muted small mb-3">
            {notification.description.length > 100 
              ? `${notification.description.substring(0, 100)}...`
              : notification.description
            }
          </p>
        )}

        <div className="d-flex justify-content-between align-items-center text-muted small">
          <div>
            <span className="me-2">👤</span>
            {notification.actor?.username || 'System'}
          </div>
          <div>
            <span className="me-2">🕐</span>
            {formatDate(notification.created_at)}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="text-muted small">
            {notification.target_type && (
              <Badge bg="light" text="dark" className="me-1">
                {notification.target_type}
              </Badge>
            )}
          </div>
          <div className="d-flex gap-1">
            {/* Special button for auto-join room notifications */}
            {notification.data?.action_type === 'request_approved' && notification.data?.auto_join ? (
              <Button
                variant="success"
                size="sm"
                onClick={() => {
                  const roomId = notification.data.room_id
                  const roomName = notification.data.room_name
                  if (window.confirm(`Enter "${roomName}" room now?`)) {
                    window.location.href = `/chat-room/${roomId}`
                  }
                }}
              >
                🚪 Enter Room
              </Button>
            ) : (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onView(notification)}
              >
                👁️ View
              </Button>
            )}
            {notification.is_read ? (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onMarkUnread(notification)}
              >
                📬 Unread
              </Button>
            ) : (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => onMarkRead(notification)}
              >
                📭 Mark Read
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default NotificationCard
