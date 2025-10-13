import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getProfile } from '../services/users'

const Dashboard = () => {
  const { user: authUser, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(authUser)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        navigate('/')
        return
      }
      try {
        const response = await getProfile()
        setUser(response.data)
      } catch (err) {
        console.error("Failed to fetch user profile:", err)
        setError('Failed to load user data. Please try logging in again.')
        // Optionally log out if token is invalid
        if (err.response?.status === 401) {
          logout()
        }
      } finally {
        setLoading(false)
      }
    }

    if (!user) { // Only fetch if user data is not already in context
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, navigate, user, logout])

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
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate('/')}>Go to Login</Button>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container className="mt-5">
        <Alert variant="info">User data not available. Please log in.</Alert>
        <Button onClick={() => navigate('/')}>Go to Login</Button>
      </Container>
    )
  }

  return (
    <Container className="py-5 mt-5">
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-primary text-white shadow-sm">
            <Card.Body>
              <h2 className="mb-3">Welcome, {user.username}!</h2>
              <p className="lead">
                You are logged in as a{' '}
                <Badge bg={getRoleBadgeVariant(user.role)} className="ms-1">
                  {getRoleDisplayName(user.role)}
                </Badge>
              </p>
              {user.email && <p>Email: {user.email}</p>}
              {user.last_login && <p>Last Login: {new Date(user.last_login).toLocaleString()}</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Access Cards */}
      <h3 className="mb-4 text-primary">Quick Access</h3>
      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card 
            className="h-100 shadow-sm" 
            style={{
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
            }}
          >
            <Card.Body className="text-center">
              <div className="text-info mb-3" style={{ fontSize: '3rem' }}>📚</div>
              <Card.Title>Resources</Card.Title>
              <Card.Text>Browse and manage educational materials.</Card.Text>
              <Button as={Link} to="/resources" variant="outline-info" className="mt-3">
                View Resources
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card 
            className="h-100 shadow-sm" 
            style={{
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
            }}
          >
            <Card.Body className="text-center">
              <div className="text-warning mb-3" style={{ fontSize: '3rem' }}>📅</div>
              <Card.Title>Events</Card.Title>
              <Card.Text>Discover and register for upcoming events.</Card.Text>
              <Button as={Link} to="/events" variant="outline-warning" className="mt-3">
                Upcoming Events
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card 
            className="h-100 shadow-sm" 
            style={{
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
            }}
          >
            <Card.Body className="text-center">
              <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>🔔</div>
              <Card.Title>Notifications</Card.Title>
              <Card.Text>Stay updated with important alerts.</Card.Text>
              <Button as={Link} to="/notifications" variant="outline-danger" className="mt-3">
                View Notifications{' '}
                {user.unread_notifications_count > 0 && (
                  <Badge bg="danger" className="ms-1">
                    {user.unread_notifications_count}
                  </Badge>
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card 
            className="h-100 shadow-sm" 
            style={{
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
            }}
          >
            <Card.Body className="text-center">
              <div className="text-success mb-3" style={{ fontSize: '3rem' }}>💬</div>
              <Card.Title>Chat</Card.Title>
              <Card.Text>Connect with peers and teachers in real-time.</Card.Text>
              <Button as={Link} to="/chat" variant="outline-success" className="mt-3">
                Join Chats
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Student Profile Card - Only for Students */}
      {user?.role === 'student' && (
        <>
          <h3 className="mb-4 text-primary">Student Tools</h3>
          <Row className="g-4 mb-5">
            <Col md={6} lg={3}>
              <Card 
                className="h-100 shadow-sm" 
                style={{
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                }}
              >
                <Card.Body className="text-center">
                  <div className="text-info mb-3" style={{ fontSize: '3rem' }}>👨‍🎓</div>
                  <Card.Title>Student Profile</Card.Title>
                  <Card.Text>Manage your academic profile and information.</Card.Text>
                  <Button as={Link} to="/student-profile" variant="outline-info" className="mt-3">
                    Manage Profile
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Teacher Profile Card - Only for Teachers */}
      {user?.role === 'teacher' && (
        <>
          <h3 className="mb-4 text-primary">Teacher Tools</h3>
          <Row className="g-4 mb-5">
            <Col md={6} lg={3}>
              <Card 
                className="h-100 shadow-sm" 
                style={{
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                }}
              >
                <Card.Body className="text-center">
                  <div className="text-success mb-3" style={{ fontSize: '3rem' }}>👨‍🏫</div>
                  <Card.Title>Teacher Profile</Card.Title>
                  <Card.Text>Manage your professional profile and teaching information.</Card.Text>
                  <Button as={Link} to="/teacher-profile" variant="outline-success" className="mt-3">
                    Manage Profile
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Activity Overview */}
      <h3 className="mb-4 text-primary">Your Activity</h3>
      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="card-title">📊 Quick Stats</h5>
              <ul className="list-unstyled mt-3">
                <li>Total Resources Uploaded: <strong>{user.uploaded_resources_count || 0}</strong></li>
                <li>Events Attending: <strong>{user.registered_events_count || 0}</strong></li>
                <li>Total Messages Sent: <strong>{user.messages_sent_count || 0}</strong></li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5 className="card-title">👥 Recent Activity</h5>
              <ul className="list-unstyled mt-3">
                <li>No recent activity to display.</li>
                {/* Example: <li>You uploaded "Advanced Calculus.pdf" on Oct 1, 2025.</li> */}
                {/* Example: <li>You joined "Group Study Session" event on Sep 28, 2025.</li> */}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
