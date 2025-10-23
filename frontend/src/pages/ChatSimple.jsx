import React, { useState, useEffect } from 'react';
import { Container, Alert, Spinner, Button } from 'react-bootstrap';

const ChatSimple = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Simple token check
    const storedToken = localStorage.getItem('access_token');
    console.log('🔍 ChatSimple - Token found:', !!storedToken);
    
    if (storedToken) {
      setToken(storedToken);
      fetchRoomsDirectly(storedToken);
    } else {
      setLoading(false);
      setError('No authentication token found. Please login first.');
    }
  }, []);

  const fetchRoomsDirectly = async (authToken) => {
    try {
      console.log('📡 ChatSimple - Fetching rooms directly...');
      
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 ChatSimple - Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ ChatSimple - Rooms loaded:', data);
        setRooms(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        console.error('❌ ChatSimple - API error:', errorData);
        setError(`Failed to load rooms: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ ChatSimple - Network error:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.open('/quick_login.html', '_blank');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading chat rooms...</p>
          <small>Simple loading check - {new Date().toLocaleTimeString()}</small>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Chat Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={handleLogin}>
              Go to Login
            </Button>
            <Button variant="outline-secondary" onClick={handleRefresh}>
              Refresh
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1>Chat Rooms (Simple Version)</h1>
      <p>Token: {token ? 'Present' : 'Missing'}</p>
      <p>Rooms found: {rooms.length}</p>
      
      {rooms.length === 0 ? (
        <Alert variant="info">
          <p>No chat rooms available.</p>
        </Alert>
      ) : (
        <div>
          <h3>Available Rooms:</h3>
          {rooms.map((room, index) => (
            <div key={room.id || index} className="border p-3 mb-2 rounded">
              <h5>{room.name || 'Unnamed Room'}</h5>
              <p>Host: {room.host?.username || 'Unknown'}</p>
              <p>Participants: {room.participants?.length || 0}</p>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
};

export default ChatSimple;