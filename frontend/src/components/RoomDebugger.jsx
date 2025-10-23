import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChat } from '../contexts/ChatContext'
import chatAPI from '../services/chat'
import { tokenManager } from '../utils/tokenManager'

const RoomDebugger = () => {
  const { user, isAuthenticated } = useAuth()
  const chatContext = useChat()
  const [directApiData, setDirectApiData] = useState(null)
  const [apiError, setApiError] = useState(null)

  // Test direct API call
  const testDirectAPI = async () => {
    try {
      setApiError(null)
      console.log('🧪 Testing direct API call...')
      const response = await chatAPI.getRooms()
      console.log('📊 Direct API response:', response.data)
      setDirectApiData(response.data)
    } catch (error) {
      console.error('❌ Direct API failed:', error)
      setApiError({
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
    }
  }

  // Auto-test when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      testDirectAPI()
    }
  }, [isAuthenticated, user])

  const tokensInfo = tokenManager.getTokensInfo()

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h3>🔍 Room Data Debugger</h3>
          <small className="text-muted">Compare ChatContext vs Direct API</small>
        </div>
        <div className="card-body">
          
          {/* Authentication Status */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-header">
                  <h6>Authentication Status</h6>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled">
                    <li><strong>Authenticated:</strong> {isAuthenticated ? '✅' : '❌'}</li>
                    <li><strong>User:</strong> {user?.username || 'None'}</li>
                    <li><strong>Role:</strong> {user?.role || 'None'}</li>
                    <li><strong>Has Access Token:</strong> {tokensInfo.hasAccess ? '✅' : '❌'}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-header">
                  <h6>Quick Actions</h6>
                </div>
                <div className="card-body">
                  <button className="btn btn-primary me-2" onClick={testDirectAPI}>
                    🔄 Test Direct API
                  </button>
                  <button className="btn btn-secondary" onClick={() => chatContext.fetchRooms()}>
                    🔄 Fetch via Context
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ChatContext Data */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6>📋 ChatContext State</h6>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <ul className="list-unstyled">
                        <li><strong>Loading:</strong> {String(chatContext.loading)}</li>
                        <li><strong>Error:</strong> {chatContext.error || 'None'}</li>
                        <li><strong>Rooms Type:</strong> {Array.isArray(chatContext.rooms) ? 'Array' : typeof chatContext.rooms}</li>
                        <li><strong>Rooms Count:</strong> {Array.isArray(chatContext.rooms) ? chatContext.rooms.length : 'N/A'}</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <strong>First Room Sample:</strong>
                      {Array.isArray(chatContext.rooms) && chatContext.rooms.length > 0 ? (
                        <pre className="bg-light p-2 rounded mt-1" style={{ fontSize: '0.8em' }}>
                          {JSON.stringify(chatContext.rooms[0], null, 2)}
                        </pre>
                      ) : (
                        <p className="text-muted">No rooms available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct API Data */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6>🌐 Direct API Response</h6>
                </div>
                <div className="card-body">
                  {apiError ? (
                    <div className="alert alert-danger">
                      <strong>API Error:</strong> {apiError.message}
                      {apiError.status && <p>Status: {apiError.status}</p>}
                      <details>
                        <summary>Error Details</summary>
                        <pre>{JSON.stringify(apiError, null, 2)}</pre>
                      </details>
                    </div>
                  ) : directApiData ? (
                    <div>
                      <p><strong>Results Count:</strong> {directApiData.results?.length || 0}</p>
                      <p><strong>Data Structure:</strong></p>
                      <pre className="bg-light p-3 rounded" style={{ fontSize: '0.8em', maxHeight: '300px', overflow: 'auto' }}>
                        {JSON.stringify(directApiData, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-muted">No API data yet. Click "Test Direct API" to fetch.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comparison */}
          {directApiData && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h6>⚖️ Data Comparison</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <h6>ChatContext Rooms</h6>
                        <ul>
                          <li>Count: {Array.isArray(chatContext.rooms) ? chatContext.rooms.length : 'Not Array'}</li>
                          <li>Type: {typeof chatContext.rooms}</li>
                          <li>Is Array: {String(Array.isArray(chatContext.rooms))}</li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <h6>Direct API Results</h6>
                        <ul>
                          <li>Count: {directApiData.results?.length || 0}</li>
                          <li>Type: {typeof directApiData.results}</li>
                          <li>Is Array: {String(Array.isArray(directApiData.results))}</li>
                        </ul>
                      </div>
                    </div>
                    
                    {Array.isArray(chatContext.rooms) && Array.isArray(directApiData.results) && (
                      <div className="mt-3">
                        {chatContext.rooms.length === directApiData.results.length ? (
                          <div className="alert alert-success">
                            ✅ Counts match! Both have {chatContext.rooms.length} rooms.
                          </div>
                        ) : (
                          <div className="alert alert-warning">
                            ⚠️ Count mismatch! Context: {chatContext.rooms.length}, API: {directApiData.results.length}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomDebugger