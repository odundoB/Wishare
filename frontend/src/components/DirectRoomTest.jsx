import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import chatAPI from '../services/chat';

const DirectRoomTest = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const testLogin = async () => {
      try {
        // Login first
        const loginResponse = await fetch('http://localhost:8000/api/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'teacher', password: 'testpass123' })
        });
        
        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
          setToken(loginData.access);
          
          // Fetch rooms directly
          const roomsResponse = await fetch('http://localhost:8000/api/chat/', {
            headers: { 'Authorization': `Bearer ${loginData.access}` }
          });
          
          const roomsData = await roomsResponse.json();
          if (roomsResponse.ok) {
            setRooms(roomsData.results || roomsData);
            setError(null);
          } else {
            setError(`API Error: ${roomsData.detail || 'Failed to fetch rooms'}`);
          }
        } else {
          setError(`Login failed: ${loginData.detail || 'Authentication error'}`);
        }
      } catch (err) {
        setError(`Network error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    testLogin();
  }, []);

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p>Testing direct API connection...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2>🔬 Direct Room API Test</h2>
      
      {error && (
        <Alert variant="danger">
          <strong>Error:</strong> {error}
        </Alert>
      )}
      
      <Alert variant="info">
        <strong>Test Results:</strong>
        <ul className="mb-0">
          <li>Token: {token ? 'Present' : 'Missing'}</li>
          <li>Rooms fetched: {rooms.length}</li>
          <li>Data type: {typeof rooms}</li>
          <li>Is array: {Array.isArray(rooms) ? 'Yes' : 'No'}</li>
        </ul>
      </Alert>

      {Array.isArray(rooms) && rooms.length > 0 ? (
        <div>
          <h4>Found {rooms.length} Rooms:</h4>
          {rooms.slice(0, 3).map(room => (
            <Card key={room.id} className="mb-3">
              <Card.Body>
                <Card.Title className="d-flex justify-content-between">
                  {room.name}
                  <div>
                    <Badge bg={room.is_active ? 'success' : 'secondary'} className="me-1">
                      {room.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge bg="primary">{room.room_type}</Badge>
                  </div>
                </Card.Title>
                <Card.Text>{room.description}</Card.Text>
                <div className="small text-muted">
                  <p><strong>Host:</strong> {room.host?.username || 'Unknown'}</p>
                  <p><strong>Participants:</strong> {room.participants?.length || 0}</p>
                  <p><strong>Auto Approve:</strong> {room.auto_approve ? 'Yes' : 'No'}</p>
                  <p><strong>Max Participants:</strong> {room.max_participants}</p>
                </div>
              </Card.Body>
            </Card>
          ))}
          
          {rooms.length > 3 && (
            <Alert variant="success">
              <strong>✅ Success!</strong> {rooms.length - 3} more rooms available. 
              The API is working correctly!
            </Alert>
          )}
        </div>
      ) : (
        <Alert variant="warning">
          No rooms found or data format issue.
        </Alert>
      )}
      
      <Card className="mt-4">
        <Card.Header>Raw API Response Sample</Card.Header>
        <Card.Body>
          <pre className="small" style={{ maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(rooms[0] || 'No data', null, 2)}
          </pre>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DirectRoomTest;