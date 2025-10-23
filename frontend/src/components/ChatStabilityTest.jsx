import React, { useState, useEffect } from 'react'
import { ChatProvider, useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'

const ChatStabilityTest = () => {
  const { user, isAuthenticated, login } = useAuth()
  const [renderCount, setRenderCount] = useState(0)
  const [loginAttempted, setLoginAttempted] = useState(false)

  // Count renders to detect infinite re-render loops
  useEffect(() => {
    setRenderCount(prev => prev + 1)
  })

  const handleQuickLogin = async () => {
    if (loginAttempted) return
    setLoginAttempted(true)
    
    try {
      await login({ username: 'teacher', password: 'testpass123' })
    } catch (error) {
      console.error('Login failed:', error)
      setLoginAttempted(false)
    }
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h3>Chat Stability Test</h3>
          <small className="text-muted">This test monitors for infinite re-renders and chat content stability</small>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <h5>Render Monitoring</h5>
              <div className="alert alert-info">
                <strong>Render Count:</strong> {renderCount}
                {renderCount > 10 && (
                  <div className="text-warning mt-2">
                    ⚠️ High render count detected! Check for infinite loops.
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <h5>Authentication Status</h5>
              <ul className="list-group">
                <li className="list-group-item">
                  <strong>Authenticated:</strong> {isAuthenticated ? '✅' : '❌'}
                </li>
                <li className="list-group-item">
                  <strong>User:</strong> {user?.username || 'None'}
                </li>
                <li className="list-group-item">
                  <strong>Role:</strong> {user?.role || 'None'}
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-3">
            <button 
              className="btn btn-primary me-2" 
              onClick={handleQuickLogin}
              disabled={loginAttempted}
            >
              {loginAttempted ? 'Logging in...' : 'Quick Login as Teacher'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>

          {isAuthenticated && (
            <ChatProvider>
              <ChatContentTest />
            </ChatProvider>
          )}
        </div>
      </div>
    </div>
  )
}

const ChatContentTest = () => {
  const { rooms, loading, error, fetchRooms } = useChat()
  const [contentRenderCount, setContentRenderCount] = useState(0)
  const [lastRoomsLength, setLastRoomsLength] = useState(0)
  const [contentHistory, setContentHistory] = useState([])

  // Monitor chat content changes
  useEffect(() => {
    setContentRenderCount(prev => prev + 1)
    
    const timestamp = new Date().toLocaleTimeString()
    const entry = {
      timestamp,
      loading,
      error: error || 'None',
      roomsCount: rooms?.length || 0,
      renderCount: contentRenderCount
    }
    
    setContentHistory(prev => [...prev.slice(-10), entry]) // Keep last 10 entries
    
    if (rooms?.length !== lastRoomsLength) {
      setLastRoomsLength(rooms?.length || 0)
      console.log(`🔄 Chat rooms changed: ${rooms?.length || 0} rooms at ${timestamp}`)
    }
  }, [rooms, loading, error, contentRenderCount, lastRoomsLength])

  return (
    <div className="mt-4">
      <div className="card">
        <div className="card-header">
          <h5>Chat Content Monitor</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6>Current State</h6>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>Loading:</strong> {loading ? '🔄 Yes' : '✅ No'}
                </li>
                <li className="list-group-item">
                  <strong>Error:</strong> {error || '✅ None'}
                </li>
                <li className="list-group-item">
                  <strong>Rooms Count:</strong> {rooms?.length || 0}
                </li>
                <li className="list-group-item">
                  <strong>Content Renders:</strong> {contentRenderCount}
                </li>
              </ul>
              
              <button 
                className="btn btn-sm btn-outline-primary mt-2" 
                onClick={() => fetchRooms()}
              >
                Manual Fetch Rooms
              </button>
            </div>
            
            <div className="col-md-6">
              <h6>Content Change History</h6>
              <div style={{ height: '200px', overflowY: 'auto', fontSize: '0.8em' }}>
                {contentHistory.map((entry, index) => (
                  <div key={index} className="mb-1 p-1 border-bottom">
                    <strong>{entry.timestamp}</strong><br/>
                    Loading: {entry.loading ? 'Yes' : 'No'}, 
                    Rooms: {entry.roomsCount}, 
                    Renders: {entry.renderCount}
                    {entry.error !== 'None' && <div className="text-danger">Error: {entry.error}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {rooms && rooms.length > 0 && (
            <div className="mt-3">
              <h6>Room List Preview</h6>
              <div className="alert alert-success">
                <strong>✅ Rooms loaded successfully!</strong> Found {rooms.length} rooms.
                <details className="mt-2">
                  <summary>Room Names</summary>
                  <ul className="mt-2">
                    {rooms.slice(0, 5).map((room, index) => (
                      <li key={room.id || index}>{room.name}</li>
                    ))}
                    {rooms.length > 5 && <li>... and {rooms.length - 5} more</li>}
                  </ul>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatStabilityTest