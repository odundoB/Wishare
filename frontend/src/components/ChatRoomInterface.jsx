import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, InputGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import chatAPI from '../services/chat';

// Maximum recording duration in seconds (3 minutes)
const MAX_RECORDING_DURATION = 180;

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
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isPrivateRecording, setIsPrivateRecording] = useState(false);
  const [showPrivateAttachments, setShowPrivateAttachments] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordedPrivateAudio, setRecordedPrivateAudio] = useState(null);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [showPrivateVoicePreview, setShowPrivateVoicePreview] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [privateRecordingDuration, setPrivateRecordingDuration] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedPrivateFiles, setSelectedPrivateFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [privateUploading, setPrivateUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const websocketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const privateMediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const privateRecordingTimerRef = useRef(null);
  const audioPreviewRef = useRef(null);
  const privateAudioPreviewRef = useRef(null);
  const fileInputRef = useRef(null);
  const privateFileInputRef = useRef(null);

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
          id: msg.user_id,
          username: msg.user_username || `User-${msg.user_id}`,
          displayName: msg.user_name || msg.user_username || `User-${msg.user_id}` || 'System',
          role: msg.user_role || 'system' 
        },
        message: msg.message,
        timestamp: msg.created_at,
        type: msg.message_type,
        message_type: msg.message_type,
        audio_file: msg.audio_file,
        duration: msg.duration,
        is_edited: msg.is_edited,
        edited_at: msg.edited_at,
        replyTo: msg.reply_to_data,
        isPrivate: msg.is_private,
        reactions: msg.reactions_formatted || []
      }));

      // Add join message for current user if no messages exist
      if (roomMessages.length === 0) {
        roomMessages.push({
          id: 'welcome',
          user: { 
            id: 'system',
            username: 'System',
            displayName: 'System',
            role: 'system' 
          },
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
        user: { 
          id: 'system',
          username: 'System',
          displayName: 'System',
          role: 'system' 
        },
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

  // Handle file upload for public chat
  // Test function to verify upload API
  const testFileUpload = async () => {
    const testFile = new Blob(['This is a test file content'], { type: 'text/plain' });
    testFile.name = 'test.txt';
    
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('file_type', 'document');
    
    try {
      const response = await chatAPI.sendFileMessage(room.id, formData);
      alert('Test upload successful!');
    } catch (error) {
      console.error('Test upload failed:', error);
      alert(`Test upload failed: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) {
      return;
    }
    
    // Check if user and room are available
    if (!user) {
      alert('Error: User not authenticated');
      return;
    }
    
    if (!room || !room.id) {
      alert('Error: Room not available');
      return;
    }
    
    // Check authentication token
    const token = localStorage.getItem('access_token');
    console.log('Access token available:', !!token);
    console.log('Token starts with:', token ? token.substring(0, 20) + '...' : 'N/A');
    
    setUploading(true);
    
    try {
      for (const fileItem of selectedFiles) {
        console.log('=== PROCESSING FILE ===');
        console.log('File item:', fileItem);
        console.log('File object:', fileItem.file);
        console.log('File name:', fileItem.file.name);
        console.log('File size:', fileItem.file.size);
        console.log('File type (frontend):', fileItem.type);
        
        const formData = new FormData();
        formData.append('file', fileItem.file);  // Backend expects 'file'
        const fileTypeForBackend = fileItem.type === 'media' ? 'media' : 'document';
        formData.append('file_type', fileTypeForBackend);
        
        console.log('=== FORMDATA CONTENTS ===');
        console.log('File type for backend:', fileTypeForBackend);
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value);
        }
        
        console.log('=== API CALL ===');
        console.log('Room ID:', room.id);
        console.log('Calling chatAPI.sendFileMessage...');
        
        const response = await chatAPI.sendFileMessage(room.id, formData);
        console.log('=== SUCCESS ===');
        console.log('Upload response:', response);
        console.log('Response data:', response.data);
      }
      
      // Clear selected files and refresh messages
      setSelectedFiles([]);
      console.log('Refreshing messages...');
      await fetchMessages();
      console.log('=== UPLOAD COMPLETE ===');
      
    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      alert(`Failed to upload files: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle file upload for private chat
  const handlePrivateUploadFiles = async () => {
    if (selectedPrivateFiles.length === 0 || !selectedPrivateChat) return;
    
    console.log('Starting private file upload. Selected files:', selectedPrivateFiles);
    setPrivateUploading(true);
    
    try {
      for (const fileItem of selectedPrivateFiles) {
        console.log('Processing private file item:', fileItem);
        const formData = new FormData();
        formData.append('file', fileItem.file);  // Backend expects 'file'
        const fileTypeForBackend = fileItem.type === 'media' ? 'media' : 'document';
        formData.append('file_type', fileTypeForBackend);
        
        console.log('Sending private FormData with file_type:', fileTypeForBackend);
        console.log('Private chat ID:', selectedPrivateChat.id);
        
        const response = await chatAPI.sendPrivateFileMessage(selectedPrivateChat.id, formData);
        console.log('Private upload response:', response);
      }
      
      // Clear selected files and refresh private messages
      setSelectedPrivateFiles([]);
      await loadPrivateChatMessages(selectedPrivateChat.id);
      console.log('Private files uploaded successfully and messages refreshed');
      
    } catch (error) {
      console.error('Error uploading private files:', error);
      console.error('Error response:', error.response);
      alert(`Failed to upload private files: ${error.response?.data?.detail || error.message}`);
    } finally {
      setPrivateUploading(false);
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
          username: msg.user_username || `User-${msg.user_id}`,
          displayName: msg.user_name || msg.user_username || `User-${msg.user_id}` || 'System',
          role: msg.user_role || 'system' 
        },
        message: msg.message,
        timestamp: msg.created_at,
        type: msg.message_type,
        message_type: msg.message_type,
        audio_file: msg.audio_file,
        duration: msg.duration,
        file_attachment: msg.file_attachment,
        file_type: msg.file_type,
        file_size: msg.file_size,
        original_filename: msg.original_filename,
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
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      throw err;
    }
  };

  // Load private chat messages
  const loadPrivateChatMessages = async (privateChatId) => {
    try {
      const response = await chatAPI.getPrivateChatMessages(privateChatId);
      
      // Transform backend data to match frontend expectations
      const transformedMessages = response.data.map(msg => ({
        id: msg.id,
        message: msg.message,
        timestamp: msg.created_at,
        message_type: msg.message_type,
        audio_file: msg.audio_file,
        duration: msg.duration,
        file_attachment: msg.file_attachment,
        file_type: msg.file_type,
        file_size: msg.file_size,
        original_filename: msg.original_filename,
        user: {
          id: msg.sender_id,
          username: msg.sender_username,
          displayName: msg.sender_name || msg.sender_username
        },
        isOwn: msg.sender_id === user.id,
        is_read: msg.is_read,
        edited_at: msg.edited_at,
        is_edited: msg.is_edited
      }));
      
      // Preserve any temporary/optimistic messages that are still sending
      setPrivateMessages(prevMessages => {
        const tempMessages = prevMessages.filter(msg => 
          msg.id.toString().startsWith('temp-') && msg.is_sending
        );
        return [...transformedMessages, ...tempMessages];
      });
      
      // Clear notification for this chat
      setPrivateChatNotifications(prev => {
        const updated = { ...prev };
        delete updated[privateChatId];
        return updated;
      });
    } catch (err) {
      console.error('Error loading private messages:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  // Send private chat message
  const sendPrivateChatMessage = async (privateChatId, message) => {
    try {
      // Optimistic update - add message immediately to UI
      const optimisticMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        message: message,
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          username: user.username,
          displayName: user.full_name || user.username
        },
        isOwn: true,
        is_read: false,
        is_sending: true // Flag to show as sending
      };
      
      setPrivateMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      const response = await chatAPI.sendPrivateChatMessage(privateChatId, message);
      
      // Replace optimistic message with real message from server
      await loadPrivateChatMessages(privateChatId);
      
      // Refresh private chats to update last message
      await fetchPrivateChats();
    } catch (err) {
      console.error('Error sending private message:', err);
      console.error('Error details:', err.response?.data);
      
      // Remove the optimistic message on failure
      setPrivateMessages(prevMessages => 
        prevMessages.filter(msg => !msg.id.toString().startsWith('temp-'))
      );
      
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

  // Polling for private chat messages when modal is open
  useEffect(() => {
    let privateChatInterval;
    
    if (showPrivateChat && currentPrivateChat) {
      // Poll for new private messages every 1 second for real-time feel
      privateChatInterval = setInterval(() => {
        loadPrivateChatMessages(currentPrivateChat.id);
      }, 1000);
    }
    
    return () => {
      if (privateChatInterval) {
        clearInterval(privateChatInterval);
      }
    };
  }, [showPrivateChat, currentPrivateChat]);

  // Cleanup audio URLs when component unmounts or audio changes
  useEffect(() => {
    return () => {
      // Cleanup main chat recorded audio
      if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
      }
      // Cleanup private chat recorded audio
      if (recordedPrivateAudio?.url) {
        URL.revokeObjectURL(recordedPrivateAudio.url);
      }
      // Clear recording timers
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (privateRecordingTimerRef.current) {
        clearInterval(privateRecordingTimerRef.current);
      }
    };
  }, [recordedAudio, recordedPrivateAudio]);

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
    
    // Auto-focus the edit input after it renders
    setTimeout(() => {
      const editInput = document.querySelector(`input[data-editing-id="${message.id}"]`);
      if (editInput) {
        editInput.focus();
        editInput.select(); // Select all text for easy editing
      }
    }, 100);
  };

  const handleSaveEdit = async (messageId) => {
    const trimmedText = editText.trim();
    
    if (!trimmedText) {
      alert('Message cannot be empty');
      return;
    }
    
    if (trimmedText === messages.find(m => m.id === messageId)?.message) {
      // No changes made, just cancel edit
      handleCancelEdit();
      return;
    }

    try {
      // API call to edit message
      await chatAPI.editMessage(room.id, messageId, trimmedText);
      // Refresh messages
      await fetchMessages();
      setEditingMessage(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing message:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to edit message';
      alert(`Error: ${errorMsg}`);
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
      setLoading(true);
      const response = await chatAPI.endMeeting(room.id);
      setShowEndMeetingModal(false);
      
      // Show success message about deletion
      const roomName = response.data?.room_name || room.name;
      alert(`Meeting "${roomName}" has been ended and permanently deleted.\n\nAll participants have been notified.`);
      
      // Clear all room data
      setMessages([]);
      setParticipants([]);
      setPrivateChats([]);
      setPrivateMessages([]);
      setPrivateChatNotifications({});
      
      // Navigate back to dashboard/rooms list
      if (onBack) {
        onBack();
      } else {
        // Fallback: redirect to dashboard based on user role
        if (user.role === 'teacher') {
          window.location.href = '/teacher-dashboard';
        } else {
          window.location.href = '/student-dashboard';
        }
      }
    } catch (err) {
      console.error('Error ending meeting:', err);
      setShowEndMeetingModal(false);
      const errorMsg = err.response?.data?.detail || 'Failed to end meeting';
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
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

  // Voice recording functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio({ blob: audioBlob, url: audioUrl });
        setShowVoicePreview(true);
        stream.getTracks().forEach(track => track.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop recording when reaching maximum duration
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopVoiceRecording(true);
            return MAX_RECORDING_DURATION;
          }
          return newDuration;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error starting voice recording:', err);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = (autoStopped = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (autoStopped) {
        setTimeout(() => {
          alert('Recording automatically stopped after reaching maximum duration of 3 minutes.');
        }, 100);
      }
    }
  };

  const startPrivateVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      privateMediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedPrivateAudio({ blob: audioBlob, url: audioUrl });
        setShowPrivateVoicePreview(true);
        stream.getTracks().forEach(track => track.stop());
        if (privateRecordingTimerRef.current) {
          clearInterval(privateRecordingTimerRef.current);
        }
      };
      
      mediaRecorder.start();
      setIsPrivateRecording(true);
      setPrivateRecordingDuration(0);
      
      // Start duration timer
      privateRecordingTimerRef.current = setInterval(() => {
        setPrivateRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop recording when reaching maximum duration
          if (newDuration >= MAX_RECORDING_DURATION) {
            stopPrivateVoiceRecording(true);
            return MAX_RECORDING_DURATION;
          }
          return newDuration;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error starting private voice recording:', err);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopPrivateVoiceRecording = (autoStopped = false) => {
    if (privateMediaRecorderRef.current && privateMediaRecorderRef.current.state === 'recording') {
      privateMediaRecorderRef.current.stop();
      setIsPrivateRecording(false);
      
      if (autoStopped) {
        setTimeout(() => {
          alert('Recording automatically stopped after reaching maximum duration of 3 minutes.');
        }, 100);
      }
    }
  };

  const handleVoiceMessage = async (audioBlob) => {
    try {
      setLoading(true);
      await chatAPI.sendVoiceMessage(room.id, audioBlob, recordingDuration);
      
      // Add optimistic update for better UX
      const optimisticMessage = {
        id: `temp-voice-${Date.now()}`,
        user: { 
          id: user.id,
          username: user.username,
          displayName: user.get_full_name || user.username,
          role: user.role || 'student'
        },
        message: `Voice message (${formatDuration(recordingDuration)})`,
        timestamp: new Date().toISOString(),
        type: 'voice',
        message_type: 'voice',
        audio_file: URL.createObjectURL(audioBlob),
        duration: recordingDuration,
        is_edited: false,
        reactions: []
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      scrollToBottom();
      
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to send voice message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateVoiceMessage = async (audioBlob) => {
    try {
      setLoading(true);
      await chatAPI.sendPrivateVoiceMessage(currentPrivateChat.id, audioBlob, privateRecordingDuration);
      
      // Add optimistic update for private chat
      const optimisticMessage = {
        id: `temp-private-voice-${Date.now()}`,
        message: `Voice message (${formatDuration(privateRecordingDuration)})`,
        timestamp: new Date().toISOString(),
        message_type: 'voice',
        audio_file: URL.createObjectURL(audioBlob),
        duration: privateRecordingDuration,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.get_full_name || user.username
        },
        isOwn: true,
        is_read: false,
        is_edited: false
      };
      
      setPrivateMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
    } catch (error) {
      console.error('Error sending private voice message:', error);
      alert('Failed to send private voice message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmVoiceMessage = () => {
    if (recordedAudio) {
      handleVoiceMessage(recordedAudio.blob);
      deleteVoiceRecording();
    }
  };

  const confirmPrivateVoiceMessage = () => {
    if (recordedPrivateAudio) {
      handlePrivateVoiceMessage(recordedPrivateAudio.blob);
      deletePrivateVoiceRecording();
    }
  };

  const deleteVoiceRecording = () => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
    setShowVoicePreview(false);
    setRecordingDuration(0);
  };

  const deletePrivateVoiceRecording = () => {
    if (recordedPrivateAudio?.url) {
      URL.revokeObjectURL(recordedPrivateAudio.url);
    }
    setRecordedPrivateAudio(null);
    setShowPrivateVoicePreview(false);
    setPrivateRecordingDuration(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAudioUrl = (audioFile) => {
    if (!audioFile) return null;
    // If it's already a full URL (blob or http), return as is
    if (audioFile.startsWith('blob:') || audioFile.startsWith('http')) {
      return audioFile;
    }
    // If it's a relative URL, construct full URL with backend base
    return `http://127.0.0.1:8000${audioFile}`;
  };

  const handleAttachment = () => {
    setShowAttachments(!showAttachments);
  };

  const handlePrivateAttachment = () => {
    setShowPrivateAttachments(!showPrivateAttachments);
  };

  const handleMediaFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*,video/*";
      fileInputRef.current.setAttribute('data-type', 'media');
      fileInputRef.current.click();
    }
    setShowAttachments(false);
  };

  const handleDocumentFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar";
      fileInputRef.current.setAttribute('data-type', 'document');
      fileInputRef.current.click();
    }
    setShowAttachments(false);
  };

  const handlePrivateMediaFiles = () => {
    if (privateFileInputRef.current) {
      privateFileInputRef.current.accept = "image/*,video/*";
      privateFileInputRef.current.setAttribute('data-type', 'media');
      privateFileInputRef.current.click();
    }
    setShowPrivateAttachments(false);
  };

  const handlePrivateDocumentFiles = () => {
    if (privateFileInputRef.current) {
      privateFileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar";
      privateFileInputRef.current.setAttribute('data-type', 'document');
      privateFileInputRef.current.click();
    }
    setShowPrivateAttachments(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const fileType = e.target.getAttribute('data-type') || 'document';
    
    if (files.length > 0) {
      const fileItems = files.map(file => ({ file, type: fileType }));
      setSelectedFiles(prev => [...prev, ...fileItems]);
    }
    e.target.value = ''; // Reset input
  };

  const handlePrivateFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const fileType = e.target.getAttribute('data-type') || 'document';
    
    if (files.length > 0) {
      const fileItems = files.map(file => ({ file, type: fileType }));
      setSelectedPrivateFiles(prev => [...prev, ...fileItems]);
    }
    e.target.value = ''; // Reset input
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removePrivateFile = (index) => {
    setSelectedPrivateFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Private chat functions - using real API calls
  const sendPrivateMessage = async (e) => {
    e.preventDefault();
    if (!newPrivateMessage.trim() || !currentPrivateChat) return;

    const messageText = newPrivateMessage.trim();

    try {
      // Send message using the new private chat system
      await sendPrivateChatMessage(currentPrivateChat.id, messageText);
      // Only clear input if message was sent successfully
      setNewPrivateMessage('');
    } catch (err) {
      console.error('Error sending private message:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Show more detailed error message
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to send private message. Please try again.';
      alert(`Private message failed: ${errorMessage}`);
      // Don't clear the input field so user can retry
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSaveEdit(msg.id);
                                      }
                                      if (e.key === 'Escape') {
                                        e.preventDefault();
                                        handleCancelEdit();
                                      }
                                    }}
                                    data-editing-id={msg.id}
                                    placeholder="Edit your message..."
                                    style={{ 
                                      backgroundColor: 'rgba(255,255,255,0.95)', 
                                      border: '2px solid #007bff',
                                      color: '#333',
                                      borderRadius: '8px',
                                      padding: '8px 12px'
                                    }}
                                  />
                                  <div className="mt-2 d-flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="success" 
                                      onClick={() => handleSaveEdit(msg.id)}
                                      style={{
                                        borderRadius: '6px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      <i className="fas fa-check me-1"></i>Save
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline-light" 
                                      onClick={handleCancelEdit}
                                      style={{
                                        borderRadius: '6px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      <i className="fas fa-times me-1"></i>Cancel
                                    </Button>
                                  </div>
                                  <div className="small text-light mt-1" style={{ opacity: 0.8 }}>
                                    <i className="fas fa-info-circle me-1"></i>
                                    Press Enter to save, Escape to cancel
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-1">
                                  {msg.message_type === 'voice' ? (
                                    <div className="voice-message-bubble">
                                      <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className="fas fa-microphone text-primary"></i>
                                        <span className="fw-bold">Voice Message</span>
                                        {msg.duration && (
                                          <span className="text-muted">({formatDuration(msg.duration)})</span>
                                        )}
                                      </div>
                                      {msg.audio_file ? (
                                        <audio 
                                          controls 
                                          src={getAudioUrl(msg.audio_file)}
                                          className="w-100"
                                          style={{ 
                                            height: '35px', 
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                          }}
                                          preload="metadata"
                                          onError={() => console.error('Audio playback error for:', getAudioUrl(msg.audio_file))}
                                        />
                                      ) : (
                                        <div className="text-muted small">
                                          <i className="fas fa-exclamation-triangle me-1"></i>
                                          Audio file not available
                                        </div>
                                      )}
                                    </div>
                                  ) : msg.message_type === 'file' ? (
                                    <div className="file-message-bubble">
                                      <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className={`fas ${
                                          msg.file_type === 'media' 
                                            ? (msg.original_filename && (msg.original_filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? 'fa-image' : 'fa-video'))
                                            : 'fa-file'
                                        } text-info`}></i>
                                        <span className="fw-bold">
                                          {msg.file_type === 'media' 
                                            ? (msg.original_filename && msg.original_filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? 'Photo' : 'Video')
                                            : 'Document'
                                          }
                                        </span>
                                        {msg.file_size && (
                                          <span className="text-muted">({formatFileSize(msg.file_size)})</span>
                                        )}
                                      </div>
                                      {msg.file_attachment ? (
                                        <div className="file-attachment">
                                          {msg.file_type === 'media' && msg.original_filename && msg.original_filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                                            <img 
                                              src={`http://127.0.0.1:8000${msg.file_attachment}`}
                                              alt={msg.original_filename || 'Uploaded image'}
                                              className="img-fluid rounded"
                                              style={{ maxHeight: '200px', maxWidth: '100%' }}
                                            />
                                          ) : msg.file_type === 'media' ? (
                                            <video 
                                              controls 
                                              className="w-100 rounded"
                                              style={{ maxHeight: '200px' }}
                                            >
                                              <source src={`http://127.0.0.1:8000${msg.file_attachment}`} />
                                              Your browser does not support the video tag.
                                            </video>
                                          ) : (
                                            <a 
                                              href={`http://127.0.0.1:8000${msg.file_attachment}`}
                                              download={msg.original_filename}
                                              className="btn btn-outline-light btn-sm"
                                            >
                                              <i className="fas fa-download me-2"></i>
                                              {msg.original_filename || 'Download File'}
                                            </a>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-muted small">
                                          <i className="fas fa-exclamation-triangle me-1"></i>
                                          File not available
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    msg.message
                                  )}
                                </div>
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

                                        {isOwnMessage(msg.user) && msg.type !== 'system' && msg.user.id !== 'system' ? (
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
                  {/* Attachment Button */}
                  <Button 
                    variant="outline-primary"
                    onClick={handleAttachment}
                    disabled={!connected}
                    style={{ 
                      borderRadius: '25px 0 0 25px',
                      border: '2px solid #007bff',
                      borderRight: 'none',
                      minWidth: '50px'
                    }}
                    title="Attach files"
                  >
                    <i className="fas fa-paperclip"></i>
                  </Button>
                  
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
                      border: '2px solid #007bff',
                      borderLeft: 'none',
                      borderRight: 'none'
                    }}
                  />
                  
                  {/* Microphone/Send Button Toggle */}
                  {newMessage.trim() ? (
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={!connected || loading}
                      style={{ 
                        borderRadius: '0 25px 25px 0',
                        border: '2px solid #007bff',
                        borderLeft: 'none',
                        minWidth: '50px'
                      }}
                      title="Send message"
                    >
                      {loading ? '⏳' : <i className="fas fa-paper-plane"></i>}
                    </Button>
                  ) : (
                    <Button 
                      variant={isRecording ? "danger" : "outline-primary"}
                      onMouseDown={startVoiceRecording}
                      onMouseUp={stopVoiceRecording}
                      onMouseLeave={stopVoiceRecording}
                      onTouchStart={startVoiceRecording}
                      onTouchEnd={stopVoiceRecording}
                      disabled={!connected}
                      style={{ 
                        borderRadius: '0 25px 25px 0',
                        border: '2px solid #007bff',
                        borderLeft: 'none',
                        minWidth: '50px',
                        backgroundColor: isRecording ? '#dc3545' : undefined,
                        transform: isRecording ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                      title={isRecording ? "Recording... Release to stop" : `Hold to record voice message (max ${MAX_RECORDING_DURATION / 60} minutes)`}
                    >
                      <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </Button>
                  )}
                </InputGroup>
                <small className="text-muted mt-1 d-block">
                  {isRecording ? (
                    <span className={recordingDuration >= MAX_RECORDING_DURATION - 30 ? "text-warning" : "text-danger"}>
                      <i className={`fas fa-circle me-1 ${recordingDuration >= MAX_RECORDING_DURATION - 30 ? "text-warning" : "text-danger"}`} style={{ fontSize: '8px' }}></i>
                      Recording voice message... {formatDuration(recordingDuration)} / {formatDuration(MAX_RECORDING_DURATION)} • Release to stop
                      {recordingDuration >= MAX_RECORDING_DURATION - 30 && (
                        <span className="text-warning ms-2">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Approaching maximum duration
                        </span>
                      )}
                    </span>
                  ) : (
                    <>
                      Press Enter to send • {participants.length} participant{participants.length !== 1 ? 's' : ''} online
                      {replyToMessage && <span> • Press Esc to cancel reply</span>}
                    </>
                  )}
                </small>
              </Form>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {/* Attachment Dropdown */}
              {showAttachments && (
                <div className="mt-2">
                  <Card className="shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex gap-3">
                        <Button
                          variant="outline-primary"
                          className="flex-fill d-flex align-items-center justify-content-center gap-2 py-3"
                          onClick={handleMediaFiles}
                        >
                          <i className="fas fa-images fs-3"></i>
                          <div className="text-start">
                            <div className="fw-bold">Photos & Videos</div>
                            <small className="text-muted">Share images and videos</small>
                          </div>
                        </Button>
                        <Button
                          variant="outline-secondary"
                          className="flex-fill d-flex align-items-center justify-content-center gap-2 py-3"
                          onClick={handleDocumentFiles}
                        >
                          <i className="fas fa-file-alt fs-3"></i>
                          <div className="text-start">
                            <div className="fw-bold">Documents</div>
                            <small className="text-muted">Share files and documents</small>
                          </div>
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-2">
                  <Card className="shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center py-2">
                      <span className="fw-bold text-primary">
                        <i className="fas fa-paperclip me-2"></i>
                        Selected Files ({selectedFiles.length})
                      </span>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setSelectedFiles([])}
                      >
                        Clear All
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-2">
                      <div className="d-flex flex-column gap-2">
                        {selectedFiles.map((fileItem, index) => (
                          <div key={index} className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                            <div className="d-flex align-items-center gap-2">
                              <i className={`fas ${fileItem.type === 'media' ? 'fa-image' : 'fa-file'} text-primary`}></i>
                              <div>
                                <div className="small fw-bold">{fileItem.file.name}</div>
                                <small className="text-muted">{formatFileSize(fileItem.file.size)}</small>
                              </div>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="d-flex gap-2 mt-3">
                        <Button
                          variant="success"
                          onClick={handleUploadFiles}
                          disabled={uploading || selectedFiles.length === 0}
                          className="flex-grow-1"
                        >
                          {uploading ? (
                            <>
                              <i className="fas fa-spinner fa-spin me-2"></i>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload me-2"></i>
                              Send Files
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => setSelectedFiles([])}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Voice Recording Preview */}
              {showVoicePreview && recordedAudio && (
                <div className="mt-3 p-3 border rounded bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="mb-0 text-primary">
                      <i className="fas fa-microphone me-2"></i>
                      Voice Message ({formatDuration(recordingDuration)})
                    </h6>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={deleteVoiceRecording}
                      title="Cancel recording"
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                  
                  {/* Duration Progress Bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Duration: {formatDuration(recordingDuration)}</span>
                      <span>Max: {formatDuration(MAX_RECORDING_DURATION)}</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className={`progress-bar ${recordingDuration >= MAX_RECORDING_DURATION - 30 ? 'bg-warning' : 'bg-primary'}`}
                        style={{ 
                          width: `${(recordingDuration / MAX_RECORDING_DURATION) * 100}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <audio 
                    ref={audioPreviewRef}
                    controls 
                    src={recordedAudio.url}
                    className="w-100 mb-3"
                    style={{ height: '40px' }}
                  />
                  
                  <div className="d-flex gap-2">
                    <Button
                      variant="danger"
                      onClick={deleteVoiceRecording}
                      className="flex-grow-1"
                    >
                      <i className="fas fa-trash me-2"></i>
                      Delete
                    </Button>
                    <Button
                      variant="success"
                      onClick={confirmVoiceMessage}
                      className="flex-grow-1"
                    >
                      <i className="fas fa-paper-plane me-2"></i>
                      Send Voice Message
                    </Button>
                  </div>
                </div>
              )}

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
                      <div>
                        {msg.message_type === 'voice' ? (
                          <div className="voice-message-bubble">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <i className="fas fa-microphone" style={{ color: msg.isOwn ? 'rgba(255,255,255,0.8)' : '#007bff' }}></i>
                              <span style={{ fontWeight: '600' }}>Voice Message</span>
                              {msg.duration && (
                                <span style={{ opacity: 0.8 }}>({formatDuration(msg.duration)})</span>
                              )}
                            </div>
                            {msg.audio_file ? (
                              <audio 
                                controls 
                                src={getAudioUrl(msg.audio_file)}
                                style={{ 
                                  width: '100%',
                                  height: '35px',
                                  backgroundColor: msg.isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,123,255,0.1)',
                                  borderRadius: '8px'
                                }}
                                preload="metadata"
                                onError={() => console.error('Private audio playback error for:', getAudioUrl(msg.audio_file))}
                              />
                            ) : (
                              <div style={{ opacity: 0.7, fontSize: '12px' }}>
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Audio file not available
                              </div>
                            )}
                          </div>
                        ) : msg.message_type === 'file' ? (
                          <div className="file-message-bubble">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <i className={`fas ${
                                msg.file_type === 'media' 
                                  ? (msg.original_filename && (msg.original_filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? 'fa-image' : 'fa-video'))
                                  : 'fa-file'
                              }`} 
                                 style={{ color: msg.isOwn ? 'rgba(255,255,255,0.8)' : '#007bff' }}></i>
                              <span style={{ fontWeight: '600' }}>
                                {msg.file_type === 'media' 
                                  ? (msg.original_filename && msg.original_filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? 'Photo' : 'Video')
                                  : 'Document'
                                }
                              </span>
                              {msg.file_size && (
                                <span style={{ opacity: 0.8 }}>({formatFileSize(msg.file_size)})</span>
                              )}
                            </div>
                            {msg.file_attachment ? (
                              <div className="file-attachment">
                                {msg.file_type === 'media' && msg.original_filename && msg.original_filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                                  <img 
                                    src={`http://127.0.0.1:8000${msg.file_attachment}`}
                                    alt={msg.original_filename || 'Uploaded image'}
                                    style={{ 
                                      maxHeight: '200px', 
                                      maxWidth: '100%', 
                                      borderRadius: '8px',
                                      display: 'block'
                                    }}
                                  />
                                ) : msg.file_type === 'media' ? (
                                  <video 
                                    controls 
                                    style={{ 
                                      width: '100%', 
                                      maxHeight: '200px',
                                      borderRadius: '8px'
                                    }}
                                  >
                                    <source src={`http://127.0.0.1:8000${msg.file_attachment}`} />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : (
                                  <a 
                                    href={`http://127.0.0.1:8000${msg.file_attachment}`}
                                    download={msg.original_filename}
                                    style={{
                                      display: 'inline-block',
                                      padding: '8px 12px',
                                      backgroundColor: msg.isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,123,255,0.1)',
                                      borderRadius: '6px',
                                      textDecoration: 'none',
                                      color: 'inherit',
                                      fontSize: '14px'
                                    }}
                                  >
                                    <i className="fas fa-download me-2"></i>
                                    {msg.original_filename || 'Download File'}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div style={{ opacity: 0.7, fontSize: '12px' }}>
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                File not available
                              </div>
                            )}
                          </div>
                        ) : (
                          msg.message
                        )}
                      </div>
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
                        {msg.isOwn && (
                          <span style={{ marginLeft: '4px' }}>
                            {msg.is_sending ? '⏳' : msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
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
                  {/* Private Attachment Button */}
                  <Button 
                    variant="outline-primary"
                    onClick={handlePrivateAttachment}
                    style={{ 
                      borderRadius: '25px 0 0 25px',
                      border: '2px solid #007bff',
                      borderRight: 'none',
                      minWidth: '50px'
                    }}
                    title="Attach files"
                  >
                    <i className="fas fa-paperclip"></i>
                  </Button>
                  
                  <Form.Control
                    type="text"
                    className="private-chat-input"
                    placeholder={`Message ${privateChatUser?.displayName} privately...`}
                    value={newPrivateMessage}
                    onChange={(e) => setNewPrivateMessage(e.target.value)}
                    style={{ 
                      border: '2px solid #007bff',
                      borderLeft: 'none',
                      borderRight: 'none'
                    }}
                  />
                  
                  {/* Private Microphone/Send Button Toggle */}
                  {newPrivateMessage.trim() ? (
                    <Button 
                      type="submit" 
                      variant="primary"
                      style={{ 
                        borderRadius: '0 25px 25px 0',
                        border: '2px solid #007bff',
                        borderLeft: 'none',
                        minWidth: '50px'
                      }}
                      title="Send private message"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </Button>
                  ) : (
                    <Button 
                      variant={isPrivateRecording ? "danger" : "outline-primary"}
                      onMouseDown={startPrivateVoiceRecording}
                      onMouseUp={stopPrivateVoiceRecording}
                      onMouseLeave={stopPrivateVoiceRecording}
                      onTouchStart={startPrivateVoiceRecording}
                      onTouchEnd={stopPrivateVoiceRecording}
                      style={{ 
                        borderRadius: '0 25px 25px 0',
                        border: '2px solid #007bff',
                        borderLeft: 'none',
                        minWidth: '50px',
                        backgroundColor: isPrivateRecording ? '#dc3545' : undefined,
                        transform: isPrivateRecording ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                      title={isPrivateRecording ? "Recording... Release to stop" : `Hold to record voice message (max ${MAX_RECORDING_DURATION / 60} minutes)`}
                    >
                      <i className={`fas ${isPrivateRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </Button>
                  )}
                </InputGroup>
                <small style={{ color: '#6c757d', marginTop: '8px', display: 'block' }}>
                  {isPrivateRecording ? (
                    <span style={{ color: privateRecordingDuration >= MAX_RECORDING_DURATION - 30 ? '#ffc107' : '#dc3545' }}>
                      <i className="fas fa-circle me-1" style={{ fontSize: '8px', color: privateRecordingDuration >= MAX_RECORDING_DURATION - 30 ? '#ffc107' : '#dc3545' }}></i>
                      Recording private voice message... {formatDuration(privateRecordingDuration)} / {formatDuration(MAX_RECORDING_DURATION)} • Release to stop
                      {privateRecordingDuration >= MAX_RECORDING_DURATION - 30 && (
                        <span style={{ color: '#ffc107', marginLeft: '8px' }}>
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Approaching maximum duration
                        </span>
                      )}
                    </span>
                  ) : (
                    <>
                      <i className="fas fa-lock me-1"></i>
                      Messages are encrypted and only visible to you and {privateChatUser.displayName}
                    </>
                  )}
                </small>
              </Form>

              {/* Hidden Private File Input */}
              <input
                ref={privateFileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handlePrivateFileSelect}
              />

              {/* Private Attachment Dropdown */}
              {showPrivateAttachments && (
                <div className="mt-2">
                  <Card className="shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex gap-3">
                        <Button
                          variant="outline-primary"
                          className="flex-fill d-flex align-items-center justify-content-center gap-2 py-3"
                          onClick={handlePrivateMediaFiles}
                        >
                          <i className="fas fa-images fs-3"></i>
                          <div className="text-start">
                            <div className="fw-bold">Photos & Videos</div>
                            <small className="text-muted">Share images and videos</small>
                          </div>
                        </Button>
                        <Button
                          variant="outline-secondary"
                          className="flex-fill d-flex align-items-center justify-content-center gap-2 py-3"
                          onClick={handlePrivateDocumentFiles}
                        >
                          <i className="fas fa-file-alt fs-3"></i>
                          <div className="text-start">
                            <div className="fw-bold">Documents</div>
                            <small className="text-muted">Share files and documents</small>
                          </div>
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Selected Private Files Preview */}
              {selectedPrivateFiles.length > 0 && (
                <div className="mt-2">
                  <Card className="shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center py-2">
                      <span className="fw-bold text-primary">
                        <i className="fas fa-paperclip me-2"></i>
                        Selected Files ({selectedPrivateFiles.length})
                      </span>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setSelectedPrivateFiles([])}
                      >
                        Clear All
                      </Button>
                    </Card.Header>
                    <Card.Body className="p-2">
                      <div className="d-flex flex-column gap-2">
                        {selectedPrivateFiles.map((fileItem, index) => (
                          <div key={index} className="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                            <div className="d-flex align-items-center gap-2">
                              <i className={`fas ${fileItem.type === 'media' ? 'fa-image' : 'fa-file'} text-primary`}></i>
                              <div>
                                <div className="small fw-bold">{fileItem.file.name}</div>
                                <small className="text-muted">{formatFileSize(fileItem.file.size)}</small>
                              </div>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removePrivateFile(index)}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="d-flex gap-2 mt-3">
                        <Button
                          variant="success"
                          onClick={handlePrivateUploadFiles}
                          disabled={privateUploading || selectedPrivateFiles.length === 0}
                          className="flex-grow-1"
                        >
                          {privateUploading ? (
                            <>
                              <i className="fas fa-spinner fa-spin me-2"></i>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-upload me-2"></i>
                              Send Files
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => setSelectedPrivateFiles([])}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Private Voice Recording Preview */}
              {showPrivateVoicePreview && recordedPrivateAudio && (
                <div className="mt-3 p-3 border rounded bg-light">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="mb-0 text-primary">
                      <i className="fas fa-microphone me-2"></i>
                      Private Voice Message ({formatDuration(privateRecordingDuration)})
                    </h6>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={deletePrivateVoiceRecording}
                      title="Cancel recording"
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                  
                  {/* Duration Progress Bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Duration: {formatDuration(privateRecordingDuration)}</span>
                      <span>Max: {formatDuration(MAX_RECORDING_DURATION)}</span>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className={`progress-bar ${privateRecordingDuration >= MAX_RECORDING_DURATION - 30 ? 'bg-warning' : 'bg-primary'}`}
                        style={{ 
                          width: `${(privateRecordingDuration / MAX_RECORDING_DURATION) * 100}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <audio 
                    ref={privateAudioPreviewRef}
                    controls 
                    src={recordedPrivateAudio.url}
                    className="w-100 mb-3"
                    style={{ height: '40px' }}
                  />
                  
                  <div className="d-flex gap-2">
                    <Button
                      variant="danger"
                      onClick={deletePrivateVoiceRecording}
                      className="flex-grow-1"
                    >
                      <i className="fas fa-trash me-2"></i>
                      Delete
                    </Button>
                    <Button
                      variant="success"
                      onClick={confirmPrivateVoiceMessage}
                      className="flex-grow-1"
                    >
                      <i className="fas fa-paper-plane me-2"></i>
                      Send Voice Message
                    </Button>
                  </div>
                </div>
              )}

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