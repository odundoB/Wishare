import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getProfile } from '../services/users'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserData = async () => {
      // Check if token exists in localStorage
      const token = localStorage.getItem('access_token')
      if (!token) {
        navigate('/')
        return
      }

      try {
        setLoading(true)
        const response = await getProfile()
        setUser(response.data)
        setError('')
      } catch (error) {
        console.error('Error fetching user profile:', error)
        
        // If token is invalid, clear it and redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          navigate('/')
          return
        }
        
        setError('Failed to load user data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [navigate])

  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case 'teacher':
        return 'success'
      case 'student':
        return 'primary'
      case 'admin':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case 'teacher':
        return 'Teacher'
      case 'student':
        return 'Student'
      case 'admin':
        return 'Admin'
      default:
        return 'User'
    }
  }

  if (loading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading dashboard...</p>
          </Col>
        </Row>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="danger">
              <Alert.Heading>Error Loading Dashboard</Alert.Heading>
              <p>{error}</p>
              <Button variant="outline-danger" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      {/* Welcome Section */}
      <Row className="mb-5">
        <Col>
          <Card className="bg-primary text-white">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <h2 className="mb-2">
                    Welcome back, {user?.username || 'User'}!
                  </h2>
                  <p className="mb-0 fs-5">
                    Role: <span className={`badge bg-${getRoleBadgeVariant(user?.role)} fs-6`}>
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </p>
                  {user?.email && (
                    <p className="mb-0 mt-2 opacity-75">
                      Email: {user.email}
                    </p>
                  )}
                </Col>
                <Col md={4} className="text-end">
                  <div className="text-end">
                    <p className="mb-1 fs-6 opacity-75">Last login</p>
                    <p className="mb-0 fs-6">
                      {user?.last_login ? 
                        new Date(user.last_login).toLocaleDateString() : 
                        'Today'
                      }
                    </p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Access Cards */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <i className="fas fa-book fa-3x text-primary"></i>
              </div>
              <Card.Title className="h5">View Resources</Card.Title>
              <Card.Text className="text-muted">
                Access and manage educational materials, documents, and learning resources.
              </Card.Text>
              <Button 
                variant="primary" 
                className="w-100"
                onClick={() => navigate('/resources')}
              >
                Go to Resources
              </Button>
            </Card.Body>
          </Card>
        </Col>


        <Col md={6} lg={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <i className="fas fa-calendar fa-3x text-info"></i>
              </div>
              <Card.Title className="h5">Upcoming Events</Card.Title>
              <Card.Text className="text-muted">
                Stay updated with upcoming classes, meetings, workshops, and educational events.
              </Card.Text>
              <Button 
                variant="info" 
                className="w-100"
                onClick={() => navigate('/events')}
              >
                View Events
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <i className="fas fa-bell fa-3x text-warning"></i>
              </div>
              <Card.Title className="h5">Notifications</Card.Title>
              <Card.Text className="text-muted">
                Stay updated with important announcements, updates, and system notifications.
              </Card.Text>
              <Button 
                variant="warning" 
                className="w-100"
                onClick={() => navigate('/notifications')}
              >
                View Notifications
                {user?.unread_notifications_count > 0 && (
                  <span className="badge bg-danger ms-2">
                    {user.unread_notifications_count}
                  </span>
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Information Cards */}
      <Row className="g-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col>
                  <div className="mb-2">
                    <i className="fas fa-chart-line fa-2x text-primary"></i>
                  </div>
                  <h6>Activity</h6>
                  <p className="text-muted small">Track your progress</p>
                </Col>
                <Col>
                  <div className="mb-2">
                    <i className="fas fa-users fa-2x text-success"></i>
                  </div>
                  <h6>Community</h6>
                  <p className="text-muted small">Connect with peers</p>
                </Col>
                <Col>
                  <div className="mb-2">
                    <i className="fas fa-trophy fa-2x text-warning"></i>
                  </div>
                  <h6>Achievements</h6>
                  <p className="text-muted small">View your badges</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <i className="fas fa-circle text-success me-2" style={{ fontSize: '8px' }}></i>
                <span className="small">Successfully logged in</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <i className="fas fa-circle text-info me-2" style={{ fontSize: '8px' }}></i>
                <span className="small">Dashboard loaded</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="fas fa-circle text-muted me-2" style={{ fontSize: '8px' }}></i>
                <span className="small text-muted">Ready to explore</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
