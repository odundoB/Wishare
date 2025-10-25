import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import ChatRoomInterface from './ChatRoomInterface';
import chatAPI from '../services/chat';

const WorkingChatPage = () => {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', auto_approve: true });
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [notification, setNotification] = useState(null);
  
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
      console.log('Fetching rooms with chatAPI...');
      const response = await chatAPI.getRooms();
      
      const data = response.data;
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
      const response = await fetch('http://localhost:8000/api/notifications/rooms/', {
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

  // Fetch pending requests for a room
  const fetchPendingRequests = async (roomId) => {
    setRequestsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/rooms/${roomId}/pending_requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data);
      } else {
        console.error('Failed to fetch pending requests');
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Approve join request
  const approveRequest = async (roomId, requestId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/rooms/${roomId}/approve_request/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId })
      });
      
      if (response.ok) {
        alert('Request approved successfully! The user can now join the chat.');
        await fetchPendingRequests(roomId); // Refresh requests
        await fetchRooms(); // Refresh rooms to update participant count
      } else {
        const errorData = await response.json();
        alert(`Failed to approve request: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error approving request: ${err.message}`);
    }
  };

  // Deny join request
  const denyRequest = async (roomId, requestId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/rooms/${roomId}/deny_request/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request_id: requestId })
      });
      
      if (response.ok) {
        alert('Request denied.');
        await fetchPendingRequests(roomId); // Refresh requests
      } else {
        const errorData = await response.json();
        alert(`Failed to deny request: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error denying request: ${err.message}`);
    }
  };

  // Join room function
  const joinRoom = async (roomId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/notifications/rooms/${roomId}/join/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchRooms(); // Refresh rooms list
        const room = rooms.find(r => r.id === roomId);
        
        if (room?.auto_approve) {
          // Auto-approved, redirect to chat
          setActiveChatRoom(room);
          alert('Welcome to the room! You can now start chatting.');
        } else {
          // Manual approval needed
          alert('Join request sent successfully! You will be notified when approved.');
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to join room: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error joining room: ${err.message}`);
    }
  };

  // Fetch all pending requests count for teacher's rooms
  const fetchAllPendingRequestsCount = async () => {
    if (user?.role !== 'teacher') return;
    
    const teacherRooms = rooms.filter(room => room.creator === user.id);
    let totalPending = 0;
    
    for (const room of teacherRooms) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/notifications/rooms/${room.id}/pending_requests/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          totalPending += data.length;
        }
      } catch (err) {
        console.error('Error fetching requests for room:', room.id, err);
      }
    }
    
    return totalPending;
  };

  // Check for notifications (for approved join requests)
  const checkNotifications = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/notifications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const chatNotifications = data.results?.filter(notif => 
          notif.notification_type === 'chat' && 
          !notif.is_read &&
          notif.data?.action_type === 'request_approved'
        ) || [];
        
        if (chatNotifications.length > 0) {
          const approval = chatNotifications[0];
          const roomId = approval.data?.room_id;
          const roomName = approval.data?.room_name;
          
          if (roomId && roomName) {
            // Mark notification as read
            await fetch(`http://127.0.0.1:8000/api/notifications/${approval.id}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ is_read: true })
            });
            
            // Show approval message and offer to enter room
            const enterRoom = window.confirm(`Great! Your request to join "${roomName}" has been approved. Would you like to enter the room now?`);
            if (enterRoom) {
              await fetchRooms(); // Refresh rooms first
              const room = rooms.find(r => r.id === roomId);
              if (room) {
                setActiveChatRoom(room);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking notifications:', err);
    }
  };

  // Load rooms when component mounts or user/token changes
  useEffect(() => {
    if (user && token) {
      console.log('User and token available, fetching rooms');
      fetchRooms();
      
      // Check for notifications every 10 seconds
      const notificationInterval = setInterval(checkNotifications, 10000);
      
      return () => clearInterval(notificationInterval);
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

  // Show chat interface if a room is active
  if (activeChatRoom) {
    return (
      <ChatRoomInterface 
        room={activeChatRoom} 
        onBack={() => setActiveChatRoom(null)}
      />
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
              <div className="d-flex gap-2">
                <Button 
                  variant="success" 
                  onClick={() => setShowCreateModal(true)}
                  disabled={loading}
                >
                  ➕ Create Room
                </Button>
                <Button 
                  variant="info" 
                  onClick={() => setShowRequestsModal(true)}
                  disabled={loading}
                >
                  📋 View Requests
                </Button>
              </div>
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
                        {room.creator === user.id && !room.auto_approve && (
                          <Badge bg="warning" className="ms-1">Manual Approval</Badge>
                        )}
                      </div>
                    </Card.Title>
                    
                    <Card.Text>{room.description}</Card.Text>
                    
                    <div className="small text-muted mb-3">
                      <div><strong>Creator:</strong> {room.creator_name}</div>
                      <div><strong>Participants:</strong> {room.participant_count || 0}/{room.max_participants}</div>
                      <div><strong>Type:</strong> {room.room_type}</div>
                    </div>

                    <div className="d-grid gap-2">
                      {room.creator === user.id ? (
                        <>
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => setActiveChatRoom(room)}
                          >
                            � Enter Your Room
                          </Button>
                          <Badge bg="warning" className="text-center">👑 You're the Host</Badge>
                        </>
                      ) : room.is_participant ? (
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => setActiveChatRoom(room)}
                        >
                          💬 Enter Chat
                        </Button>
                      ) : room.has_pending_request ? (
                        <Button variant="warning" size="sm" disabled>
                          ⏳ Request Pending
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

      {/* Join Requests Modal */}
      <Modal show={showRequestsModal} onHide={() => setShowRequestsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📋 Pending Join Requests</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <p className="text-muted">
              Manage join requests for your rooms. Students who want to join will appear here.
            </p>
          </div>

          {requestsLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading requests...</span>
            </div>
          ) : (
            <Row>
              {/* List rooms created by teacher */}
              {rooms
                .filter(room => room.creator === user.id)
                .map(room => (
                  <Col md={12} key={room.id} className="mb-3">
                    <Card>
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">🏠 {room.name}</h6>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => fetchPendingRequests(room.id)}
                        >
                          🔄 Refresh
                        </Button>
                      </Card.Header>
                      <Card.Body>
                        <div id={`requests-${room.id}`}>
                          {pendingRequests
                            .filter(req => rooms.find(r => r.id === room.id))
                            .length === 0 ? (
                            <small className="text-muted">No pending requests for this room</small>
                          ) : (
                            pendingRequests.map(request => (
                              <div key={request.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                                <div>
                                  <strong>{request.user_name}</strong> 
                                  <Badge bg="secondary" className="ms-2">{request.user_role}</Badge>
                                  {request.message && (
                                    <div>
                                      <small className="text-muted">Message: "{request.message}"</small>
                                    </div>
                                  )}
                                  <small className="text-muted d-block">
                                    Requested: {new Date(request.created_at).toLocaleString()}
                                  </small>
                                </div>
                                <div className="d-flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="success"
                                    onClick={() => approveRequest(room.id, request.id)}
                                  >
                                    ✅ Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline-danger"
                                    onClick={() => denyRequest(room.id, request.id)}
                                  >
                                    ❌ Deny
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              
              {rooms.filter(room => room.creator === user.id).length === 0 && (
                <Col md={12}>
                  <Alert variant="info">
                    You haven't created any rooms yet. Create a room to start receiving join requests!
                  </Alert>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequestsModal(false)}>
            Close
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

      {/* Toast Notification */}
      {notification && (
        <div 
          className="position-fixed top-0 end-0 m-3" 
          style={{ zIndex: 9999 }}
        >
          <Alert 
            variant={notification.type || 'info'} 
            dismissible 
            onClose={() => setNotification(null)}
          >
            <strong>{notification.title}</strong>
            {notification.message && <div>{notification.message}</div>}
          </Alert>
        </div>
      )}
    </Container>
  );
};

export default WorkingChatPage;