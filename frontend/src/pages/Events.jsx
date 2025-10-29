import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Pagination } from 'react-bootstrap'
import { 
  getEvents, createEvent, updateEvent, deleteEvent, registerEvent, unregisterEvent, getAttendees
} from '../services/events'
import { useAuth } from '../contexts/AuthContext'
import EventCard from '../components/EventCard'
import EventCreateModal from '../components/EventCreateModal'
import EventFilters from '../components/EventFilters'
import EventStats from '../components/EventStats'

const Events = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('start_time')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [creating, setCreating] = useState(false)
  const [userRegistrations, setUserRegistrations] = useState(new Set())

  useEffect(() => {
    fetchEvents()
  }, [currentPage, selectedStatus, sortBy, sortOrder, searchQuery])

  // Add debounced search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
    }, 300) // 300ms delay after user stops typing

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        status: selectedStatus,
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
        search: searchQuery
      }
      
      const response = await getEvents(params)
      setEvents(response.data.results || response.data)
      setTotalPages(response.data.total_pages || 1)
      setTotalCount(response.data.count || response.data.length)
      
      // Fetch user registrations for each event
      if (user) {
        const registrations = new Set()
        for (const event of response.data.results || response.data) {
          try {
            const attendeesResponse = await getAttendees(event.id)
            const attendees = attendeesResponse.data.attendees || attendeesResponse.data
            if (attendees.some(attendee => attendee.id === user.id)) {
              registrations.add(event.id)
            }
          } catch (err) {
            // Ignore errors for individual attendee checks
          }
        }
        setUserRegistrations(registrations)
      }
    } catch (err) {
      setError('Failed to load events: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchEvents()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleCreate = async (formData) => {
    try {
      setCreating(true)
      setError('')
      
      if (selectedEvent) {
        // Editing existing event
        await updateEvent(selectedEvent.id, formData)
      } else {
        // Creating new event
        await createEvent(formData)
      }
      
      setShowCreateModal(false)
      setSelectedEvent(null)
      fetchEvents()
      
    } catch (err) {
      console.error('Event creation error:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      console.error('Error headers:', err.response?.headers)
      
      let errorMessage = selectedEvent ? 'Failed to update event' : 'Failed to create event'
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage += ': ' + err.response.data
        } else if (err.response.data.detail) {
          errorMessage += ': ' + err.response.data.detail
        } else if (err.response.data.message) {
          errorMessage += ': ' + err.response.data.message
        } else {
          // Handle validation errors
          const validationErrors = []
          Object.keys(err.response.data).forEach(field => {
            const fieldErrors = err.response.data[field]
            if (Array.isArray(fieldErrors)) {
              validationErrors.push(`${field}: ${fieldErrors.join(', ')}`)
            } else {
              validationErrors.push(`${field}: ${fieldErrors}`)
            }
          })
          if (validationErrors.length > 0) {
            errorMessage += ':\n' + validationErrors.join('\n')
          }
        }
      } else {
        errorMessage += ': ' + err.message
      }
      
      setError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEvent(selectedEvent.id)
      setShowDeleteModal(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (err) {
      setError('Failed to delete event: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleRegister = async (event) => {
    try {
      await registerEvent(event.id)
      setUserRegistrations(prev => new Set([...prev, event.id]))
      fetchEvents() // Refresh to update attendee count
    } catch (err) {
      setError('Failed to register for event: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleUnregister = async (event) => {
    try {
      await unregisterEvent(event.id)
      setUserRegistrations(prev => {
        const newSet = new Set(prev)
        newSet.delete(event.id)
        return newSet
      })
      fetchEvents() // Refresh to update attendee count
    } catch (err) {
      setError('Failed to unregister from event: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleView = (event) => {
    // TODO: Implement event detail view
    // View event details
  }

  const handleEdit = (event) => {
    setSelectedEvent(event)
    setShowCreateModal(true)
  }

  const canEditEvent = (event) => {
    return user && (user.id === event.created_by_id || user.is_staff)
  }

  const canDeleteEvent = (event) => {
    return user && (user.id === event.created_by_id || user.is_staff)
  }

  const getEventStats = () => {
    const now = new Date()
    let upcoming = 0
    let ongoing = 0
    let past = 0
    let totalAttendees = 0

    events.forEach(event => {
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)
      
      if (now < start) {
        upcoming++
      } else if (now >= start && now <= end) {
        ongoing++
      } else {
        past++
      }
      
      totalAttendees += event.attendees_count || 0
    })

    return { upcoming, ongoing, past, totalAttendees }
  }

  const stats = getEventStats()

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                📅 Events
              </h2>
              <p className="text-muted mb-0">
                Discover and join educational events and workshops
              </p>
            </div>
            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="d-flex align-items-center"
              >
                ➕ Create Event
              </Button>
            )}
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
      <EventFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
      />

      {/* Stats */}
      <EventStats
        totalCount={totalCount}
        upcomingCount={stats.upcoming}
        ongoingCount={stats.ongoing}
        pastCount={stats.past}
        totalAttendees={stats.totalAttendees}
      />

      {/* Search Results Indicator */}
      {searchQuery && (
        <div className="mb-3">
          <small className="text-muted">
            Showing results for: "<strong>{searchQuery}</strong>" 
            ({totalCount} event{totalCount !== 1 ? 's' : ''} found)
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleClearSearch}
              className="p-0 ms-2"
            >
              Clear search
            </Button>
          </small>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>📅</div>
            <h5>No events found</h5>
            <p className="text-muted">
              {searchQuery || selectedStatus 
                ? 'Try adjusting your search criteria'
                : 'No events have been created yet'
              }
            </p>
            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                📅 Create First Event
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {events.map((event) => (
              <Col key={event.id} md={6} lg={4} className="mb-4">
                <EventCard
                  event={event}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={(event) => {
                    setSelectedEvent(event)
                    setShowDeleteModal(true)
                  }}
                  onRegister={handleRegister}
                  onUnregister={handleUnregister}
                  canEdit={canEditEvent(event)}
                  canDelete={canDeleteEvent(event)}
                  isRegistered={userRegistrations.has(event.id)}
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

      {/* Create Event Modal */}
      <EventCreateModal
        show={showCreateModal}
        onHide={() => {
          setShowCreateModal(false)
          setSelectedEvent(null)
        }}
        onSubmit={handleCreate}
        loading={creating}
        event={selectedEvent}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            🗑️ Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Events