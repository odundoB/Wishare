import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Spinner, Row, Col } from 'react-bootstrap'

const EventCreateModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: ''
  })

  // Initialize form with default values when component mounts
  useEffect(() => {
    if (show) {
      setFormData({
        title: '',
        description: '',
        location: '',
        start_time: getDefaultStartTime(),
        end_time: getDefaultEndTime()
      })
    }
  }, [show])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation checks before submission
    if (!formData.title.trim()) {
      alert('Please enter a valid event title');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Please enter a valid event description');
      return;
    }
    
    if (!formData.location.trim()) {
      alert('Please enter a valid event location');
      return;
    }
    
    if (!formData.start_time) {
      alert('Please select a start time');
      return;
    }
    
    if (!formData.end_time) {
      alert('Please select an end time');
      return;
    }
    
    // Check that end time is after start time
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      alert('End time must be after start time');
      return;
    }
    
    // Convert datetime-local values to ISO format for backend
    const submitData = {
      ...formData,
      start_time: toISOString(formData.start_time),
      end_time: toISOString(formData.end_time)
    }
    
    console.log('EventCreateModal - Form data:', formData)
    console.log('EventCreateModal - Submit data:', submitData)
    console.log('EventCreateModal - Start time conversion:', formData.start_time, '->', toISOString(formData.start_time))
    console.log('EventCreateModal - End time conversion:', formData.end_time, '->', toISOString(formData.end_time))
    
    onSubmit(submitData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      start_time: getDefaultStartTime(),
      end_time: getDefaultEndTime()
    })
  }

  const handleClose = () => {
    resetForm()
    onHide()
  }

  // Convert ISO string to datetime-local format
  const toDateTimeLocal = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toISOString().slice(0, 16)
  }

  // Convert datetime-local format to ISO string
  const toISOString = (dateTimeLocal) => {
    if (!dateTimeLocal) return ''
    try {
      // Create date from datetime-local input (which is in local timezone)
      // datetime-local format is YYYY-MM-DDTHH:mm
      const date = new Date(dateTimeLocal)
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateTimeLocal)
        return ''
      }
      
      // For backend compatibility, we need to ensure the time is in the correct format
      // The backend expects ISO 8601 format in UTC
      const isoString = date.toISOString()
      console.log(`Converting ${dateTimeLocal} -> ${isoString}`)
      return isoString
    } catch (error) {
      console.error('Error converting date:', error, dateTimeLocal)
      return ''
    }
  }

  // Set default start time to current time + 1 hour
  const getDefaultStartTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16)
  }

  // Set default end time to start time + 2 hours
  const getDefaultEndTime = () => {
    const startTime = new Date(formData.start_time || getDefaultStartTime())
    startTime.setHours(startTime.getHours() + 2)
    return startTime.toISOString().slice(0, 16)
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          📅 Create New Event
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Event Title *</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter event title"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Event location"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the event details, agenda, and what participants can expect"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Time *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time || getDefaultStartTime()}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Time *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time || getDefaultEndTime()}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              <>
                📅 Create Event
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default EventCreateModal
