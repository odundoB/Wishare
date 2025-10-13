import React from 'react'
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <Container className="py-5">
      <Row className="text-center mb-5">
        <Col>
          <h1 className="display-4 fw-bold text-primary mb-3">
          Welcome to Wishare
          </h1>
          <p className="lead text-muted">
            Your comprehensive educational platform for sharing resources, 
            managing events, and connecting with the learning community.
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-book fa-3x text-primary"></i>
              </div>
              <Card.Title>Resources</Card.Title>
              <Card.Text>
                Access and share educational materials, documents, and learning resources.
              </Card.Text>
              <Button as={Link} to="/resources" variant="primary">
                Browse Resources
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <div className="mb-3">
                <i className="fas fa-calendar fa-3x text-success"></i>
              </div>
              <Card.Title>Events</Card.Title>
              <Card.Text>
                Stay updated with upcoming classes, meetings, and educational events.
              </Card.Text>
              <Button as={Link} to="/events" variant="success">
                View Events
              </Button>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      {isAuthenticated && (
        <Row className="mt-5">
          <Col>
            <Card className="bg-primary text-white">
              <Card.Body className="text-center">
                <h4>Welcome back, {user?.username}!</h4>
                <p className="mb-0">
                  You have {user?.unread_notifications_count || 0} unread notifications.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {!isAuthenticated && (
        <Row className="mt-5">
          <Col className="text-center">
            <h3>Get Started Today</h3>
            <p className="text-muted mb-4">
              Join our educational community and start sharing knowledge.
            </p>
            <Button as={Link} to="/register" variant="primary" size="lg" className="me-3">
              Sign Up
            </Button>
            <Button as={Link} to="/" variant="outline-primary" size="lg">
              Login
            </Button>
          </Col>
        </Row>
      )}

      {/* Features Section */}
      <Row className="mt-5">
        <Col>
          <h3 className="text-center mb-4">Platform Features</h3>
        </Col>
      </Row>
      
      <Row className="g-4 mb-5">
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="text-primary me-3" style={{ fontSize: '2rem' }}>📚</div>
                <h5 className="mb-0">Resource Management</h5>
              </div>
              <p className="text-muted">
                Upload, organize, and share educational materials including documents, 
                presentations, and multimedia content with your learning community.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="text-success me-3" style={{ fontSize: '2rem' }}>💬</div>
                <h5 className="mb-0">Real-time Communication</h5>
              </div>
              <p className="text-muted">
                Connect with teachers and students through collaborative discussions and resource sharing.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="text-warning me-3" style={{ fontSize: '2rem' }}>📅</div>
                <h5 className="mb-0">Event Management</h5>
              </div>
              <p className="text-muted">
                Create, manage, and participate in educational events, 
                workshops, and study sessions.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="text-info me-3" style={{ fontSize: '2rem' }}>🔔</div>
                <h5 className="mb-0">Smart Notifications</h5>
              </div>
              <p className="text-muted">
                Stay updated with important announcements, 
                event reminders, and activity notifications.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Home
