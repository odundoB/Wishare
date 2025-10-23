import api from './api';

const chatAPI = {
  // Room management
  getRooms: () => api.get('/notifications/rooms/'),
  
  createRoom: (roomData) => api.post('/notifications/rooms/', roomData),
  
  joinRoom: (roomId) => api.post(`/notifications/rooms/${roomId}/join/`),
  
  approveJoinRequest: (roomId, requestId) => 
    api.post(`/notifications/rooms/${roomId}/approve/`, { request_id: requestId }),
  
  denyJoinRequest: (roomId, requestId) => 
    api.post(`/notifications/rooms/${roomId}/deny/`, { request_id: requestId }),
  
  removeParticipant: (roomId, userId) => 
    api.post(`/notifications/rooms/${roomId}/remove_participant/`, { user_id: userId }),

  // Host management
  endMeeting: (roomId) => 
    api.post(`/notifications/rooms/${roomId}/end_meeting/`),

  // Leave room
  leaveRoom: (roomId) => 
    api.post(`/notifications/rooms/${roomId}/leave_room/`),
  
  // Messages
  getRoomMessages: (roomId) => api.get(`/notifications/rooms/${roomId}/messages/`),
  
  // Join requests
  getMyJoinRequests: () => api.get('/notifications/rooms/my_requests/'),
  
  getPendingRequests: (roomId) => api.get(`/notifications/rooms/${roomId}/pending_requests/`),
  
  approveJoinRequest: (roomId, requestId) => 
    api.post(`/notifications/rooms/${roomId}/approve_request/`, { request_id: requestId }),
  
  denyJoinRequest: (roomId, requestId, reason) => 
    api.post(`/notifications/rooms/${roomId}/deny_request/`, { request_id: requestId, reason }),

  // Messaging endpoints
  getRoomMessages: (roomId) => api.get(`/notifications/rooms/${roomId}/messages/`),
  
  sendMessage: (roomId, message) => 
    api.post(`/notifications/rooms/${roomId}/send_message/`, { message }),

  sendReply: (roomId, messageData) => 
    api.post(`/notifications/rooms/${roomId}/send_reply/`, messageData),

  editMessage: (roomId, messageId, newText) => 
    api.patch(`/notifications/rooms/${roomId}/messages/${messageId}/`, { message: newText }),

  deleteMessage: (roomId, messageId, deleteForAll = false) => 
    api.delete(`/notifications/rooms/${roomId}/messages/${messageId}/`, { 
      data: { delete_for_all: deleteForAll }
    }),

  addReaction: (roomId, messageId, emoji) => 
    api.post(`/notifications/rooms/${roomId}/messages/${messageId}/react/`, { emoji }),

  removeReaction: (roomId, messageId, emoji) => 
    api.delete(`/notifications/rooms/${roomId}/messages/${messageId}/react/`, { 
      data: { emoji }
    }),

  // Private messaging (legacy)
  getPrivateMessages: (userId) => 
    api.get(`/notifications/private-messages/${userId}/`),

  sendPrivateMessage: (userId, message) => 
    api.post(`/notifications/private-messages/${userId}/send/`, { message }),

  getPrivateConversations: () => 
    api.get('/notifications/private-conversations/'),

  // Private chat rooms within public rooms
  getPrivateChatsByRoom: (publicRoomId) =>
    api.get(`/notifications/private-chats/by_public_room/?public_room_id=${publicRoomId}`),

  getOrCreatePrivateChat: (publicRoomId, otherUserId) =>
    api.post('/notifications/private-chats/get_or_create/', { 
      public_room_id: publicRoomId, 
      other_user_id: otherUserId 
    }),

  getPrivateChatMessages: (privateChatId) =>
    api.get(`/notifications/private-chats/${privateChatId}/messages/`),

  sendPrivateChatMessage: (privateChatId, message) =>
    api.post(`/notifications/private-chats/${privateChatId}/send_message/`, { message }),
  
  getRoomParticipants: (roomId) => api.get(`/notifications/rooms/${roomId}/participants/`),

  // WebSocket connection helper (for future real-time implementation)
  getWebSocketUrl: (roomId, token) => {
    // Use localhost:8000 for development backend
    const wsProtocol = 'ws:';
    const wsHost = 'localhost:8000';
    return `${wsProtocol}//${wsHost}/ws/chat/${roomId}/?token=${token}`;
  },

  // Test WebSocket connection availability
  testWebSocketConnection: async () => {
    return new Promise((resolve) => {
      try {
        const testWs = new WebSocket('ws://localhost:8000/ws/test/');
        testWs.onopen = () => {
          testWs.close();
          resolve(true);
        };
        testWs.onerror = () => {
          resolve(false);
        };
        testWs.onclose = () => {
          resolve(false);
        };
        
        // Timeout after 3 seconds
        setTimeout(() => {
          if (testWs.readyState === WebSocket.CONNECTING) {
            testWs.close();
            resolve(false);
          }
        }, 3000);
      } catch (error) {
        resolve(false);
      }
    });
  }
};

export default chatAPI;