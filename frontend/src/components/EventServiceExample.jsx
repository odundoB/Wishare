import React, { useState, useEffect } from 'react'
import { Button, Card, Alert, Form, Row, Col, Table, Badge, Modal, Tabs, Tab } from 'react-bootstrap'
import { 
  createEvent, 
  getEvents, 
  getEvent, 
  updateEvent, 
  deleteEvent, 
  registerEvent,
  unregisterEvent,
  getAttendees,
  getUpcomingEvents,
  getPastEvents,
  getMyEvents,
  getRegisteredEvents,
  searchEvents,
  getEventStats,
  checkRegistration
} from '../services/events'

const EventServiceExample = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState([])
  const [attendees, setAttendees] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [stats, setStats] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEventModal, setShowEventModal] = useState(false)
  const [showAttendeesModal, setShowAttendeesModal] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    event_type: 'class',
    max_participants: '',
    is_public: true,
    requirements: '',
    materials: ''
  })

  const handleEventFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setEventFormData({
      ...eventFormData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const testCreateEvent = async () => {
    if (!eventFormData.title.trim() || !eventFormData.start_time || !eventFormData.end_time) {
      setResult({
        type: 'warning',
        message: 'Please fill in required fields (title, start time, end time)'
      })
      return
    }

    setLoading(true)
    setResult(null)
    
    try {
      const response = await createEvent(eventFormData)
      setResult({
        type: 'success',
        message: 'Event created successfully!',
        data: response.data
      })
      
      // Refresh events list
      loadEvents()
      
      // Reset form
      setEventFormData({
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        event_type: 'class',
        max_participants: '',
        is_public: true,
        requirements: '',
        materials: ''
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Create event failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const loadEvents = async (type = 'all') => {
    setLoading(true)
    setResult(null)
    
    try {
      let response
      switch (type) {
        case 'upcoming':
          response = await getUpcomingEvents({ page_size: 20 })
          break
        case 'past':
          response = await getPastEvents({ page_size: 20 })
          break
        case 'my':
          response = await getMyEvents({ page_size: 20 })
          break
        case 'registered':
          response = await getRegisteredEvents({ page_size: 20 })
          break
        default:
          response = await getEvents({ page_size: 20, ordering: '-start_time' })
      }
      
      setEvents(response.data.results || response.data)
      setResult({
        type: 'success',
        message: `Loaded ${response.data.results?.length || response.data.length} events`,
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Load events failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testGetEvent = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getEvent(id)
      setSelectedEvent(response.data)
      setShowEventModal(true)
      setResult({
        type: 'success',
        message: 'Event details retrieved!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get event failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testUpdateEvent = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const updateData = {
        ...eventFormData,
        title: eventFormData.title + ' (Updated)'
      }
      
      const response = await updateEvent(id, updateData)
      setResult({
        type: 'success',
        message: 'Event updated successfully!',
        data: response.data
      })
      
      // Refresh events list
      loadEvents(activeTab)
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Update event failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testDeleteEvent = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await deleteEvent(id)
      setResult({
        type: 'success',
        message: 'Event deleted successfully!',
        data: response.data
      })
      
      // Refresh events list
      loadEvents(activeTab)
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Delete event failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testRegisterEvent = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await registerEvent(id, {
        notes: 'Interested in attending this event'
      })
      setResult({
        type: 'success',
        message: 'Successfully registered for event!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Registration failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testUnregisterEvent = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await unregisterEvent(id)
      setResult({
        type: 'success',
        message: 'Successfully unregistered from event!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Unregistration failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testGetAttendees = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getAttendees(id, { page_size: 50 })
      setAttendees(response.data.results || response.data)
      setShowAttendeesModal(true)
      setResult({
        type: 'success',
        message: `Retrieved ${response.data.results?.length || response.data.length} attendees`,
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get attendees failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testSearchEvents = async () => {
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
      const response = await searchEvents(searchQuery, {
        page: 1,
        page_size: 20
      })
      setEvents(response.data.results || response.data)
      setResult({
        type: 'success',
        message: `Found ${response.data.results?.length || response.data.length} events for "${searchQuery}"`,
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

  const testGetStats = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getEventStats()
      setStats(response.data)
      setResult({
        type: 'success',
        message: 'Event statistics retrieved!',
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

  const getEventStatus = (event) => {
    const now = new Date()
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'ongoing'
    if (now > end) return 'past'
    return 'unknown'
  }

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'success',
      ongoing: 'warning',
      past: 'secondary',
      cancelled: 'danger'
    }
    return colors[status] || 'light'
  }

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString()
  }

  useEffect(() => {
    loadEvents(activeTab)
  }, [activeTab])

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Event Service Functions Test</h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-4">
          Test the event service functions from <code>src/services/events.js</code>
        </p>

        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
          <Tab eventKey="all" title="All Events">
            <div className="mt-3">
              <Row className="mb-3">
                <Col md={8}>
                  <Form.Control
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Button 
                    variant="info" 
                    onClick={testSearchEvents}
                    disabled={loading}
                    className="w-100"
                  >
                    Search
                  </Button>
                </Col>
              </Row>
              
              <Button 
                variant="primary" 
                onClick={() => loadEvents('all')}
                disabled={loading}
                className="mb-3"
              >
                Load All Events
              </Button>
            </div>
          </Tab>
          <Tab eventKey="upcoming" title="Upcoming">
            <div className="mt-3">
              <Button 
                variant="success" 
                onClick={() => loadEvents('upcoming')}
                disabled={loading}
                className="mb-3"
              >
                Load Upcoming Events
              </Button>
            </div>
          </Tab>
          <Tab eventKey="past" title="Past">
            <div className="mt-3">
              <Button 
                variant="secondary" 
                onClick={() => loadEvents('past')}
                disabled={loading}
                className="mb-3"
              >
                Load Past Events
              </Button>
            </div>
          </Tab>
          <Tab eventKey="my" title="My Events">
            <div className="mt-3">
              <Button 
                variant="warning" 
                onClick={() => loadEvents('my')}
                disabled={loading}
                className="mb-3"
              >
                Load My Events
              </Button>
            </div>
          </Tab>
          <Tab eventKey="registered" title="Registered">
            <div className="mt-3">
              <Button 
                variant="info" 
                onClick={() => loadEvents('registered')}
                disabled={loading}
                className="mb-3"
              >
                Load Registered Events
              </Button>
            </div>
          </Tab>
        </Tabs>

        <Row>
          {/* Create Event Form */}
          <Col md={4}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">Create Event</h6>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-2">
                    <Form.Label>Title *</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={eventFormData.title}
                      onChange={handleEventFormChange}
                      placeholder="Event title"
                      size="sm"
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="description"
                      value={eventFormData.description}
                      onChange={handleEventFormChange}
                      placeholder="Event description"
                      size="sm"
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={eventFormData.location}
                      onChange={handleEventFormChange}
                      placeholder="Event location"
                      size="sm"
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Start Time *</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="start_time"
                          value={eventFormData.start_time}
                          onChange={handleEventFormChange}
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>End Time *</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="end_time"
                          value={eventFormData.end_time}
                          onChange={handleEventFormChange}
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Type</Form.Label>
                        <Form.Select
                          name="event_type"
                          value={eventFormData.event_type}
                          onChange={handleEventFormChange}
                          size="sm"
                        >
                          <option value="class">Class</option>
                          <option value="meeting">Meeting</option>
                          <option value="workshop">Workshop</option>
                          <option value="exam">Exam</option>
                          <option value="conference">Conference</option>
                          <option value="social">Social</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Max Participants</Form.Label>
                        <Form.Control
                          type="number"
                          name="max_participants"
                          value={eventFormData.max_participants}
                          onChange={handleEventFormChange}
                          placeholder="Optional"
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-2">
                    <Form.Check
                      type="checkbox"
                      name="is_public"
                      checked={eventFormData.is_public}
                      onChange={handleEventFormChange}
                      label="Public Event"
                    />
                  </Form.Group>

                  <Button 
                    variant="success" 
                    onClick={testCreateEvent}
                    disabled={loading}
                    size="sm"
                    className="w-100"
                  >
                    Create Event
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            {/* Stats */}
            <Card className="mt-3">
              <Card.Header>
                <h6 className="mb-0">Statistics</h6>
              </Card.Header>
              <Card.Body>
                <Button 
                  variant="outline-info"
                  onClick={testGetStats}
                  disabled={loading}
                  size="sm"
                  className="w-100 mb-2"
                >
                  Get Stats
                </Button>
                {stats && (
                  <div className="small">
                    <div>Total Events: {stats.total_events}</div>
                    <div>Upcoming: {stats.upcoming_events}</div>
                    <div>Past: {stats.past_events}</div>
                    <div>My Events: {stats.my_events}</div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Events List */}
          <Col md={8}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  Events ({events.length})
                </h6>
              </Card.Header>
              <Card.Body>
                {events.length > 0 ? (
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Start Time</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td>{event.id}</td>
                          <td>
                            <div>
                              <strong>{event.title}</strong>
                              {!event.is_public && (
                                <Badge bg="warning" className="ms-1">Private</Badge>
                              )}
                            </div>
                            <small className="text-muted">
                              {event.description?.substring(0, 50)}...
                            </small>
                          </td>
                          <td>
                            <Badge bg="secondary">{event.event_type}</Badge>
                          </td>
                          <td>
                            <Badge bg={getStatusColor(getEventStatus(event))}>
                              {getEventStatus(event)}
                            </Badge>
                          </td>
                          <td>
                            <small>{formatDateTime(event.start_time)}</small>
                          </td>
                          <td>{event.location || 'N/A'}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline-info"
                                onClick={() => testGetEvent(event.id)}
                                disabled={loading}
                              >
                                View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-warning"
                                onClick={() => testUpdateEvent(event.id)}
                                disabled={loading}
                              >
                                Update
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-success"
                                onClick={() => testRegisterEvent(event.id)}
                                disabled={loading}
                              >
                                Register
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-primary"
                                onClick={() => testGetAttendees(event.id)}
                                disabled={loading}
                              >
                                Attendees
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-danger"
                                onClick={() => testDeleteEvent(event.id)}
                                disabled={loading}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center text-muted py-4">
                    No events found
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

        {/* Event Details Modal */}
        <Modal show={showEventModal} onHide={() => setShowEventModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Event Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEvent && (
              <div>
                <h5>{selectedEvent.title}</h5>
                <p><strong>Description:</strong> {selectedEvent.description}</p>
                <p><strong>Location:</strong> {selectedEvent.location || 'N/A'}</p>
                <p><strong>Start Time:</strong> {formatDateTime(selectedEvent.start_time)}</p>
                <p><strong>End Time:</strong> {formatDateTime(selectedEvent.end_time)}</p>
                <p><strong>Type:</strong> {selectedEvent.event_type}</p>
                <p><strong>Status:</strong> {getEventStatus(selectedEvent)}</p>
                <p><strong>Public:</strong> {selectedEvent.is_public ? 'Yes' : 'No'}</p>
                {selectedEvent.max_participants && (
                  <p><strong>Max Participants:</strong> {selectedEvent.max_participants}</p>
                )}
                {selectedEvent.requirements && (
                  <p><strong>Requirements:</strong> {selectedEvent.requirements}</p>
                )}
                {selectedEvent.materials && (
                  <p><strong>Materials:</strong> {selectedEvent.materials}</p>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEventModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Attendees Modal */}
        <Modal show={showAttendeesModal} onHide={() => setShowAttendeesModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Event Attendees</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {attendees.length > 0 ? (
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Registered At</th>
                    <th>Attended</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((attendee, index) => (
                    <tr key={index}>
                      <td>{attendee.user?.username || 'N/A'}</td>
                      <td>{attendee.user?.email || 'N/A'}</td>
                      <td>{formatDateTime(attendee.registered_at)}</td>
                      <td>
                        <Badge bg={attendee.attended ? 'success' : 'secondary'}>
                          {attendee.attended ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center text-muted py-4">
                No attendees found
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAttendeesModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  )
}

export default EventServiceExample
