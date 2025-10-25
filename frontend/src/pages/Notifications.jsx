import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Pagination } from 'react-bootstrap'
import { 
  getNotifications, markRead, markUnread, deleteNotification, markAllRead, markAllUnread, getUnreadCount
} from '../services/notifications'
import { useAuth } from '../contexts/AuthContext'
import NotificationCard from '../components/NotificationCard'
import NotificationFilters from '../components/NotificationFilters'
import NotificationStats from '../components/NotificationStats'

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [currentPage, selectedStatus, sortBy, sortOrder, searchQuery])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        is_read: selectedStatus === 'read' ? true : selectedStatus === 'unread' ? false : undefined,
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
        search: searchQuery
      }
      
      const response = await getNotifications(params)
      setNotifications(response.data.results || response.data)
      setTotalPages(response.data.total_pages || 1)
      setTotalCount(response.data.count || response.data.length)
    } catch (err) {
      setError('Failed to load notifications: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount()
      setUnreadCount(response.data.unread_count || 0)
    } catch (err) {
      // Ignore unread count errors
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchNotifications()
  }

  const handleMarkRead = async (notification) => {
    try {
      await markRead(notification.id)
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError('Failed to mark notification as read: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleMarkUnread = async (notification) => {
    try {
      await markUnread(notification.id)
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: false } : n)
      )
      setUnreadCount(prev => prev + 1)
    } catch (err) {
      setError('Failed to mark notification as unread: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDelete = async (notification) => {
    try {
      await deleteNotification(notification.id)
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
      setTotalCount(prev => prev - 1)
      if (!notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      setError('Failed to delete notification: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      setError('Failed to mark all notifications as read: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleMarkAllUnread = async () => {
    try {
      await markAllUnread()
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: false }))
      )
      setUnreadCount(totalCount)
    } catch (err) {
      setError('Failed to mark all notifications as unread: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDeleteAll = async () => {
    try {
      // Delete all notifications
      for (const notification of notifications) {
        await deleteNotification(notification.id)
      }
      setNotifications([])
      setTotalCount(0)
      setUnreadCount(0)
    } catch (err) {
      setError('Failed to delete all notifications: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleView = (notification) => {
    // View notification
    
    // Mark as read if not already read
    if (!notification.is_read) {
      handleMarkRead(notification)
    }

    // Handle auto-join for approved room requests
    if (notification.data?.action_type === 'request_approved' && notification.data?.auto_join) {
      const roomId = notification.data.room_id
      const roomName = notification.data.room_name
      
      // Show confirmation and auto-redirect to room
      if (window.confirm(`Your request to join "${roomName}" has been approved! Would you like to enter the room now?`)) {
        // Navigate to the chat room
        window.location.href = `/chat-room/${roomId}`
      }
      return
    }

    // Handle other notification types
    if (notification.data?.redirect_url) {
      window.location.href = notification.data.redirect_url
    } else if (notification.target_object?.url) {
      window.location.href = notification.target_object.url
    } else {
      // Default: just show notification details
      alert(`Notification: ${notification.verb}\nFrom: ${notification.actor?.username || 'System'}`)
    }
  }

  const getNotificationStats = () => {
    const readCount = notifications.filter(n => n.is_read).length
    const unreadCount = notifications.filter(n => !n.is_read).length
    const recentCount = notifications.filter(n => {
      const notificationDate = new Date(n.created_at)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return notificationDate > oneDayAgo
    }).length

    return { readCount, unreadCount, recentCount }
  }

  const stats = getNotificationStats()

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                🔔 Notifications
              </h2>
              <p className="text-muted mb-0">
                Stay updated with important alerts and activities
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-success"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                📭 Mark All Read
              </Button>
              <Button
                variant="outline-danger"
                onClick={handleDeleteAll}
                disabled={notifications.length === 0}
              >
                🗑️ Clear All
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          ⚠️ {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <NotificationFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onSearch={handleSearch}
        onMarkAllRead={handleMarkAllRead}
        onMarkAllUnread={handleMarkAllUnread}
        onDeleteAll={handleDeleteAll}
      />

      {/* Stats */}
      <NotificationStats
        totalCount={totalCount}
        unreadCount={unreadCount}
        readCount={stats.readCount}
        recentCount={stats.recentCount}
      />

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>🔔</div>
            <h5>No notifications found</h5>
            <p className="text-muted">
              {searchQuery || selectedStatus 
                ? 'Try adjusting your search criteria'
                : 'You have no notifications yet'
              }
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {notifications.map((notification) => (
              <Col key={notification.id} md={6} lg={4} className="mb-4">
                <NotificationCard
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onMarkUnread={handleMarkUnread}
                  onDelete={(notification) => {
                    setSelectedNotification(notification)
                    setShowDeleteModal(true)
                  }}
                  onView={handleView}
                />
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <Row className="mt-4">
              <Col>
                <div className="d-flex justify-content-center">
                  <Pagination>
                    <Pagination.Prev 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Pagination.Item
                        key={page}
                        active={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this notification? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => {
            handleDelete(selectedNotification)
            setShowDeleteModal(false)
            setSelectedNotification(null)
          }}>
            🗑️ Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Notifications