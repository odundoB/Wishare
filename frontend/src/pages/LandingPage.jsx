import React from 'react'
import { Container, Row, Col, Card, Button, Badge, ListGroup } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import VideoPlayer from '../components/VideoPlayer'
import './LandingPage.css'

const LandingPage = () => {
  const { user, isAuthenticated } = useAuth()

  const features = [
    {
      icon: '📚',
      title: 'Resource Library',
      description: 'Access a vast collection of educational materials, documents, and multimedia resources.',
      color: 'primary'
    },
    {
      icon: '📅',
      title: 'Event Management',
      description: 'Stay updated with upcoming events, workshops, and important academic schedules.',
      color: 'warning'
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Receive timely updates about new resources, events, and important announcements.',
      color: 'info'
    },
    {
      icon: '🔍',
      title: 'Advanced Search',
      description: 'Find exactly what you need with our powerful search and filtering capabilities.',
      color: 'secondary'
    },
    {
      icon: '👥',
      title: 'Community Driven',
      description: 'Connect with educators and learners in a collaborative knowledge-sharing environment.',
      color: 'danger'
    }
  ]

  const stats = [
    { number: '1000+', label: 'Resources' },
    { number: '500+', label: 'Active Users' },
    { number: '50+', label: 'Events' },
    { number: '24/7', label: 'Support' }
  ]

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Mathematics Professor',
      content: 'Wishare has revolutionized how I share educational content with my students. The platform is intuitive and feature-rich.',
      avatar: '👩‍🏫'
    },
    {
      name: 'Michael Chen',
      role: 'Computer Science Student',
      content: 'The resource library and event management have made my learning experience so much more interactive and engaging.',
      avatar: '👨‍💻'
    },
    {
      name: 'Emily Rodriguez',
      role: 'English Teacher',
      content: 'I love how easy it is to organize and share resources with my colleagues. The notification system keeps me updated on everything.',
      avatar: '👩‍🎓'
    }
  ]

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col lg={6}>
              <div className="hero-content">
                <Badge bg="light" text="dark" className="mb-3 px-3 py-2">
                  🚀 HERE WE BELONG
                </Badge>
                <h1 className="display-4 fw-bold mb-4">
                  Welcome to <span className="text-warning">Wishare</span>
                </h1>
                <p className="lead mb-4">
                  The ultimate knowledge-sharing platform for educators and students. 
                  Collaborate, learn, and grow together in a dynamic educational environment.
                </p>
                <div className="hero-buttons">
                  {isAuthenticated ? (
                    <Button as={Link} to="/dashboard" size="lg" variant="warning" className="me-3">
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button as={Link} to="/login" size="lg" variant="warning" className="me-3">
                        Get Started
                      </Button>
                      <Button as={Link} to="/register" size="lg" variant="outline-light">
                        Sign Up
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-video-container">
                <VideoPlayer />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5 bg-light">
        <Container>
          <Row className="text-center">
            {stats.map((stat, index) => (
              <Col md={3} key={index} className="mb-4">
                <div className="stat-item">
                  <h2 className="display-6 fw-bold text-primary">{stat.number}</h2>
                  <p className="text-muted">{stat.label}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">Why Choose Wishare?</h2>
              <p className="lead text-muted">
                Discover the features that make our platform the perfect choice for educational collaboration
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            {features.map((feature, index) => (
              <Col lg={4} md={6} key={index}>
                <Card className="h-100 feature-card border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <div className={`feature-icon bg-${feature.color} text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3`} 
                         style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                      {feature.icon}
                    </div>
                    <h5 className="fw-bold mb-3">{feature.title}</h5>
                    <p className="text-muted">{feature.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3">What Our Users Say</h2>
              <p className="lead text-muted">
                Hear from educators and students who are already using our platform
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            {testimonials.map((testimonial, index) => (
              <Col lg={4} key={index}>
                <Card className="h-100 testimonial-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="text-center mb-3">
                      <div className="testimonial-avatar bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                        {testimonial.avatar}
                      </div>
                      <h6 className="fw-bold mb-1">{testimonial.name}</h6>
                      <small className="text-muted">{testimonial.role}</small>
                    </div>
                    <p className="text-center">"{testimonial.content}"</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5 bg-primary text-white">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="display-5 fw-bold mb-3">Ready to Get Started?</h2>
              <p className="lead mb-4">
                Join thousands of educators and students who are already using Wishare
              </p>
              {isAuthenticated ? (
                <Button as={Link} to="/dashboard" size="lg" variant="warning">
                  Go to Dashboard
                </Button>
              ) : (
                <div>
                  <Button as={Link} to="/register" size="lg" variant="warning" className="me-3">
                    Sign Up Now
                  </Button>
                  <Button as={Link} to="/login" size="lg" variant="outline-light">
                    Sign In
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer bg-dark text-white py-5">
        <Container>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <div className="footer-brand mb-4">
                <h4 className="fw-bold text-warning mb-3">
                  <span className="me-2">🎓</span>
                  Wishare
                </h4>
                <p className="text-light">
                  Empowering education through collaborative knowledge sharing. 
                  Connect, learn, and grow together in our dynamic platform.
                </p>
                <div className="social-links">
                  <Button variant="outline-light" size="sm" className="me-2">
                    <i className="fab fa-facebook-f"></i>
                  </Button>
                  <Button variant="outline-light" size="sm" className="me-2">
                    <i className="fab fa-twitter"></i>
                  </Button>
                  <Button variant="outline-light" size="sm" className="me-2">
                    <i className="fab fa-linkedin-in"></i>
                  </Button>
                  <Button variant="outline-light" size="sm">
                    <i className="fab fa-instagram"></i>
                  </Button>
                </div>
              </div>
            </Col>
            
            <Col lg={2} md={6}>
              <h6 className="fw-bold text-warning mb-3">Platform</h6>
              <ListGroup variant="flush" className="footer-links">
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <Link to="/resources" className="text-light text-decoration-none">Resources</Link>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <Link to="/events" className="text-light text-decoration-none">Events</Link>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <Link to="/notifications" className="text-light text-decoration-none">Notifications</Link>
                </ListGroup.Item>
              </ListGroup>
            </Col>
            
            <Col lg={2} md={6}>
              <h6 className="fw-bold text-warning mb-3">Support</h6>
              <ListGroup variant="flush" className="footer-links">
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#help" className="text-light text-decoration-none">Help Center</a>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#contact" className="text-light text-decoration-none">Contact Us</a>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#faq" className="text-light text-decoration-none">FAQ</a>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#tutorials" className="text-light text-decoration-none">Tutorials</a>
                </ListGroup.Item>
              </ListGroup>
            </Col>
            
            <Col lg={2} md={6}>
              <h6 className="fw-bold text-warning mb-3">Legal</h6>
              <ListGroup variant="flush" className="footer-links">
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#privacy" className="text-light text-decoration-none">Privacy Policy</a>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#terms" className="text-light text-decoration-none">Terms of Service</a>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#cookies" className="text-light text-decoration-none">Cookie Policy</a>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                  <a href="#gdpr" className="text-light text-decoration-none">GDPR</a>
                </ListGroup.Item>
              </ListGroup>
            </Col>
            
            <Col lg={2} md={6}>
              <h6 className="fw-bold text-warning mb-3">Contact Info</h6>
              <div className="contact-info">
                <p className="text-light mb-2">
                  <i className="fas fa-envelope me-2"></i>
                  support@wishare.com
                </p>
                <p className="text-light mb-2">
                  <i className="fas fa-phone me-2"></i>
                  +1 (555) 123-4567
                </p>
                <p className="text-light mb-2">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Education District, Tech City
                </p>
                <p className="text-light">
                  <i className="fas fa-clock me-2"></i>
                  Mon-Fri 9AM-6PM
                </p>
              </div>
            </Col>
          </Row>
          
          <hr className="my-4 border-secondary" />
          
          <Row className="align-items-center">
            <Col md={6}>
              <p className="text-light mb-0">
                © 2025 Wishare. All rights reserved.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="text-light mb-0">
                Made with <span className="text-danger">❤️</span> for education
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  )
}

export default LandingPage
