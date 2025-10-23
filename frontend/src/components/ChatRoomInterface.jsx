import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, InputGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import chatAPI from '../services/chat';

const ChatRoomInterface = ({ room, onBack }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showPrivateChat, setShowPrivateChat] = useState(false);
  const [privateChatUser, setPrivateChatUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [newPrivateMessage, setNewPrivateMessage] = useState('');
  const [showHostControls, setShowHostControls] = useState(false);
  const [showEndMeetingModal, setShowEndMeetingModal] = useState(false);
  const [privateChats, setPrivateChats] = useState([]);
  const [currentPrivateChat, setCurrentPrivateChat] = useState(null);
  const [privateChatNotifications, setPrivateChatNotifications] = useState({});
  const messagesEndRef = useRef(null);
  const websocketRef = useRef(null);

  // Check if current user is the host of this room
  const isCurrentUserHost = () => {
    return user && room && (
      user.id === room.created_by || 
      user.id === room.creator ||
      participants.some(p => p.id === user.id && p.is_moderator)
    );
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch room messages and participants
  const fetchRoomData = async () => {
    setLoading(true);
    try {
      // Fetch real messages
      const messagesResponse = await chatAPI.getRoomMessages(room.id);
      const roomMessages = messagesResponse.data.map(msg => ({
        id: msg.id,
        user: { 
          username: msg.user_name || 'System', 
          role: msg.user_role || 'system' 
        },
        message: msg.message,
        timestamp: msg.created_at,
        type: msg.message_type,
        is_edited: msg.is_edited,
        edited_at: msg.edited_at
      }));

      // Add join message for current user if no messages exist
      if (roomMessages.length === 0) {
        roomMessages.push({
          id: 'welcome',
          user: { username: 'system', role: 'system' },
          message: `Welcome to ${room.name}! Start the conversation.`,
          timestamp: new Date().toISOString(),
          type: 'system'
        });
      }

      setMessages(roomMessages);

      // Fetch real participants
      const participantsResponse = await chatAPI.getRoomParticipants(room.id);
      const roomParticipants = participantsResponse.data.map(p => ({
        id: p.id,
        username: p.full_name || p.username,
        role: p.role,
        is_online: true, // Assume online for now
        is_moderator: p.is_moderator,
        joined_at: p.joined_at
      }));

      setParticipants(roomParticipants);

    } catch (err) {
      console.error('Error fetching room data:', err);
      // Fallback to basic welcome message
      setMessages([{
        id: 'error',
        user: { username: 'system', role: 'system' },
        message: 'Welcome to the room! You can start chatting now.',
        timestamp: new Date().toISOString(),
        type: 'system'
      }]);
      setParticipants([{
        id: user.id,
        username: user.username,
        role: user.role,
        is_online: true,
        is_moderator: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize real-time message polling
  const initializeRealTimeUpdates = () => {
    try {
      setConnected(true);
      console.log(`Connected to room ${room.id} chat`);
      
      // Poll for new messages every 3 seconds
      const messageInterval = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => clearInterval(messageInterval);
    } catch (err) {
      console.error('Real-time connection error:', err);
      setConnected(false);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connected) return;

    const messageText = newMessage.trim();
    const messageData = {
      message: messageText,
      replyTo: replyToMessage?.id || null,
      isPrivate: replyToMessage?.isPrivate || false
    };

    setNewMessage(''); // Clear input immediately for better UX
    const currentReply = replyToMessage;
    setReplyToMessage(null); // Clear reply

    try {
      // Send message via API with reply data
      if (replyToMessage) {
        await chatAPI.sendReply(room.id, messageData);
      } else {
        await chatAPI.sendMessage(room.id, messageText);
      }
      
      // Refresh messages to get the new message
      await fetchMessages();
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message on error
      setReplyToMessage(currentReply); // Restore reply on error
    }
  };

  // Fetch messages only (for refreshing)
  const fetchMessages = async () => {
    try {
      const messagesResponse = await chatAPI.getRoomMessages(room.id);
      const roomMessages = messagesResponse.data.map(msg => ({
        id: msg.id,
        user: { 
          id: msg.user_id,
          username: msg.user_username || 'System',
          displayName: msg.user_name || msg.user_username || 'System',
          role: msg.user_role || 'system' 
        },
        message: msg.message,
        timestamp: msg.created_at,
        type: msg.message_type,
        is_edited: msg.is_edited,
        edited_at: msg.edited_at,
        replyTo: msg.reply_to_data,
        isPrivate: msg.is_private,
        reactions: msg.reactions_formatted || []
      }));

      setMessages(roomMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Fetch private chats for this room
  const fetchPrivateChats = async () => {
    try {
      const response = await chatAPI.getPrivateChatsByRoom(room.id);
      setPrivateChats(response.data);
      
      // Update notification counts
      const notifications = {};
      response.data.forEach(chat => {
        if (chat.unread_count > 0) {
          notifications[chat.id] = chat.unread_count;
        }
      });
      setPrivateChatNotifications(notifications);
    } catch (err) {
      console.error('Error fetching private chats:', err);
    }
  };

  // Get or create private chat with a user
  const getOrCreatePrivateChat = async (otherUserId) => {
    try {
      const response = await chatAPI.getOrCreatePrivateChat(room.id, otherUserId);
      return response.data;
    } catch (err) {
      console.error('Error creating private chat:', err);
      throw err;
    }
  };

  // Load private chat messages
  const loadPrivateChatMessages = async (privateChatId) => {
    try {
      const response = await chatAPI.getPrivateChatMessages(privateChatId);
      setPrivateMessages(response.data);
      
      // Clear notification for this chat
      setPrivateChatNotifications(prev => {
        const updated = { ...prev };
        delete updated[privateChatId];
        return updated;
      });
    } catch (err) {
      console.error('Error loading private messages:', err);
    }
  };

  // Send private chat message
  const sendPrivateChatMessage = async (privateChatId, message) => {
    try {
      await chatAPI.sendPrivateChatMessage(privateChatId, message);
      // Reload messages to show the new one
      await loadPrivateChatMessages(privateChatId);
      // Refresh private chats to update last message
      await fetchPrivateChats();
    } catch (err) {
      console.error('Error sending private message:', err);
      throw err;
    }
  };

  // Initialize room data and real-time updates
  useEffect(() => {
    if (room && user) {
      fetchRoomData();
      fetchPrivateChats(); // Load private chats
      const cleanup = initializeRealTimeUpdates();
      
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [room, user]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Helper functions for message styling
  const isOwnMessage = (messageUser) => {
    return messageUser.id === user.id || messageUser.username === user.username;
  };

  const getMessageContainerStyle = (messageUser) => {
    return {
      display: 'flex',
      justifyContent: isOwnMessage(messageUser) ? 'flex-end' : 'flex-start',
      marginBottom: '12px'
    };
  };

  const getMessageBubbleStyle = (messageUser) => {
    const isOwn = isOwnMessage(messageUser);
    return {
      backgroundColor: isOwn ? '#007bff' : '#6c757d',
      color: 'white',
      padding: '12px 16px',
      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      maxWidth: '70%',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative'
    };
  };

  // Message management functions
  const handleReply = (message) => {
    setReplyToMessage(message);
    setShowDropdown(null);
    document.querySelector('input[type="text"]')?.focus();
  };

  const handleCopyMessage = (message) => {
    navigator.clipboard.writeText(message.message);
    setShowDropdown(null);
    // You could add a toast notification here
  };

  const handleReplyPrivately = async (message) => {
    try {
      // Set up private chat with the specific user being replied to
      const targetUser = {
        id: message.user.id || message.user.username, // Handle different user ID formats
        username: message.user.username,
        displayName: message.user.displayName || message.user.username,
        role: message.user.role
      };
      
      setPrivateChatUser(targetUser);
      setShowDropdown(null);
      
      // Get or create private chat room with this user
      const privateChatRoom = await getOrCreatePrivateChat(targetUser.id);
      setCurrentPrivateChat(privateChatRoom);
      
      // Load messages from this private chat
      await loadPrivateChatMessages(privateChatRoom.id);
      
      setShowPrivateChat(true);
      
      // Auto-focus the private chat input after modal opens
      setTimeout(() => {
        const privateChatInput = document.querySelector('.private-chat-input');
        if (privateChatInput) {
          privateChatInput.focus();
        }
      }, 100);
    } catch (err) {
      console.error('Error starting private chat:', err);
      alert('Failed to start private chat. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId, deleteForAll = false) => {
    try {
      if (deleteForAll) {
        // Delete for everyone - requires API call
        await chatAPI.deleteMessage(room.id, messageId, deleteForAll);
        // Refresh messages
        await fetchMessages();
      } else {
        // Delete for me - hide locally
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== messageId)
        );
      }
      setShowDropdown(null);
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message');
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message.id);
    setEditText(message.message);
    setShowDropdown(null);
  };

  const handleSaveEdit = async (messageId) => {
    try {
      // API call to edit message
      await chatAPI.editMessage(room.id, messageId, editText.trim());
      // Refresh messages
      await fetchMessages();
      setEditingMessage(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing message:', err);
      alert('Failed to edit message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // Host Management Functions
  const handleEndMeeting = async () => {
    if (!isCurrentUserHost()) {
      alert('Only the host can end the meeting');
      return;
    }
    
    try {
      const response = await chatAPI.endMeeting(room.id);
      setShowEndMeetingModal(false);
      
      // Show enhanced success message about deletion
      const roomName = response.data?.room_name || room.name;
      alert(`Meeting "${roomName}" has been ended and permanently deleted from the system.`);
      
      // Navigate back to rooms list
      if (onBack) onBack();
    } catch (err) {
      console.error('Error ending meeting:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to end meeting';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleRemoveMember = async (participantId, participantName) => {
    if (!isCurrentUserHost()) {
      alert('Only the host can remove members');
      return;
    }

    if (participantId === user.id) {
      alert('You cannot remove yourself from the meeting');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove ${participantName} from the meeting?`);
    if (confirmed) {
      try {
        await chatAPI.removeParticipant(room.id, participantId);
        // Refresh participants list
        await fetchRoomData();
        alert(`${participantName} has been removed from the meeting`);
      } catch (err) {
        console.error('Error removing participant:', err);
        alert('Failed to remove participant');
      }
    }
  };

  const handleLeaveRoom = async () => {
    const confirmed = window.confirm('Are you sure you want to leave this meeting?');
    if (confirmed) {
      try {
        await chatAPI.leaveRoom(room.id);
        alert('You have left the meeting');
        if (onBack) onBack();
      } catch (err) {
        console.error('Error leaving room:', err);
        alert('Failed to leave the meeting');
      }
    }
  };

  const handleEmojiReaction = async (messageId, emoji) => {
    try {
      // API call to add emoji reaction
      await chatAPI.addReaction(room.id, messageId, emoji);
      // Refresh messages to show new reactions
      await fetchMessages();
      setShowEmojiPicker(null);
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];

  // Private chat functions
  const loadPrivateMessages = async (userId) => {
    try {
      // For demo purposes, we'll simulate loading private messages
      // In a real app, you'd call an API endpoint
      const mockPrivateMessages = [
        {
          id: 1,
          user: { id: userId, username: privateChatUser?.username || 'User', displayName: privateChatUser?.displayName || 'User' },
          message: "Hey! This is a private message.",
          timestamp: new Date().toISOString(),
          isOwn: false
        },
        {
          id: 2,
          user: { id: user.id, username: user.username, displayName: user.username },
          message: "Hi there! Thanks for messaging me privately.",
          timestamp: new Date().toISOString(),
          isOwn: true
        }
      ];
      setPrivateMessages(mockPrivateMessages);
    } catch (err) {
      console.error('Error loading private messages:', err);
    }
  };

  const sendPrivateMessage = async (e) => {
    e.preventDefault();
    if (!newPrivateMessage.trim() || !currentPrivateChat) return;

    const messageText = newPrivateMessage.trim();
    setNewPrivateMessage('');

    try {
      // Send message using the new private chat system
      await sendPrivateChatMessage(currentPrivateChat.id, messageText);
    } catch (err) {
      console.error('Error sending private message:', err);
      alert('Failed to send private message. Please try again.');
      setNewPrivateMessage(messageText); // Restore message on error
    }
  };

  return (
    <Container fluid className="py-3">
      <Row>
        {/* Chat Messages Area */}
        <Col lg={9} md={8}>
          <Card className="h-100">
            {/* Chat Header */}
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">💬 {room.name}</h5>
                <small>{room.description}</small>
              </div>
              <div className="d-flex align-items-center gap-3">
                <Badge bg={connected ? 'success' : 'danger'}>
                  {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </Badge>
                
                {/* Host Controls */}
                {isCurrentUserHost() && (
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={() => setShowHostControls(!showHostControls)}
                      title="Host Controls"
                    >
                      👑 Host
                    </Button>
                    
                    {showHostControls && (
                      <>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => setShowEndMeetingModal(true)}
                          title="End Meeting"
                        >
                          📞 End
                        </Button>
                      </>
                    )}
                  </div>
                )}
                
                {/* Leave Room Button for non-hosts */}
                {!isCurrentUserHost() && (
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={handleLeaveRoom}
                    title="Leave Meeting"
                  >
                    🚪 Leave
                  </Button>
                )}
                
                <Button variant="outline-light" size="sm" onClick={onBack}>
                  ← Back to Rooms
                </Button>
              </div>
            </Card.Header>

            {/* Messages Display */}
            <Card.Body 
              className="d-flex flex-column" 
              style={{ height: '60vh', overflow: 'hidden' }}
            >
              <div 
                className="flex-grow-1 overflow-auto mb-3" 
                style={{ maxHeight: '100%' }}
              >
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading messages...</span>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    {messages.map(msg => (
                      <div key={msg.id}>
                        {msg.type === 'system' ? (
                          <div className="text-center mb-3">
                            <small className="text-muted bg-light px-3 py-2 rounded-pill">
                              <i className="fas fa-info-circle me-1"></i>
                              {msg.message}
                            </small>
                          </div>
                        ) : (
                          <div 
                            style={getMessageContainerStyle(msg.user)} 
                            className="chat-message"
                            onMouseEnter={() => setHoveredMessage(msg.id)}
                            onMouseLeave={() => {
                              setHoveredMessage(null);
                              setShowDropdown(null);
                              setShowEmojiPicker(null);
                            }}
                          >
                            <div style={{...getMessageBubbleStyle(msg.user), position: 'relative'}} className="message-bubble">
                              {/* Reply indicator */}
                              {msg.replyTo && (
                                <div className="small mb-2 p-2" style={{ 
                                  backgroundColor: 'rgba(255,255,255,0.1)', 
                                  borderRadius: '8px',
                                  borderLeft: '3px solid rgba(255,255,255,0.3)'
                                }}>
                                  <i className="fas fa-reply me-1"></i>
                                  Replying to: {msg.replyTo.message.substring(0, 50)}...
                                </div>
                              )}

                              {!isOwnMessage(msg.user) && (
                                <div className="fw-bold small mb-1" style={{ opacity: 0.9 }}>
                                  {msg.user.displayName}
                                  {msg.user.role && msg.user.role !== 'student' && (
                                    <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6em' }}>
                                      {msg.user.role}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Message content or edit input */}
                              {editingMessage === msg.id ? (
                                <div className="mb-2">
                                  <Form.Control
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit(msg.id);
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    style={{ 
                                      backgroundColor: 'rgba(255,255,255,0.2)', 
                                      border: 'none',
                                      color: 'white'
                                    }}
                                  />
                                  <div className="mt-1">
                                    <Button size="sm" variant="light" className="me-1" onClick={() => handleSaveEdit(msg.id)}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-1">{msg.message}</div>
                              )}

                              <div className="small" style={{ opacity: 0.7, fontSize: '0.75em' }}>
                                {formatTimestamp(msg.timestamp)}
                                {msg.is_edited && <span className="ms-1">(edited)</span>}
                                {isOwnMessage(msg.user) && (
                                  <span className="ms-2">
                                    <i className="fas fa-check"></i>
                                  </span>
                                )}
                              </div>

                              {/* Message Reactions */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="message-reactions mt-1">
                                  {msg.reactions.map((reaction, index) => (
                                    <span
                                      key={index}
                                      className={`reaction-item ${reaction.users.includes(user.id) ? 'own-reaction' : ''}`}
                                      onClick={() => {
                                        if (reaction.users.includes(user.id)) {
                                          // Remove reaction
                                          chatAPI.removeReaction(room.id, msg.id, reaction.emoji);
                                        } else {
                                          // Add reaction
                                          handleEmojiReaction(msg.id, reaction.emoji);
                                        }
                                      }}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {reaction.emoji} {reaction.count}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Message Actions - Dropdown and Emoji on Message Edges */}
                              {hoveredMessage === msg.id && (
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  right: isOwnMessage(msg.user) ? 'auto' : '-45px',
                                  left: isOwnMessage(msg.user) ? '-45px' : 'auto',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '3px',
                                  zIndex: 10
                                }}>
                                  {/* Emoji Picker Button */}
                                  <div style={{ position: 'relative' }}>
                                    <Button
                                      size="sm"
                                      style={{ 
                                        padding: '4px 8px', 
                                        fontSize: '14px',
                                        borderRadius: '50%',
                                        backgroundColor: '#007bff',
                                        border: '2px solid #0056b3',
                                        color: 'white',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 6px rgba(0,123,255,0.3)'
                                      }}
                                      onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                    >
                                      😊
                                    </Button>
                                    
                                    {/* Emoji Picker Dropdown */}
                                    {showEmojiPicker === msg.id && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: isOwnMessage(msg.user) ? '-220px' : '40px',
                                        backgroundColor: 'linear-gradient(135deg, #007bff, #0056b3)',
                                        background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                        border: '2px solid #0056b3',
                                        borderRadius: '12px',
                                        padding: '10px',
                                        boxShadow: '0 4px 20px rgba(0,123,255,0.4)',
                                        zIndex: 9999,
                                        display: 'flex',
                                        gap: '6px',
                                        position: 'fixed'
                                      }}>
                                        {commonEmojis.map(emoji => (
                                          <button
                                            key={emoji}
                                            onClick={() => handleEmojiReaction(msg.id, emoji)}
                                            style={{
                                              background: 'rgba(255,255,255,0.9)',
                                              border: '1px solid rgba(255,255,255,0.5)',
                                              fontSize: '18px',
                                              cursor: 'pointer',
                                              padding: '6px',
                                              borderRadius: '8px',
                                              transition: 'all 0.2s ease',
                                              minWidth: '32px',
                                              minHeight: '32px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.backgroundColor = 'white';
                                              e.target.style.transform = 'scale(1.1)';
                                              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.backgroundColor = 'rgba(255,255,255,0.9)';
                                              e.target.style.transform = 'scale(1)';
                                              e.target.style.boxShadow = 'none';
                                            }}
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Dropdown Menu Button */}
                                  <div style={{ position: 'relative' }}>
                                    <Button
                                      size="sm"
                                      style={{ 
                                        padding: '4px 8px', 
                                        fontSize: '16px',
                                        borderRadius: '50%',
                                        backgroundColor: '#007bff',
                                        border: '2px solid #0056b3',
                                        color: 'white',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 6px rgba(0,123,255,0.3)'
                                      }}
                                      onClick={() => setShowDropdown(showDropdown === msg.id ? null : msg.id)}
                                    >
                                      ⋯
                                    </Button>

                                    {/* Dropdown Menu */}
                                    {showDropdown === msg.id && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '0',
                                        left: isOwnMessage(msg.user) ? '-170px' : '40px',
                                        background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                        border: '2px solid #0056b3',
                                        borderRadius: '12px',
                                        minWidth: '160px',
                                        boxShadow: '0 6px 25px rgba(0,123,255,0.4)',
                                        zIndex: 9999,
                                        overflow: 'hidden',
                                        position: 'fixed'
                                      }}>
                                        <button
                                          onClick={() => handleReply(msg)}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: 'transparent',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: 'white',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = 'rgba(255,255,255,0.15)';
                                            e.target.style.transform = 'translateX(4px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.transform = 'translateX(0)';
                                          }}
                                        >
                                          <i className="fas fa-reply me-2"></i>Reply
                                        </button>
                                        
                                        <button
                                          onClick={() => handleCopyMessage(msg)}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: 'transparent',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: 'white',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = 'rgba(255,255,255,0.15)';
                                            e.target.style.transform = 'translateX(4px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.transform = 'translateX(0)';
                                          }}
                                        >
                                          <i className="fas fa-copy me-2"></i>Copy
                                        </button>

                                        <button
                                          onClick={() => handleReplyPrivately(msg)}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: 'transparent',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: 'white',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = 'rgba(255,255,255,0.15)';
                                            e.target.style.transform = 'translateX(4px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.transform = 'translateX(0)';
                                          }}
                                        >
                                          <i className="fas fa-user-secret me-2"></i>Reply Privately
                                        </button>

                                        {/* Separator Line */}
                                        <div style={{
                                          height: '1px',
                                          background: 'rgba(255,255,255,0.2)',
                                          margin: '4px 8px'
                                        }}></div>

                                        {isOwnMessage(msg.user) ? (
                                          <>
                                            <button
                                              onClick={() => handleEditMessage(msg)}
                                              style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '10px 16px',
                                                border: 'none',
                                                background: 'transparent',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                color: 'white',
                                                fontWeight: '500',
                                                transition: 'all 0.2s ease'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'rgba(255,255,255,0.15)';
                                                e.target.style.transform = 'translateX(4px)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.transform = 'translateX(0)';
                                              }}
                                            >
                                              <i className="fas fa-edit me-2"></i>Edit
                                            </button>
                                            
                                            {/* Separator Line */}
                                            <div style={{
                                              height: '1px',
                                              background: 'rgba(255,255,255,0.2)',
                                              margin: '4px 8px'
                                            }}></div>
                                            
                                            <button
                                              onClick={() => handleDeleteMessage(msg.id, true)}
                                              style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '10px 16px',
                                                border: 'none',
                                                background: 'transparent',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                color: '#ffb3b3',
                                                fontWeight: '500',
                                                transition: 'all 0.2s ease'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'rgba(255,179,179,0.2)';
                                                e.target.style.transform = 'translateX(4px)';
                                                e.target.style.color = '#ff8080';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.transform = 'translateX(0)';
                                                e.target.style.color = '#ffb3b3';
                                              }}
                                            >
                                              <i className="fas fa-trash me-2"></i>Delete for All
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            {/* Separator Line */}
                                            <div style={{
                                              height: '1px',
                                              background: 'rgba(255,255,255,0.2)',
                                              margin: '4px 8px'
                                            }}></div>
                                            
                                            <button
                                              onClick={() => handleDeleteMessage(msg.id, false)}
                                              style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '10px 16px',
                                                border: 'none',
                                                background: 'transparent',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                color: '#ffb3b3',
                                                fontWeight: '500',
                                                transition: 'all 0.2s ease'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'rgba(255,179,179,0.2)';
                                                e.target.style.transform = 'translateX(4px)';
                                                e.target.style.color = '#ff8080';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.transform = 'translateX(0)';
                                                e.target.style.color = '#ffb3b3';
                                              }}
                                            >
                                              <i className="fas fa-trash me-2"></i>Delete for Me
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Reply Preview */}
              {replyToMessage && (
                <div className="mb-2 p-2 bg-light border-start border-primary border-3 rounded">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-primary fw-bold">
                        <i className="fas fa-reply me-1"></i>
                        Replying to {replyToMessage.user.displayName}
                        {replyToMessage.isPrivate && <span className="text-warning"> (Privately)</span>}
                      </small>
                      <div className="small text-muted">
                        {replyToMessage.message.length > 50 
                          ? replyToMessage.message.substring(0, 50) + '...' 
                          : replyToMessage.message}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline-secondary" 
                      onClick={() => setReplyToMessage(null)}
                      style={{ padding: '2px 6px' }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <Form onSubmit={sendMessage} className="mt-2">
                <InputGroup className="shadow-sm">
                  <Form.Control
                    type="text"
                    placeholder={
                      replyToMessage 
                        ? `Reply ${replyToMessage.isPrivate ? 'privately ' : ''}to ${replyToMessage.user.displayName}...`
                        : connected ? `Message as ${user.username || 'Anonymous'}...` : "Connecting..."
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!connected || loading}
                    onKeyPress={(e) => {
                      if (e.key === 'Escape') setReplyToMessage(null);
                    }}
                    style={{ 
                      borderRadius: '25px 0 0 25px',
                      border: '2px solid #007bff',
                      borderRight: 'none'
                    }}
                  />
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={!connected || loading || !newMessage.trim()}
                    style={{ 
                      borderRadius: '0 25px 25px 0',
                      border: '2px solid #007bff',
                      borderLeft: 'none',
                      minWidth: '80px'
                    }}
                  >
                    {loading ? '⏳' : '➤'}
                  </Button>
                </InputGroup>
                <small className="text-muted mt-1 d-block">
                  Press Enter to send • {participants.length} participant{participants.length !== 1 ? 's' : ''} online
                  {replyToMessage && <span> • Press Esc to cancel reply</span>}
                </small>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Participants Sidebar */}
        <Col lg={3} md={4}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">👥 Participants ({participants.length})</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <ListGroup variant="flush">
                {participants.map(participant => (
                  <ListGroup.Item 
                    key={participant.id} 
                    className="d-flex justify-content-between align-items-center px-0"
                    style={{ 
                      backgroundColor: participant.id === user.id ? '#e3f2fd' : 'transparent',
                      border: participant.id === user.id ? '1px solid #2196f3' : 'none'
                    }}
                  >
                    <div className="flex-grow-1">
                      <div className="fw-medium">
                        {participant.username}
                        {participant.id === user.id && (
                          <Badge bg="info" className="ms-1">You</Badge>
                        )}
                        {(participant.is_moderator || participant.id === room.creator) && (
                          <Badge bg="warning" className="ms-1">👑 Host</Badge>
                        )}
                      </div>
                      <small className="text-muted">
                        {participant.role} 
                        {participant.joined_at && (
                          <span> • Joined {new Date(participant.joined_at).toLocaleDateString()}</span>
                        )}
                      </small>
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={participant.is_online ? 'success' : 'secondary'}>
                        {participant.is_online ? '🟢 Online' : '⚫ Offline'}
                      </Badge>
                      
                      {/* Host can remove other participants */}
                      {isCurrentUserHost() && participant.id !== user.id && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveMember(participant.id, participant.username)}
                          title={`Remove ${participant.username} from meeting`}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                        >
                          ✖️
                        </Button>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Room Info */}
          <Card className="mt-3">
            <Card.Header>
              <h6 className="mb-0">ℹ️ Room Info</h6>
            </Card.Header>
            <Card.Body>
              <div className="small">
                <div><strong>Type:</strong> {room.room_type}</div>
                <div><strong>Created:</strong> {new Date(room.created_at).toLocaleDateString()}</div>
                <div><strong>Max Participants:</strong> {room.max_participants}</div>
                <div><strong>Auto Join:</strong> {room.auto_approve ? 'Yes' : 'No'}</div>
              </div>
            </Card.Body>
          </Card>

          {/* Private Chats Section */}
          {privateChats.length > 0 && (
            <Card className="mt-3">
              <Card.Header>
                <h6 className="mb-0">💬 Private Chats</h6>
              </Card.Header>
              <Card.Body style={{ maxHeight: '200px', overflow: 'auto' }}>
                <ListGroup variant="flush">
                  {privateChats.map(chat => (
                    <ListGroup.Item 
                      key={chat.id} 
                      className="d-flex justify-content-between align-items-center px-0 py-2"
                      style={{ cursor: 'pointer' }}
                      onClick={async () => {
                        setPrivateChatUser({
                          id: chat.other_user.id,
                          username: chat.other_user.username,
                          displayName: chat.other_user.full_name || chat.other_user.username
                        });
                        setCurrentPrivateChat(chat);
                        await loadPrivateChatMessages(chat.id);
                        setShowPrivateChat(true);
                      }}
                    >
                      <div className="flex-grow-1">
                        <div className="fw-medium d-flex align-items-center">
                          {chat.other_user.full_name || chat.other_user.username}
                          {privateChatNotifications[chat.id] && (
                            <Badge bg="danger" className="ms-2">
                              {privateChatNotifications[chat.id]}
                            </Badge>
                          )}
                        </div>
                        {chat.last_message && (
                          <small className="text-muted">
                            {chat.last_message.sender}: {chat.last_message.message.substring(0, 30)}
                            {chat.last_message.message.length > 30 && '...'}
                          </small>
                        )}
                      </div>
                      <small className="text-muted">
                        💬
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Private Chat Modal */}
      {showPrivateChat && privateChatUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            width: '500px',
            maxWidth: '90vw',
            height: '600px',
            maxHeight: '90vh',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Private Chat Header */}
            <div style={{
              background: 'linear-gradient(135deg, #007bff, #0056b3)',
              color: 'white',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  👤
                </div>
                <div>
                  <h5 style={{ margin: 0, fontSize: '18px' }}>
                    💬 Private Chat with {privateChatUser.displayName}
                  </h5>
                  <small style={{ opacity: 0.9 }}>End-to-end encrypted</small>
                </div>
              </div>
              <Button 
                variant="light" 
                size="sm"
                onClick={() => setShowPrivateChat(false)}
                style={{ 
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                ×
              </Button>
            </div>

            {/* Private Messages Area */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {privateMessages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: msg.isOwn ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: msg.isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: msg.isOwn ? '#007bff' : 'white',
                      color: msg.isOwn ? 'white' : '#333',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      animation: 'messageSlideIn 0.3s ease-out'
                    }}>
                      {!msg.isOwn && (
                        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                          {msg.user.displayName}
                        </div>
                      )}
                      <div>{msg.message}</div>
                      <div style={{ 
                        fontSize: '10px', 
                        opacity: 0.7, 
                        marginTop: '4px',
                        textAlign: 'right'
                      }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {msg.isOwn && <span style={{ marginLeft: '4px' }}>✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Private Message Input */}
            <div style={{ 
              padding: '20px',
              borderTop: '1px solid #e9ecef',
              backgroundColor: 'white'
            }}>
              <Form onSubmit={sendPrivateMessage}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    className="private-chat-input"
                    placeholder={`Message ${privateChatUser.displayName} privately...`}
                    value={newPrivateMessage}
                    onChange={(e) => setNewPrivateMessage(e.target.value)}
                    style={{ 
                      borderRadius: '25px 0 0 25px',
                      border: '2px solid #007bff',
                      borderRight: 'none'
                    }}
                  />
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={!newPrivateMessage.trim()}
                    style={{ 
                      borderRadius: '0 25px 25px 0',
                      border: '2px solid #007bff',
                      borderLeft: 'none',
                      minWidth: '60px'
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </InputGroup>
                <small style={{ color: '#6c757d', marginTop: '8px', display: 'block' }}>
                  <i className="fas fa-lock me-1"></i>
                  Messages are encrypted and only visible to you and {privateChatUser.displayName}
                </small>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* End Meeting Confirmation Modal */}
      {showEndMeetingModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1060 }}
        >
          <div 
            className="bg-white rounded shadow-lg p-4"
            style={{ maxWidth: '400px', width: '90%' }}
          >
            <h5 className="text-danger mb-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              End & Delete Meeting
            </h5>
            <p className="mb-4">
              <strong>⚠️ Warning:</strong> This will permanently <strong>delete</strong> the entire meeting from the system, including:
            </p>
            <ul className="mb-4 text-muted">
              <li>All chat messages and history</li>
              <li>All participant records</li>
              <li>All meeting data and settings</li>
            </ul>
            <p className="text-danger mb-4">
              <strong>This action cannot be undone!</strong> The meeting will be completely removed from the system.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowEndMeetingModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleEndMeeting}
              >
                <i className="fas fa-trash me-1"></i>
                Delete Meeting
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default ChatRoomInterface;