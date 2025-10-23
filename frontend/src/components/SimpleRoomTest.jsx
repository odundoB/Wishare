import React from 'react';
import { Container, Alert, Card } from 'react-bootstrap';

const SimpleRoomTest = () => {
  const [status, setStatus] = React.useState('Testing...');
  const [rooms, setRooms] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const testEverything = async () => {
      try {
        setStatus('Step 1: Testing login...');
        
        // Step 1: Login
        const loginResponse = await fetch('http://localhost:8000/api/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'teacher', password: 'testpass123' })
        });
        
        if (!loginResponse.ok) {
          throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        setStatus('Step 2: Login successful, fetching rooms...');
        
        // Step 2: Get rooms
        const roomsResponse = await fetch('http://localhost:8000/api/chat/', {
          headers: { 
            'Authorization': `Bearer ${loginData.access}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!roomsResponse.ok) {
          throw new Error(`Rooms fetch failed: ${roomsResponse.status}`);
        }
        
        const roomsData = await roomsResponse.json();
        const roomsList = roomsData.results || roomsData;
        
        setRooms(Array.isArray(roomsList) ? roomsList : []);
        setStatus(`Step 3: Success! Found ${roomsList.length} rooms`);
        
      } catch (err) {
        setError(err.message);
        setStatus('Failed');
      }
    };

    testEverything();
  }, []);

  return (
    <Container className="py-4">
      <h2>🧪 Simple Room Test</h2>
      
      <Alert variant={error ? 'danger' : 'info'}>
        <strong>Status:</strong> {status}
        {error && <><br /><strong>Error:</strong> {error}</>}
      </Alert>

      {rooms.length > 0 && (
        <div>
          <h4>✅ Found {rooms.length} Rooms:</h4>
          {rooms.slice(0, 3).map((room, index) => (
            <Card key={room.id || index} className="mb-2">
              <Card.Body>
                <Card.Title>{room.name || `Room ${index + 1}`}</Card.Title>
                <Card.Text>
                  Host: {room.host?.username || 'Unknown'} | 
                  Participants: {room.participants?.length || 0} |
                  Active: {room.is_active ? 'Yes' : 'No'}
                </Card.Text>
              </Card.Body>
            </Card>
          ))}
          
          <Alert variant="success" className="mt-3">
            🎉 <strong>Backend is working perfectly!</strong> 
            The issue is in the frontend context or component integration.
          </Alert>
        </div>
      )}
    </Container>
  );
};

export default SimpleRoomTest;