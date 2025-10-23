import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, ListGroup, Badge, Alert, Row, Col } from 'react-bootstrap';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import JoinRequestManager from './JoinRequestManager';
import ParticipantManager from './ParticipantManager';
import './Chat.css';

const ChatRoom = ({ room, onBack }) => {
  const { messages, sendMessage, connected, error } = useChat();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && connected) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message) => {
    if (message.message_type === 'system') {
      return (
        <div key={message.id} className="system-message">
          <Badge bg="secondary" className="px-2 py-1">
            ℹ️ {message.content}
          </Badge>
        </div>
      );
    }

    const isOwnMessage = message.sender?.id === user.id;
    const isHost = message.sender?.id === room.host.id;
    
    return (
      <div 
        key={message.id} 
        className={`chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`}
      >
        <div className="message-bubble">
          {!isOwnMessage && (
            <div className="small fw-bold mb-1 d-flex align-items-center">
              {isHost && <span className="me-1">👑</span>}
              {message.sender?.username}
              <Badge 
                bg={message.sender?.role === 'teacher' ? 'success' : 'primary'} 
                size="sm" 
                className="ms-2"
              >
                {message.sender?.role}
              </Badge>
            </div>
          )}
          <div className="message-content">{message.content}</div>
          <div className="message-timestamp">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <Button variant="outline-secondary" size="sm" onClick={onBack} className="me-2">
              ← Back
            </Button>
            <strong>{room.name}</strong>
            <Badge 
              bg={connected ? 'success' : 'danger'} 
              className="ms-2 connection-indicator"
            >
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
          </div>
          <div className="text-muted small">
            {room.participants.length + 1} participants
          </div>
        </Card.Header>
        <Card.Body className="py-2">
          <div className="small text-muted">
            <strong>Host:</strong> {room.host.username} | 
            <strong> Description:</strong> {room.description || 'No description'}
          </div>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Messages */}
      <Card style={{ height: '500px' }}>
        <Card.Body 
          className="chat-message-container"
        >
          {messages.length === 0 ? (
            <div className="text-center text-muted mt-5">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card.Body>

        {/* Message Input */}
        <Card.Footer className="chat-input-container">
          <Form onSubmit={handleSendMessage}>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder={connected ? "Type your message..." : "Connecting..."}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={!connected}
              />
              <Button 
                type="submit" 
                variant="primary"
                disabled={!connected || !messageInput.trim()}
              >
                Send
              </Button>
            </div>
          </Form>
        </Card.Footer>
      </Card>

      {/* Management Panels */}
      <Row className="mt-3">
        <Col md={6}>
          <ParticipantManager room={room} />
        </Col>
        <Col md={6}>
          <JoinRequestManager room={room} />
        </Col>
      </Row>
    </div>
  );
};

export default ChatRoom;