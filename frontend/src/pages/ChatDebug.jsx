import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ChatDebug = () => {
  console.log('ChatDebug component rendered');
  const { user, loading, isAuthenticated, token } = useAuth();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Chat Debug Page</h1>
      <p>If you can see this, the routing and basic React rendering is working.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      
      <h2>Authentication Status</h2>
      <ul>
        <li>Loading: {loading ? 'Yes' : 'No'}</li>
        <li>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</li>
        <li>User: {user ? `${user.username} (${user.role})` : 'None'}</li>
        <li>Token: {token ? 'Present' : 'Missing'}</li>
      </ul>
      
      <h2>Local Storage</h2>
      <ul>
        <li>Access Token: {localStorage.getItem('access_token') ? 'Present' : 'Missing'}</li>
        <li>Refresh Token: {localStorage.getItem('refresh_token') ? 'Present' : 'Missing'}</li>
      </ul>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.open('/chat', '_blank')}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          Open Real Chat Page
        </button>
      </div>
    </div>
  );
};

export default ChatDebug;