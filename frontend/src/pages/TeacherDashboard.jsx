import React from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import WorkingChatPage from '../components/WorkingChatPage';
import ErrorBoundary from '../components/ErrorBoundary';

const TeacherDashboard = () => {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <Container fluid className="py-4">
        {/* Welcome Header */}
        <Row className="mb-4">
          <Col>
            <Card className="bg-success text-white">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="me-3" style={{ fontSize: '3rem' }}>👩‍🏫</div>
                  <div>
                    <h2 className="mb-1">Teacher Dashboard</h2>
                    <p className="mb-0">Welcome back, {user?.first_name || user?.username}!</p>
                    <small className="opacity-75">Manage your classes and connect with students</small>
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
                <div style={{ fontSize: '2rem' }}>🏫</div>
                <h6>My Classes</h6>
                <p className="small text-muted">Manage your class rooms</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <div style={{ fontSize: '2rem' }}>👥</div>
                <h6>Students</h6>
                <p className="small text-muted">View student activity</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <div style={{ fontSize: '2rem' }}>📝</div>
                <h6>Resources</h6>
                <p className="small text-muted">Share learning materials</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <div style={{ fontSize: '2rem' }}>📊</div>
                <h6>Analytics</h6>
                <p className="small text-muted">Track engagement</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Chat Rooms Section - Using Working Chat Component */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <div className="d-flex align-items-center">
                  <div className="me-2" style={{ fontSize: '1.5rem' }}>💬</div>
                  <h4 className="mb-0">Class Room Management</h4>
                </div>
              </Card.Header>
              <Card.Body>
                <Alert variant="success" className="mb-4">
                  <div className="d-flex align-items-center">
                    <div className="me-3" style={{ fontSize: '1.5rem' }}>🎯</div>
                    <div>
                      <strong>Teacher Features Available:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Create unlimited class rooms</li>
                        <li>Configure room settings (auto-approve, participant limits)</li>
                        <li>Manage student join requests</li>
                        <li>Monitor class discussions</li>
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

export default TeacherDashboard;