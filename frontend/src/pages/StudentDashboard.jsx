import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import WorkingChatPage from '../components/WorkingChatPage';
import ErrorBoundary from '../components/ErrorBoundary';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
        <Container fluid className="py-4">
          {/* Welcome Header */}
          <Row className="mb-4">
            <Col>
              <Card className="bg-primary text-white">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="me-3" style={{ fontSize: '3rem' }}>🎓</div>
                    <div>
                      <h2 className="mb-1">Student Dashboard</h2>
                      <p className="mb-0">Welcome back, {user?.first_name || user?.username}!</p>
                      <small className="opacity-75">Join classes and connect with your teachers</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <div style={{ fontSize: '2rem' }}>📚</div>
                  <h6>My Classes</h6>
                  <p className="small text-muted">View joined classes</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <div style={{ fontSize: '2rem' }}>📖</div>
                  <h6>Resources</h6>
                  <p className="small text-muted">Access learning materials</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <div style={{ fontSize: '2rem' }}>📅</div>
                  <h6>Events</h6>
                  <p className="small text-muted">Upcoming activities</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body className="text-center">
                  <div style={{ fontSize: '2rem' }}>🏆</div>
                  <h6>Progress</h6>
                  <p className="small text-muted">Track your learning</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Chat Rooms Section */}
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <div className="d-flex align-items-center">
                    <div className="me-2" style={{ fontSize: '1.5rem' }}>💬</div>
                    <h4 className="mb-0">Available Class Rooms</h4>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Alert variant="info" className="mb-4">
                    <div className="d-flex align-items-center">
                      <div className="me-3" style={{ fontSize: '1.5rem' }}>🎯</div>
                      <div>
                        <strong>Student Features Available:</strong>
                        <ul className="mb-0 mt-2">
                          <li>Browse available class rooms</li>
                          <li>Join rooms instantly (if auto-approve enabled)</li>
                          <li>Request to join classes (requires teacher approval)</li>
                          <li>Participate in real-time discussions</li>
                        </ul>
                      </div>
                    </div>
                  </Alert>

                {/* Embedded Working Chat */}
                <WorkingChatPage />
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
    </ErrorBoundary>
  );
};

export default StudentDashboard;