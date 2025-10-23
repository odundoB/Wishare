import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const WorkingChatPage = () => {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', auto_approve: true });
  
  // Fetch rooms function
  const fetchRooms = async () => {
    if (!user || !token) {
      console.log('No user or token, skipping fetch');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching rooms with token...');
      const response = await fetch('http://localhost:8000/api/chat/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const roomsList = data.results || data;
      
      console.log('Rooms fetched successfully:', roomsList.length);
      setRooms(Array.isArray(roomsList) ? roomsList : []);
      
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(`Failed to load rooms: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create room function
  const createRoom = async () => {
    if (!newRoom.name.trim()) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/chat/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRoom.name,
          description: newRoom.description,
          room_type: 'class',
          auto_approve: newRoom.auto_approve,
          max_participants: 50
        })
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewRoom({ name: '', description: '', auto_approve: true });
        await fetchRooms(); // Refresh rooms list
        alert('Room created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create room: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error creating room: ${err.message}`);
    }
  };

  // Join room function
  const joinRoom = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/${roomId}/join/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchRooms(); // Refresh rooms list
        alert('Join request sent successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to join room: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error joining room: ${err.message}`);
    }
  };

  // Load rooms when component mounts or user/token changes
  useEffect(() => {
    if (user && token) {
      console.log('User and token available, fetching rooms');
      fetchRooms();
    } else {
      console.log('No user or token, clearing rooms');
      setRooms([]);
      setLoading(false);
    }
  }, [user, token]);

  if (!user || !token) {
    return (
      <Container className="py-4">
        <Alert variant="warning" className="text-center">
          <h4>Please log in to access the chat system</h4>
          <p>You need to be logged in to view and join chat rooms.</p>
          <Button href="/login" variant="primary">Go to Login</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>💬 Chat Rooms</h2>
              <p className="text-muted">Welcome, {user.first_name || user.username}! ({user.role})</p>
            </div>
            {user.role === 'teacher' && (
              <Button 
                variant="success" 
                onClick={() => setShowCreateModal(true)}
                disabled={loading}
              >
                ➕ Create Room
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Status and Error Messages */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="outline-danger" size="sm" onClick={fetchRooms} className="ms-2">
            🔄 Retry
          </Button>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center mb-4">
          <Spinner animation="border" />
          <p>Loading rooms...</p>
        </div>
      )}

      {/* Room List */}
      {!loading && (
        <Row>
          {rooms.length > 0 ? (
            rooms.map(room => (
              <Col md={6} lg={4} key={room.id} className="mb-3">
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-between align-items-start">
                      <span>{room.name}</span>
                      <div>
                        <Badge bg={room.is_active ? 'success' : 'secondary'} className="me-1">
                          {room.is_active ? 'Active' : 'Closed'}
                        </Badge>
                        {room.auto_approve && (
                          <Badge bg="info">Auto Join</Badge>
                        )}
                      </div>
                    </Card.Title>
                    
                    <Card.Text>{room.description}</Card.Text>
                    
                    <div className="small text-muted mb-3">
                      <div><strong>Host:</strong> {room.host?.username}</div>
                      <div><strong>Participants:</strong> {room.participants?.length || 0}/{room.max_participants}</div>
                      <div><strong>Type:</strong> {room.room_type}</div>
                    </div>

                    <div className="d-grid">
                      {room.host?.id === user.id ? (
                        <Button variant="warning" size="sm">
                          👑 Your Room
                        </Button>
                      ) : room.participants?.some(p => p.id === user.id) ? (
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => setSelectedRoom(room)}
                        >
                          💬 Enter Chat
                        </Button>
                      ) : room.is_active ? (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => joinRoom(room.id)}
                        >
                          {room.auto_approve ? '⚡ Join Now' : '🙋‍♀️ Request Join'}
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" disabled>
                          ❌ Closed
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Alert variant="info" className="text-center">
                <h5>No rooms available</h5>
                <p>
                  {user.role === 'teacher' 
                    ? "Create your first room to get started!" 
                    : "No rooms are available yet. Ask your teacher to create some!"}
                </p>
              </Alert>
            </Col>
          )}
        </Row>
      )}

      {/* Create Room Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Room Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter room name"
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe the room purpose"
                value={newRoom.description}
                onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Allow students to join instantly (Auto-approve)"
                checked={newRoom.auto_approve}
                onChange={(e) => setNewRoom({...newRoom, auto_approve: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={createRoom}
            disabled={!newRoom.name.trim()}
          >
            Create Room
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Room Display */}
      {selectedRoom && (
        <Alert variant="success" className="mt-4">
          <h5>Selected Room: {selectedRoom.name}</h5>
          <p>Real-time chat interface would go here. Room ID: {selectedRoom.id}</p>
          <Button variant="outline-success" onClick={() => setSelectedRoom(null)}>
            Back to Rooms
          </Button>
        </Alert>
      )}
    </Container>
  );
};

export default WorkingChatPage;