import React, { useState } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import RoomList from '../components/RoomList';
import ChatRoom from '../components/ChatRoom';
import NotificationToast from '../components/NotificationToast';
import ErrorBoundary from '../components/ErrorBoundary';

const ChatPageContent = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const { setActiveRoom, notification, clearNotification, loading, error, rooms } = useChat();
  
  // Debug logging for Chat context
  console.log('🏠 ChatPageContent render - Chat state:', { 
    selectedRoom: selectedRoom?.name || 'None',
    loading, 
    error: error || 'None',
    roomsCount: rooms?.length || 0,
    roomsType: typeof rooms,
    timestamp: new Date().toLocaleTimeString()
  });

  const handleRoomSelect = async (room) => {
    setSelectedRoom(room);
    await setActiveRoom(room);
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
  };

  // Show loading for chat context only if no rooms are available yet
  if (loading && (!rooms || rooms.length === 0)) {
    console.log('🏠 ChatPageContent - Showing chat loading spinner');
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading chat rooms... (Debug: Chat loading = {String(loading)}, Rooms: {rooms?.length || 0})</p>
          <small>Timestamp: {new Date().toLocaleTimeString()}</small>
        </div>
      </Container>
    );
  }

  // Show error if there's a chat context error
  if (error) {
    console.log('🏠 ChatPageContent - Showing error:', error);
    return (
      <Container fluid className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Chat Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Please check your connection and try refreshing the page.
          </p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {selectedRoom ? (
            <ChatRoom 
              room={selectedRoom} 
              onBack={handleBackToRooms}
            />
          ) : (
            <RoomList onRoomSelect={handleRoomSelect} />
          )}
        </Col>
      </Row>
      
      {/* Notification Toast */}
      <NotificationToast
        message={notification?.message}
        type={notification?.type}
        show={!!notification}
        onClose={clearNotification}
      />
    </Container>
  );
};

const Chat = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('🔄 Chat component - Showing loading spinner');
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading chat... (Auth loading = {String(loading)})</p>
          <small>Timestamp: {new Date().toLocaleTimeString()}</small>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/chat" replace />;
  }

  // Show error if user data is not available
  if (!user) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <Container>
          <Alert variant="warning" className="text-center">
            <Alert.Heading>Authentication Error</Alert.Heading>
            <p>Unable to load user data. Please try logging in again.</p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ChatProvider>
        <div className="min-vh-100 bg-light">
          <Container>
            <div className="pt-4 pb-2">
              <h1 className="text-center mb-4">💬 Chat Rooms</h1>
              <p className="text-center text-muted">Welcome, {user.first_name || user.username}!</p>
            </div>
          </Container>
          <ChatPageContent />
        </div>
      </ChatProvider>
    </ErrorBoundary>
  );
};

export default Chat;