import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Chat.jsx - Redirect to Working Chat Page
 * This component redirects users to the fully functional chat page
 */
const Chat = () => {
  // Redirect to the working chat page
  return <Navigate to="/working-chat" replace />;
};

export default Chat;