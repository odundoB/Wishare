import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { ChatProvider } from '../contexts/ChatContext';
import { AuthProvider } from '../contexts/AuthContext';
import RoomList from '../components/RoomList';

// Mock data that matches the backend structure
const mockRooms = [
  {
    id: 1,
    name: "Mock Test Room 1",
    description: "A test room for debugging",
    host: {
      id: 4,
      username: "teacher",
      email: "teacher@test.com",
      role: "teacher"
    },
    participants: [],
    room_type: "class",
    is_active: true,
    auto_approve: true,
    max_participants: 50
  },
  {
    id: 2,
    name: "Mock Test Room 2", 
    description: "Another test room",
    host: {
      id: 4,
      username: "teacher",
      email: "teacher@test.com",
      role: "teacher"
    },
    participants: [
      { id: 5, username: "student1" }
    ],
    room_type: "class",
    is_active: true,
    auto_approve: false,
    max_participants: 30
  }
];

const RoomListTest = () => {
  const [testMode, setTestMode] = React.useState('live');

  const MockChatProvider = ({ children }) => {
    const mockChatValue = {
      rooms: testMode === 'mock' ? mockRooms : [],
      loading: testMode === 'loading',
      error: testMode === 'error' ? 'Mock error for testing' : null,
      createRoom: () => Promise.resolve(),
      joinRoom: () => Promise.resolve(),
      fetchRooms: () => console.log('Mock fetchRooms called'),
      joinRequests: [],
      fetchMyJoinRequests: () => console.log('Mock fetchMyJoinRequests called'),
    };

    const ChatContext = React.createContext();
    return (
      <ChatContext.Provider value={mockChatValue}>
        {children}
      </ChatContext.Provider>
    );
  };

  return (
    <Container className="py-4">
      <h2>🧪 RoomList Component Test</h2>
      
      <Alert variant="info">
        <strong>Test Mode:</strong> {testMode}
        <div className="mt-2">
          <Button size="sm" variant="outline-primary" onClick={() => setTestMode('mock')} className="me-2">
            Mock Data
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={() => setTestMode('loading')} className="me-2">
            Loading State
          </Button>
          <Button size="sm" variant="outline-danger" onClick={() => setTestMode('error')} className="me-2">
            Error State
          </Button>
          <Button size="sm" variant="outline-success" onClick={() => setTestMode('live')}>
            Live Data
          </Button>
        </div>
      </Alert>

      {testMode === 'live' ? (
        <AuthProvider>
          <ChatProvider>
            <div className="border rounded p-3">
              <h5>Live RoomList Component:</h5>
              <RoomList onRoomSelect={(room) => console.log('Room selected:', room)} />
            </div>
          </ChatProvider>
        </AuthProvider>
      ) : (
        <AuthProvider>
          <MockChatProvider>
            <div className="border rounded p-3">
              <h5>Mock RoomList Component:</h5>
              <RoomList onRoomSelect={(room) => console.log('Room selected:', room)} />
            </div>
          </MockChatProvider>
        </AuthProvider>
      )}
    </Container>
  );
};

export default RoomListTest;