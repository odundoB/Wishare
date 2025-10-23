import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import chatAPI from '../services/chat'

const MinimalRoomTest = () => {
  const { user, isAuthenticated } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRoomsDirectly = async () => {
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated, skipping fetch')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Fetching rooms directly...')
      const response = await chatAPI.getRooms()
      console.log('📊 API Response:', response.data)
      
      if (response.data && response.data.results) {
        setRooms(response.data.results)
        console.log(`✅ Loaded ${response.data.results.length} rooms`)
      } else {
        console.log('⚠️ Unexpected response format')
        setRooms([])
      }
    } catch (err) {
      console.error('❌ Error fetching rooms:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRoomsDirectly()
    }
  }, [isAuthenticated, user])

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h3>🧪 Minimal Room Test</h3>
          <p className="mb-0">Direct API call without ChatContext</p>
        </div>
        <div className="card-body">
          
          {/* Status */}
          <div className="mb-3">
            <p><strong>User:</strong> {user?.username || 'None'}</p>
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
          </div>

          {/* Controls */}
          <div className="mb-3">
            <button className="btn btn-primary" onClick={fetchRoomsDirectly} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Rooms'}
            </button>
          </div>

          {/* Results */}
          <div className="mb-3">
            <h5>Room Results ({rooms.length})</h5>
            
            {loading && (
              <div className="alert alert-info">Loading rooms...</div>
            )}
            
            {error && (
              <div className="alert alert-danger">Error: {error}</div>
            )}
            
            {!loading && !error && rooms.length === 0 && (
              <div className="alert alert-warning">No rooms found</div>
            )}
            
            {rooms.length > 0 && (
              <div>
                <div className="alert alert-success">
                  Found {rooms.length} rooms!
                </div>
                
                <div className="row">
                  {rooms.map((room, index) => (
                    <div key={room.id} className="col-md-6 mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">{room.name}</h6>
                          <p className="card-text">{room.description}</p>
                          <small className="text-muted">
                            Host: {room.host?.username} | Type: {room.room_type}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <details className="mt-3">
                  <summary>Raw Data</summary>
                  <pre className="bg-light p-3 rounded" style={{ fontSize: '0.8em' }}>
                    {JSON.stringify(rooms, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MinimalRoomTest