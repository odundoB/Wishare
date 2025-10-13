import React from 'react'
import { Row, Col, Card } from 'react-bootstrap'

const NotificationStats = ({ 
  totalCount, 
  unreadCount, 
  readCount,
  recentCount 
}) => {
  return (
    <Row className="mb-4">
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-primary">{totalCount}</h4>
            <small className="text-muted">Total Notifications</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-danger">{unreadCount}</h4>
            <small className="text-muted">Unread</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-success">{readCount}</h4>
            <small className="text-muted">Read</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-info">{recentCount}</h4>
            <small className="text-muted">Recent (24h)</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default NotificationStats
