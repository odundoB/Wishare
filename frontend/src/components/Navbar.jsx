import React from 'react'
import { Navbar as BSNavbar, Nav, Container, Badge } from 'react-bootstrap'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isLandingPage = location.pathname === '/'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

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

  return (
    <BSNavbar 
      bg={isLandingPage ? "transparent" : "light"} 
      expand="lg" 
      fixed="top" 
      className={isLandingPage ? "navbar-transparent" : "shadow-sm"}
    >
      <Container>
        <BSNavbar.Brand as={Link} to={isAuthenticated ? "/dashboard" : "/"} className={`fw-bold ${isLandingPage ? "text-primary" : "text-primary"}`}>
          <span className="me-2">🎓</span>
          WISHARE
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/resources" className={`fw-medium ${isLandingPage ? "text-white" : ""}`}>
                  Resources
                </Nav.Link>
                <Nav.Link as={Link} to="/events" className={`fw-medium ${isLandingPage ? "text-white" : ""}`}>
                  Events
                </Nav.Link>
                <Nav.Link as={Link} to="/chat" className={`fw-medium ${isLandingPage ? "text-white" : ""}`}>
                  Chat
                </Nav.Link>
                <Nav.Link as={Link} to="/notifications" className={`fw-medium ${isLandingPage ? "text-white" : ""}`}>
                  Notifications
                  {user?.unread_notifications_count > 0 && (
                    <Badge bg="danger" className="ms-1">
                      {user.unread_notifications_count}
                    </Badge>
                  )}
                </Nav.Link>
                {user?.role === 'student' && (
                  <Nav.Link as={Link} to="/student-profile" className={`fw-medium ${isLandingPage ? "text-white" : ""}`}>
                    Student Profile
                  </Nav.Link>
                )}
                {user?.role === 'teacher' && (
                  <Nav.Link as={Link} to="/teacher-profile" className={`fw-medium ${isLandingPage ? "text-white" : ""}`}>
                    Teacher Profile
                  </Nav.Link>
                )}
              </>
            ) : isLandingPage ? (
              <>
                <Nav.Link href="#features" className="text-white fw-medium">Features</Nav.Link>
                <Nav.Link href="#testimonials" className="text-white fw-medium">Testimonials</Nav.Link>
                <Nav.Link href="#contact" className="text-white fw-medium">Contact</Nav.Link>
              </>
            ) : null}
          </Nav>
          
          <Nav className="align-items-center">
            {isAuthenticated ? (
              <>
                {/* User Role Label */}
                <Nav.Item className="me-3">
                  <Badge 
                    bg={getRoleBadgeVariant(user?.role)} 
                    className="px-2 py-1"
                  >
                    {getRoleDisplayName(user?.role)}
                  </Badge>
                </Nav.Item>
                
                {/* User Welcome */}
                <Nav.Item className="me-3">
                  <span className={isLandingPage ? "text-white" : "text-muted"}>
                    Welcome, <strong>{user?.username || 'User'}</strong>
                  </span>
                </Nav.Item>
                
                {/* Logout Button */}
                <Nav.Item>
                  <Nav.Link 
                    onClick={handleLogout}
                    className={`btn btn-outline-${isLandingPage ? "light" : "danger"} btn-sm px-3`}
                    style={{ cursor: 'pointer' }}
                  >
                    Logout
                  </Nav.Link>
                </Nav.Item>
              </>
            ) : isLandingPage ? (
              <>
                <Nav.Link as={Link} to="/login" className="btn btn-outline-light btn-sm px-3 me-2">
                  Sign In
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="btn btn-warning btn-sm px-3">
                  Get Started
                </Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to="/login" className="btn btn-primary btn-sm px-3">
                Login
              </Nav.Link>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  )
}

export default Navbar
