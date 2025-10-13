import React, { useState, useEffect, useRef } from 'react'
import { Button, Card, Alert, Form, Row, Col, ListGroup, Badge, Modal } from 'react-bootstrap'
import { 
  getNotifications, 
  markRead, 
  markUnread,
  deleteNotification, 
  markAllRead,
  markAllUnread,
  getUnreadCount,
  getNotificationStats,
  searchNotifications,
  connectNotificationSocket,
  NotificationManager
} from '../services/notifications'

const NotificationServiceExample = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [stats, setStats] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [notificationManager] = useState(() => new NotificationManager())
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    // Add listener for notification updates
    const handleNotificationUpdate = (data) => {
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    }

    notificationManager.addListener(handleNotificationUpdate)

    // Load initial notifications
    notificationManager.loadNotifications()

    return () => {
      notificationManager.removeListener(handleNotificationUpdate)
      notificationManager.disconnect()
    }
  }, [notificationManager])

  const testGetNotifications = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getNotifications({
        page: 1,
        page_size: 20,
        ordering: '-created_at'
      })
      setNotifications(response.data.results || response.data)
      setResult({
        type: 'success',
        message: `Retrieved ${response.data.results?.length || response.data.length} notifications`,
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get notifications failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testMarkRead = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await markRead(id)
      setResult({
        type: 'success',
        message: 'Notification marked as read!',
        data: response.data
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Mark as read failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testMarkUnread = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await markUnread(id)
      setResult({
        type: 'success',
        message: 'Notification marked as unread!',
        data: response.data
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: false } : n)
      )
      setUnreadCount(prev => prev + 1)
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Mark as unread failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testDeleteNotification = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await deleteNotification(id)
      setResult({
        type: 'success',
        message: 'Notification deleted!',
        data: response.data
      })
      
      // Update local state
      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Delete notification failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testMarkAllRead = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await markAllRead()
      setResult({
        type: 'success',
        message: 'All notifications marked as read!',
        data: response.data
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Mark all as read failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testGetUnreadCount = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getUnreadCount()
      setUnreadCount(response.data.count)
      setResult({
        type: 'success',
        message: `Unread count: ${response.data.count}`,
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get unread count failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testGetStats = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getNotificationStats()
      setStats(response.data)
      setResult({
        type: 'success',
        message: 'Notification stats retrieved!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get stats failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testSearchNotifications = async () => {
    if (!searchQuery.trim()) {
      setResult({
        type: 'warning',
        message: 'Please enter a search query'
      })
      return
    }

    setLoading(true)
    setResult(null)
    
    try {
      const response = await searchNotifications(searchQuery, {
        page: 1,
        page_size: 20
      })
      setNotifications(response.data.results || response.data)
      setResult({
        type: 'success',
        message: `Found ${response.data.results?.length || response.data.length} notifications for "${searchQuery}"`,
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Search failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const connectWebSocket = () => {
    if (isConnected) {
      notificationManager.disconnect()
      setIsConnected(false)
      setResult({
        type: 'info',
        message: 'WebSocket disconnected'
      })
    } else {
      notificationManager.connect()
      setIsConnected(true)
      setResult({
        type: 'success',
        message: 'WebSocket connected! You will receive real-time notifications.'
      })
    }
  }

  const showNotificationDetails = (notification) => {
    setSelectedNotification(notification)
    setShowNotificationModal(true)
  }

  const getNotificationTypeColor = (type) => {
    const colors = {
      resource: 'primary',
      event: 'success',
      forum: 'warning',
      user: 'secondary',
      system: 'dark',
      other: 'light'
    }
    return colors[type] || 'light'
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Notification Service Functions Test</h5>
          <div className="d-flex align-items-center gap-2">
            <Badge bg={isConnected ? 'success' : 'secondary'}>
              {isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
            </Badge>
            <Badge bg="info">
              Unread: {unreadCount}
            </Badge>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-4">
          Test the notification service functions and WebSocket from <code>src/services/notifications.js</code>
        </p>

        <Row>
          {/* Controls */}
          <Col md={4}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">Controls</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    onClick={testGetNotifications}
                    disabled={loading}
                  >
                    Get Notifications
                  </Button>
                  
                  <Button 
                    variant="success" 
                    onClick={testGetUnreadCount}
                    disabled={loading}
                  >
                    Get Unread Count
                  </Button>
                  
                  <Button 
                    variant="info" 
                    onClick={testGetStats}
                    disabled={loading}
                  >
                    Get Stats
                  </Button>
                  
                  <Button 
                    variant="warning" 
                    onClick={testMarkAllRead}
                    disabled={loading}
                  >
                    Mark All Read
                  </Button>
                  
                  <Button 
                    variant={isConnected ? 'danger' : 'success'}
                    onClick={connectWebSocket}
                    disabled={loading}
                  >
                    {isConnected ? 'Disconnect WS' : 'Connect WS'}
                  </Button>
                </div>

                {/* Search */}
                <Card className="mt-3">
                  <Card.Header>
                    <h6 className="mb-0">Search</h6>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-2">
                        <Form.Control
                          type="text"
                          placeholder="Search notifications..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </Form.Group>
                      <Button 
                        variant="outline-primary"
                        onClick={testSearchNotifications}
                        disabled={loading}
                        className="w-100"
                      >
                        Search
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>

                {/* Stats */}
                {stats && (
                  <Card className="mt-3">
                    <Card.Header>
                      <h6 className="mb-0">Statistics</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="small">
                        <div>Total: {stats.total_count}</div>
                        <div>Unread: {stats.unread_count}</div>
                        <div>Read: {stats.read_count}</div>
                        <div>Today: {stats.today_count}</div>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Notifications List */}
          <Col md={8}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  Notifications ({notifications.length})
                  {unreadCount > 0 && (
                    <Badge bg="danger" className="ms-2">
                      {unreadCount} unread
                    </Badge>
                  )}
                </h6>
              </Card.Header>
              <Card.Body>
                {notifications.length > 0 ? (
                  <ListGroup>
                    {notifications.map((notification) => (
                      <ListGroup.Item 
                        key={notification.id}
                        className={`d-flex justify-content-between align-items-start ${
                          !notification.is_read ? 'bg-light' : ''
                        }`}
                      >
                        <div className="ms-2 me-auto">
                          <div className="fw-bold d-flex align-items-center">
                            {notification.verb}
                            {!notification.is_read && (
                              <Badge bg="primary" className="ms-2">New</Badge>
                            )}
                            <Badge 
                              bg={getNotificationTypeColor(notification.notification_type)} 
                              className="ms-2"
                            >
                              {notification.notification_type}
                            </Badge>
                          </div>
                          <div className="text-muted small">
                            {notification.actor?.username && `by ${notification.actor.username}`}
                            {notification.target && ` • ${notification.target_display_name}`}
                          </div>
                          <div className="text-muted small">
                            {formatTimestamp(notification.created_at)}
                          </div>
                        </div>
                        <div className="d-flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline-info"
                            onClick={() => showNotificationDetails(notification)}
                          >
                            View
                          </Button>
                          {!notification.is_read ? (
                            <Button 
                              size="sm" 
                              variant="outline-success"
                              onClick={() => testMarkRead(notification.id)}
                              disabled={loading}
                            >
                              Mark Read
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline-warning"
                              onClick={() => testMarkUnread(notification.id)}
                              disabled={loading}
                            >
                              Mark Unread
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => testDeleteNotification(notification.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-center text-muted py-4">
                    No notifications found
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {loading && (
          <Alert variant="info">
            Processing request...
          </Alert>
        )}

        {result && (
          <Alert variant={result.type}>
            <strong>{result.message}</strong>
            {result.data && (
              <pre className="mt-2 mb-0" style={{ fontSize: '0.8em' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </Alert>
        )}

        {/* Notification Details Modal */}
        <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Notification Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedNotification && (
              <div>
                <h6>Type: {selectedNotification.notification_type}</h6>
                <h6>Action: {selectedNotification.verb}</h6>
                <p><strong>Created:</strong> {formatTimestamp(selectedNotification.created_at)}</p>
                <p><strong>Read:</strong> {selectedNotification.is_read ? 'Yes' : 'No'}</p>
                {selectedNotification.actor && (
                  <p><strong>Actor:</strong> {selectedNotification.actor.username}</p>
                )}
                {selectedNotification.target && (
                  <p><strong>Target:</strong> {selectedNotification.target_display_name}</p>
                )}
                {selectedNotification.data && (
                  <div>
                    <strong>Data:</strong>
                    <pre className="mt-2" style={{ fontSize: '0.8em' }}>
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNotificationModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  )
}

export default NotificationServiceExample
