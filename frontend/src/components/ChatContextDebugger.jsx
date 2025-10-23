import React from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const ChatContextDebugger = () => {
  const { rooms, loading, error } = useChat();
  const { user, token } = useAuth();

  console.log('🔍 ChatContextDebugger Render:', {
    rooms: rooms,
    roomsLength: rooms?.length,
    roomsType: typeof rooms,
    roomsIsArray: Array.isArray(rooms),
    loading: loading,
    error: error,
    user: user?.username,
    token: token ? 'Present' : 'Missing'
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔍 ChatContext Debug</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4>Authentication State:</h4>
        <p><strong>User:</strong> {user?.username || 'Not logged in'}</p>
        <p><strong>Role:</strong> {user?.role || 'None'}</p>
        <p><strong>Token:</strong> {token ? 'Present' : 'Missing'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h4>ChatContext State:</h4>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
        <p><strong>Rooms Type:</strong> {typeof rooms}</p>
        <p><strong>Is Array:</strong> {Array.isArray(rooms) ? 'Yes' : 'No'}</p>
        <p><strong>Rooms Length:</strong> {rooms?.length || 0}</p>
        <p><strong>Raw Rooms:</strong></p>
        <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '3px', overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(rooms, null, 2)}
        </pre>
      </div>

      {Array.isArray(rooms) && rooms.length > 0 ? (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
          <h4>✅ Room Display Test:</h4>
          {rooms.map(room => (
            <div key={room.id} style={{ padding: '10px', margin: '10px 0', backgroundColor: 'white', borderRadius: '3px' }}>
              <strong>{room.name}</strong> (ID: {room.id})
              <br />
              <small>Host: {room.host?.username} | Participants: {room.participants?.length}</small>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
          <h4>❌ No Rooms to Display</h4>
          <p>
            {loading ? 'Currently loading...' : 
             !Array.isArray(rooms) ? 'Rooms is not an array' : 
             'Rooms array is empty'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatContextDebugger;