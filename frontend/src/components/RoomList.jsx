import React, { useState } from 'react';
import { Card, Button, Badge, Row, Col, Modal, Form, Alert } from 'react-bootstrap';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import './Chat.css';

const RoomList = ({ onRoomSelect }) => {
  const { rooms, loading, createRoom, joinRoom, fetchRooms, joinRequests, fetchMyJoinRequests } = useChat();
  const { user } = useAuth();
  
  // Debug logging
  console.log('🏠 RoomList render - State:', {
    roomsCount: rooms?.length || 0,
    roomsType: typeof rooms,
    roomsIsArray: Array.isArray(rooms),
    loading,
    user: user?.username,
    timestamp: new Date().toLocaleTimeString()
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '', 
    description: '', 
    room_type: 'class', // Default to class, will be updated based on user role
    max_participants: 50,
    auto_approve: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(null); // Track which room is being joined

  React.useEffect(() => {
    // ChatContext handles room fetching, RoomList only needs to fetch join requests
    if (user) {
      console.log('🔄 RoomList - Fetching join requests for user:', user.username);
      fetchMyJoinRequests();
    } else {
      console.log('⏳ RoomList - Waiting for user authentication...');
    }
  }, [fetchMyJoinRequests, user]);

  // Update room data defaults when user becomes available
  React.useEffect(() => {
    if (user && user.role === 'teacher') {
      setNewRoomData(prev => ({
        ...prev,
        room_type: 'class',
        max_participants: 50,
        auto_approve: false // Teachers choose whether to auto-approve
      }));
    }
  }, [user]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!newRoomData.name.trim()) {
      console.error('Room name is required');
      return;
    }
    
    // Validate user is available
    if (!user) {
      console.error('User not available for room creation');
      return;
    }
    
    setIsCreating(true);
    try {
      // Prepare room data with proper validation
      const roomData = {
        name: newRoomData.name.trim(),
        description: newRoomData.description.trim(),
        room_type: newRoomData.room_type || 'class',
        max_participants: Number(newRoomData.max_participants) || 50,
        auto_approve: Boolean(newRoomData.auto_approve)
      };

      console.log('Creating room with data:', roomData);
      
      const createdRoom = await createRoom(roomData);
      
      // Reset form and close modal
      setShowCreateModal(false);
      setNewRoomData({ 
        name: '', 
        description: '', 
        room_type: 'class',
        max_participants: 50,
        auto_approve: false
      });
      
      // Auto-refresh rooms list to show the new room
      await fetchRooms();
      
    } catch (error) {
      console.error('Failed to create room:', error);
      // Additional error logging
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    setJoiningRoom(roomId); // Set loading state for this specific room
    try {
      const result = await joinRoom(roomId);
      
      // Refresh join requests to show updated status
      fetchMyJoinRequests();
      
      // If auto-joined, automatically enter the room
      if (result.autoJoined && result.room) {
        onRoomSelect(result.room);
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      
      // The error notification is already handled by ChatContext.joinRoom()
      // but let's log additional details for debugging
      if (error.response?.data) {
        console.error('Join room error details:', error.response.data);
      }
    } finally {
      setJoiningRoom(null); // Clear loading state
    }
  };

  const isParticipant = (room) => {
    if (!user?.id) return false;
    return room.participants.some(p => p.id === user.id) || room.host.id === user.id;
  };

  const canJoinRoom = (room) => {
    if (!user?.id) return false;
    if (isParticipant(room)) return false;
    if (!room.is_active) return false;
    // If there's already a pending request, show different state
    return true;
  };

  const hasPendingRequest = (room) => {
    if (!user?.id || !joinRequests) return false;
    return joinRequests.some(request => 
      request.room === room.id && request.status === 'pending'
    );
  };

  const getRoomStatus = (room) => {
    if (!user?.id) return 'none';
    if (room.host.id === user.id) return 'host';
    if (room.participants.some(p => p.id === user.id)) return 'participant';
    if (hasPendingRequest(room)) return 'pending';
    return 'none';
  };

  const getJoinButtonText = (room) => {
    const status = getRoomStatus(room);
    if (status === 'host') return 'Manage Room';
    if (status === 'participant') return 'Enter Room';
    if (status === 'pending') return 'Request Pending ⏳';
    return room.auto_approve ? 'Join Now' : 'Request to Join';
  };

  const getJoinButtonVariant = (room) => {
    const status = getRoomStatus(room);
    if (status === 'host') return 'warning';
    if (status === 'participant') return 'success';
    if (status === 'pending') return 'secondary';
    return room.auto_approve ? 'primary' : 'outline-primary';
  };

  if (loading) {
    return <div className="text-center">Loading rooms...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>💬 Chat Rooms</h4>
        {/* Only teachers can create rooms */}
        {user?.role === 'teacher' && (
          <Button 
            variant="success" 
            onClick={() => setShowCreateModal(true)}
            className="btn-create-room"
          >
            ➕ Create Class Room
          </Button>
        )}
      </div>

      {/* Role-specific Instructions */}
      {user?.role === 'teacher' && Array.isArray(rooms) && rooms.length > 0 && (
        <div className="alert alert-success mb-4 d-flex align-items-center">
          <div className="me-3" style={{ fontSize: '1.5rem' }}>👩‍🏫</div>
          <div>
            <strong>Manage Your Classes!</strong>
            <div className="small">Create new class rooms using the button above, or manage existing rooms you're hosting. Students can request to join your classes.</div>
          </div>
        </div>
      )}

      {user?.role === 'student' && Array.isArray(rooms) && rooms.length > 0 && (
        <div className="alert alert-info mb-4 d-flex align-items-center">
          <div className="me-3" style={{ fontSize: '1.5rem' }}>🎓</div>
          <div>
            <strong>Join Class Discussions!</strong>
            <div className="small">Browse available class rooms below and click "Join Now" or "Request to Join" to participate in discussions with your teachers and classmates.</div>
          </div>
        </div>
      )}

      <Row>
        {Array.isArray(rooms) && rooms.length > 0 ? rooms.map(room => (
          <Col md={6} lg={4} key={room.id} className="mb-3">
            <Card className="room-card h-100">
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  <span className="d-flex align-items-center gap-2">
                    <span>{room.name}</span>
                    {!isParticipant(room) && canJoinRoom(room) && (
                      <small className="text-muted">
                        <i className="fas fa-arrow-right"></i> Can Join
                      </small>
                    )}
                  </span>
                  <div className="d-flex gap-1">
                    {/* Room Type Badge */}
                    <Badge 
                      bg={room.room_type === 'class' ? 'primary' : 
                          room.room_type === 'study_group' ? 'info' :
                          room.room_type === 'project' ? 'warning' : 'secondary'}
                      className="text-uppercase"
                    >
                      {room.room_type === 'study_group' ? 'Study' : room.room_type}
                    </Badge>
                    {/* Auto Join Badge */}
                    {room.auto_approve && !isParticipant(room) && (
                      <Badge bg="success" title="You can join this room instantly" className="pulse">
                        ⚡ Instant Join
                      </Badge>
                    )}
                    {/* Active Status Badge */}
                    {room.is_active ? (
                      <Badge bg="success">🟢 Active</Badge>
                    ) : (
                      <Badge bg="secondary">🔴 Closed</Badge>
                    )}
                  </div>
                </Card.Title>
                
                <Card.Text>{room.description}</Card.Text>
                
                <div className="small text-muted mb-2">
                  <div>Host: {room.host.username}</div>
                  <div>Participants: {room.participants.length}</div>
                </div>

                <div className="d-flex gap-2 align-items-center">
                  {isParticipant(room) ? (
                    <Button 
                      variant={getJoinButtonVariant(room)}
                      size="sm"
                      onClick={() => onRoomSelect(room)}
                      className="flex-grow-1"
                    >
                      {getJoinButtonText(room)}
                    </Button>
                  ) : canJoinRoom(room) ? (
                    <Button 
                      variant={getJoinButtonVariant(room)}
                      size="sm"
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={joiningRoom === room.id || hasPendingRequest(room)}
                      className="flex-grow-1 fw-bold"
                      style={{ 
                        fontSize: '0.85rem',
                        boxShadow: room.auto_approve ? '0 2px 8px rgba(0,123,255,0.3)' : 'none'
                      }}
                    >
                      {joiningRoom === room.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Joining...
                        </>
                      ) : (
                        <>🚪 {getJoinButtonText(room)}</>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      disabled
                      className="flex-grow-1"
                    >
                      {room.is_active ? '🔒 Not Available' : '❌ Room Closed'}
                    </Button>
                  )}
                  
                  {room.host.id === user.id && (
                    <Badge bg="info" className="align-self-center">
                      Host
                    </Badge>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        )) : (
          <Col xs={12}>
            <div className="text-center text-muted py-5">
              {Array.isArray(rooms) ? (
                <div>
                  <h5>📭 No chat rooms available</h5>
                  <div>
                    {user?.role === 'teacher' ? (
                      <>
                        <p>Create your first class room and start connecting with students!</p>
                        <Button 
                          variant="success" 
                          onClick={() => setShowCreateModal(true)}
                          size="lg"
                        >
                          ➕ Create Your First Class Room
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>No class rooms are available yet.</p>
                        <p>Ask your teacher to create a class room for discussions!</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p>Loading chat rooms...</p>
                </div>
              )}
            </div>
          </Col>
        )}
      </Row>

      {Array.isArray(rooms) && rooms.length === 0 && (
        <div className="text-center text-muted">
          <p>No chat rooms available.</p>
          {user?.role === 'teacher' ? (
            <p>Create the first class room to get started!</p>
          ) : (
            <p>Wait for your teacher to create class rooms!</p>
          )}
        </div>
      )}

      {/* Create Room Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            ✨ Create New Class Room
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateRoom}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Room Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder={`Enter ${user?.role === 'teacher' ? 'class room' : 'study group'} name`}
                value={newRoomData.name}
                onChange={(e) => setNewRoomData({
                  ...newRoomData,
                  name: e.target.value
                })}
                required
                maxLength={100}
                disabled={isCreating}
              />
              <Form.Text className="text-muted">
                Choose a clear, descriptive name for your {user?.role === 'teacher' ? 'class room' : 'study group'}
              </Form.Text>
            </Form.Group>
            
            {/* Room Type Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Room Type</Form.Label>
              <Form.Select
                value={newRoomData.room_type}
                onChange={(e) => setNewRoomData({
                  ...newRoomData,
                  room_type: e.target.value
                })}
                disabled={isCreating}
              >
                <option value="class">Class Room</option>
                <option value="discussion">Discussion Room</option>
                <option value="project">Project Room</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Select the type of room you're creating
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Describe the purpose of this class room (optional)"
                value={newRoomData.description}
                onChange={(e) => setNewRoomData({
                  ...newRoomData,
                  description: e.target.value
                })}
                maxLength={500}
                disabled={isCreating}
              />
              <Form.Text className="text-muted">
                Optional: Add details about what this room is for
              </Form.Text>
            </Form.Group>
            
            {/* Max Participants */}
            <Form.Group className="mb-3">
              <Form.Label>
                Maximum Participants (Currently: {newRoomData.max_participants})
              </Form.Label>
              <Form.Range
                min={5}
                max={100}
                value={newRoomData.max_participants}
                onChange={(e) => setNewRoomData({
                  ...newRoomData,
                  max_participants: parseInt(e.target.value)
                })}
                disabled={isCreating}
              />
              <Form.Text className="text-muted">
                Set the maximum number of students who can join this class room
              </Form.Text>
            </Form.Group>

            {/* Auto-approve setting */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="auto-approve"
                label="⚡ Quick Join - Allow students to join instantly"
                checked={newRoomData.auto_approve || false}
                onChange={(e) => setNewRoomData({
                  ...newRoomData,
                  auto_approve: e.target.checked
                })}
                disabled={isCreating}
              />
              <Form.Text className="text-muted">
                When enabled, students can join immediately without waiting for approval. 
                When disabled, you'll need to manually approve each join request.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isCreating || !newRoomData.name.trim()}
            >
              {isCreating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                <>🚀 Create Class Room</>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomList;