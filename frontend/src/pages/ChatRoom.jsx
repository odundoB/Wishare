    import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import ChatRoomInterface from '../components/ChatRoomInterface';
import chatAPI from '../services/chat';

const ChatRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchRoomData();
  }, [roomId, user, navigate]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      // First try to get the room details
      const response = await chatAPI.getRooms();
      const rooms = response.data;
      const targetRoom = rooms.find(r => r.id.toString() === roomId);
      
      if (!targetRoom) {
        setError('Room not found or you do not have access to this room.');
        return;
      }

      setRoom(targetRoom);
    } catch (err) {
      console.error('Error fetching room:', err);
      setError('Failed to load room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to chat page or dashboard
    if (user.role === 'teacher') {
      navigate('/teacher-dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  if (!user) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Please log in to access chat rooms.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2">Loading chat room...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-outline-danger"
              onClick={handleBack}
            >
              Go Back
            </button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          <Alert.Heading>Room Not Found</Alert.Heading>
          <p>The requested chat room could not be found or you don't have permission to access it.</p>
          <hr />
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-outline-warning"
              onClick={handleBack}
            >
              Go Back
            </button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <ChatRoomInterface 
      room={room} 
      onBack={handleBack}
    />
  );
};

export default ChatRoomPage;