import React from 'react'
import { Row, Col, Card } from 'react-bootstrap'

const EventStats = ({ 
  totalCount, 
  upcomingCount, 
  ongoingCount, 
  pastCount,
  totalAttendees 
}) => {
  return (
    <Row className="mb-4">
      <Col md={2}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-primary">{totalCount}</h4>
            <small className="text-muted">Total Events</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-success">{upcomingCount}</h4>
            <small className="text-muted">Upcoming</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-warning">{ongoingCount}</h4>
            <small className="text-muted">Ongoing</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-secondary">{pastCount}</h4>
            <small className="text-muted">Past</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-info">{totalAttendees}</h4>
            <small className="text-muted">Total Attendees</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default EventStats
