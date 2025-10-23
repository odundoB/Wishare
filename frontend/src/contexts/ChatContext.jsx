import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import chatAPI from '../services/chat';

const ChatContext = createContext();

const initialState = {
  rooms: [],
  activeRoom: null,
  messages: [],
  joinRequests: [],
  pendingRequests: [], // For host to manage
  loading: false,
  error: null,
  websocket: null,
  connected: false,
  notification: null
};

// Helper function to ensure state integrity
const validateState = (state) => ({
  ...state,
  rooms: Array.isArray(state.rooms) ? state.rooms : [],
  messages: Array.isArray(state.messages) ? state.messages : [],
  joinRequests: Array.isArray(state.joinRequests) ? state.joinRequests : [],
  pendingRequests: Array.isArray(state.pendingRequests) ? state.pendingRequests : [],
});

const chatReducer = (state, action) => {
  // Ensure state is always valid before processing
  const validState = validateState(state);
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...validState, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...validState, error: action.payload, loading: false };
    
    case 'SET_ROOMS':
      return { ...validState, rooms: Array.isArray(action.payload) ? action.payload : [], loading: false };
    
    case 'ADD_ROOM':
      return { ...validState, rooms: [action.payload, ...validState.rooms] };
    
    case 'SET_ACTIVE_ROOM':
      return { ...validState, activeRoom: action.payload, messages: [] };
    
    case 'SET_MESSAGES':
      return { ...validState, messages: Array.isArray(action.payload) ? action.payload : [] };
    
    case 'ADD_MESSAGE':
      return { 
        ...validState, 
        messages: [...validState.messages, action.payload] 
      };
    
    case 'SET_WEBSOCKET':
      return { ...validState, websocket: action.payload };
    
    case 'SET_CONNECTED':
      return { ...validState, connected: action.payload };
    
    case 'UPDATE_ROOM_PARTICIPANTS':
      return {
        ...validState,
        rooms: validState.rooms.map(room =>
          room.id === action.payload.roomId
            ? { ...room, participants: action.payload.participants }
            : room
        ),
        activeRoom: validState.activeRoom && validState.activeRoom.id === action.payload.roomId
          ? { ...validState.activeRoom, participants: action.payload.participants }
          : validState.activeRoom
      };
    
    case 'SET_PENDING_REQUESTS':
      return { ...validState, pendingRequests: Array.isArray(action.payload) ? action.payload : [] };
    
    case 'REMOVE_PENDING_REQUEST':
      return { 
        ...validState, 
        pendingRequests: validState.pendingRequests.filter(req => req.id !== action.payload) 
      };
    
    case 'SET_JOIN_REQUESTS':
      return { ...validState, joinRequests: Array.isArray(action.payload) ? action.payload : [] };
    
    case 'SET_NOTIFICATION':
      return { ...validState, notification: action.payload };
    
    case 'CLEAR_NOTIFICATION':
      return { ...validState, notification: null };
    
    default:
      return validState;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, token } = useAuth();
  
  // Debug logging for auth state changes
  React.useEffect(() => {
    console.log('🔐 ChatProvider - Auth state changed:', { 
      user: user?.username || 'None', 
      token: token ? 'Present' : 'Missing' 
    });
  }, [user, token]);

  // Notification helpers
  const showNotification = (message, type = 'success') => {
    dispatch({ type: 'SET_NOTIFICATION', payload: { message, type } });
  };

  const clearNotification = () => {
    dispatch({ type: 'CLEAR_NOTIFICATION' });
  };

  // Fetch rooms - use refs to get current auth state without causing dependency loops
  const userRef = useRef(user);
  const tokenRef = useRef(token);
  const isFetchingRooms = useRef(false); // Prevent multiple simultaneous calls
  
  // Update refs when auth state changes
  useEffect(() => {
    userRef.current = user;
    tokenRef.current = token;
  }, [user, token]);
  
  const fetchRooms = useCallback(async () => {
    const currentUser = userRef.current;
    const currentToken = tokenRef.current;
    
    console.log('🔄 fetchRooms called - User:', currentUser?.username, 'Token:', currentToken ? 'Present' : 'Missing');
    
    // Prevent multiple simultaneous calls
    if (isFetchingRooms.current) {
      console.log('⏸️ fetchRooms already in progress, skipping duplicate call');
      return;
    }
    
    if (!currentUser || !currentToken) {
      console.warn('❌ Cannot fetch rooms: User not authenticated', { user: !!currentUser, token: !!currentToken });
      dispatch({ type: 'SET_ROOMS', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    isFetchingRooms.current = true;
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('📡 Making API call to getRooms...');
      const response = await chatAPI.getRooms();
      console.log('✅ API Response received:', response.data);
      
      // Handle paginated response - check if response has 'results' key
      let roomsData = [];
      if (response.data && response.data.results) {
        roomsData = Array.isArray(response.data.results) ? response.data.results : [];
        console.log('📋 Found paginated rooms:', roomsData.length);
      } else if (Array.isArray(response.data)) {
        roomsData = response.data;
        console.log('📋 Found array rooms:', roomsData.length);
      } else {
        console.log('⚠️ Unexpected response format:', typeof response.data);
      }
      
      dispatch({ type: 'SET_ROOMS', payload: roomsData });
      dispatch({ type: 'SET_ERROR', payload: null }); // Clear any previous errors
      console.log('✅ Rooms loaded successfully:', roomsData.length);
    } catch (error) {
      console.error('❌ Failed to fetch rooms:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMsg = error.response?.data?.detail || 
                      error.message || 
                      'Failed to fetch rooms. Please check your connection.';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
    } finally {
      isFetchingRooms.current = false;
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('🏁 fetchRooms completed, loading set to false');
    }
  }, []); // No dependencies to prevent loops

  // Create room
  const createRoom = async (roomData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await chatAPI.createRoom(roomData);
      dispatch({ type: 'ADD_ROOM', payload: response.data });
      showNotification(`🎉 Success! Room "${response.data.name}" has been created and is ready for students to join!`, 'success');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.response?.data?.name?.[0] || 'Failed to create room. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      showNotification(`❌ ${errorMsg}`, 'error');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Join room
  const joinRoom = async (roomId) => {
    try {
      const response = await chatAPI.joinRoom(roomId);
      
      // Check if user was auto-approved and joined immediately
      if (response.data.status === 'approved') {
        await fetchRooms(); // Refresh rooms to show updated participant list
        showNotification(response.data.detail || 'Joined room successfully! 🎉');
        return { ...response.data, autoJoined: true };
      } else {
        // Join request is pending approval
        showNotification(response.data.detail || 'Join request sent! Waiting for host approval. 📨');
        return { ...response.data, autoJoined: false };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to join room';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      showNotification(errorMsg, 'error');
      throw error;
    }
  };

  // Approve join request
  const approveJoinRequest = async (roomId, requestId) => {
    try {
      await chatAPI.approveJoinRequest(roomId, requestId);
      dispatch({ type: 'REMOVE_PENDING_REQUEST', payload: requestId });
      await fetchRooms();
      showNotification('Join request approved! ✅');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to approve request';
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      showNotification(errorMsg, 'error');
      throw error;
    }
  };

  // Deny join request
  const denyJoinRequest = async (roomId, requestId) => {
    try {
      await chatAPI.denyJoinRequest(roomId, requestId);
      dispatch({ type: 'REMOVE_PENDING_REQUEST', payload: requestId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.detail || 'Failed to deny request' });
      throw error;
    }
  };

  // Fetch current user's join requests
  const fetchMyJoinRequests = async () => {
    try {
      const response = await chatAPI.getMyJoinRequests();
      dispatch({ type: 'SET_JOIN_REQUESTS', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch join requests:', error);
      // Don't show error notification for this as it's not critical
      return [];
    }
  };

  // Remove participant
  const removeParticipant = async (roomId, userId) => {
    try {
      await chatAPI.removeParticipant(roomId, userId);
      await fetchRooms(); // Refresh to get updated participants
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.detail || 'Failed to remove participant' });
      throw error;
    }
  };

  // Connect to WebSocket (with availability check)
  const connectToRoom = async (roomId) => {
    if (state.websocket) {
      state.websocket.close();
    }

    // Don't connect if no token available
    if (!token) {
      console.warn('Cannot connect to WebSocket: No authentication token available');
      return;
    }

    try {
      // First test if WebSocket server is available
      const isWebSocketAvailable = await chatAPI.testWebSocketConnection();
      
      if (!isWebSocketAvailable) {
        console.log('WebSocket server not available, using REST API only');
        dispatch({ type: 'SET_CONNECTED', payload: false });
        return;
      }

      const wsUrl = chatAPI.getWebSocketUrl(roomId, token);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to chat room:', roomId);
        dispatch({ type: 'SET_CONNECTED', payload: true });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message') {
          dispatch({ type: 'ADD_MESSAGE', payload: data.message });
        } else if (data.type === 'system') {
          dispatch({ 
            type: 'ADD_MESSAGE', 
            payload: {
              id: Date.now(),
              content: data.message,
              message_type: 'system',
              timestamp: data.timestamp,
              sender: null
            }
          });
        }
      };

      ws.onclose = (event) => {
        console.log('Disconnected from chat room:', event.code, event.reason);
        dispatch({ type: 'SET_CONNECTED', payload: false });
        
        // Don't show error for normal closure
        if (event.code !== 1000) {
          console.warn('WebSocket closed unexpectedly (fallback to REST):', event.code, event.reason);
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket error (using REST API fallback):', error);
        dispatch({ type: 'SET_CONNECTED', payload: false });
        // Don't dispatch error for WebSocket issues as they're often temporary
        // dispatch({ type: 'SET_ERROR', payload: 'Connection error' });
      };

      dispatch({ type: 'SET_WEBSOCKET', payload: ws });
      
    } catch (error) {
      console.log('WebSocket connection failed (fallback to REST API):', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  };

  // Send message
  const sendMessage = (content) => {
    if (state.websocket && state.connected) {
      state.websocket.send(JSON.stringify({
        type: 'chat_message',
        content: content
      }));
    }
  };

  // Set active room and load messages
  const setActiveRoom = async (room) => {
    dispatch({ type: 'SET_ACTIVE_ROOM', payload: room });
    
    try {
      const response = await chatAPI.getRoomMessages(room.id);
      const messagesData = Array.isArray(response.data) ? response.data.reverse() : [];
      dispatch({ type: 'SET_MESSAGES', payload: messagesData });
      
      // Connect to WebSocket for real-time updates
      connectToRoom(room.id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' });
    }
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (state.websocket) {
        state.websocket.close();
      }
    };
  }, []);

  // Fetch rooms when user becomes available - using ref to prevent dependency loops
  const hasFetchedRooms = useRef(false);
  
  useEffect(() => {
    if (user && token) {
      console.log('🔄 User and token available, checking if we should fetch rooms');
      
      // Only fetch if we haven't fetched yet
      if (!hasFetchedRooms.current) {
        console.log('🔄 Triggering fetchRooms - first load');
        hasFetchedRooms.current = true;
        fetchRooms();
      }
    } else if (!user || !token) {
      // Reset the flag when user logs out
      hasFetchedRooms.current = false;
      console.log('🔄 User/token unavailable, resetting fetch flag');
    }
  }, [user, token]); // Only depend on user and token, not fetchRooms

  const value = {
    ...state,
    fetchRooms,
    createRoom,
    joinRoom,
    approveJoinRequest,
    denyJoinRequest,
    removeParticipant,
    setActiveRoom,
    sendMessage,
    connectToRoom,
    fetchMyJoinRequests,
    showNotification,
    clearNotification
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};