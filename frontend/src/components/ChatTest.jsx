import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import chatAPI from '../services/chat'
import { tokenManager } from '../utils/tokenManager'

const ChatTest = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, login, logout } = useAuth()
  const [chatTestResults, setChatTestResults] = useState({})
  const [testStep, setTestStep] = useState('idle')
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
    console.log(`${timestamp} [${type.toUpperCase()}] ${message}`)
  }

  const runCompleteTest = async () => {
    setLogs([])
    setChatTestResults({})
    
    try {
      // Step 1: Clear tokens and start fresh
      setTestStep('clearing-tokens')
      addLog('🧹 Clearing existing tokens')
      tokenManager.clearTokens()
      
      // Step 2: Login
      setTestStep('logging-in')
      addLog('🔐 Attempting login as teacher')
      const loginResult = await login({ username: 'teacher', password: 'testpass123' })
      
      if (!loginResult.success) {
        addLog(`❌ Login failed: ${loginResult.error}`, 'error')
        setChatTestResults(prev => ({ ...prev, login: { success: false, error: loginResult.error } }))
        setTestStep('failed')
        return
      }
      
      addLog('✅ Login successful', 'success')
      setChatTestResults(prev => ({ ...prev, login: { success: true, user: loginResult.data } }))
      
      // Wait a moment for auth context to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 3: Check token status
      setTestStep('checking-tokens')
      addLog('🔍 Checking token status')
      const tokensInfo = tokenManager.getTokensInfo()
      addLog(`📊 Tokens - Access: ${tokensInfo.hasAccess ? 'Present' : 'Missing'}, Refresh: ${tokensInfo.hasRefresh ? 'Present' : 'Missing'}`)
      setChatTestResults(prev => ({ ...prev, tokens: tokensInfo }))
      
      // Step 4: Test chat API
      setTestStep('testing-chat-api')
      addLog('🏠 Testing chat API directly')
      
      try {
        const roomsResponse = await chatAPI.getRooms()
        addLog(`✅ Chat API successful - ${roomsResponse.data?.results?.length || 0} rooms found`, 'success')
        setChatTestResults(prev => ({ 
          ...prev, 
          chatAPI: { 
            success: true, 
            roomCount: roomsResponse.data?.results?.length || 0,
            response: roomsResponse.data
          } 
        }))
      } catch (apiError) {
        addLog(`❌ Chat API failed: ${apiError.message}`, 'error')
        addLog(`📋 Error details: ${apiError.response?.status} - ${apiError.response?.statusText}`, 'error')
        setChatTestResults(prev => ({ 
          ...prev, 
          chatAPI: { 
            success: false, 
            error: apiError.message,
            status: apiError.response?.status,
            statusText: apiError.response?.statusText
          } 
        }))
      }
      
      // Step 5: Navigate to chat page
      setTestStep('navigating-to-chat')
      addLog('🔀 Preparing to navigate to chat page')
      
      // We'll complete this in a moment
      setTestStep('completed')
      addLog('✅ Test completed', 'success')
      
    } catch (error) {
      addLog(`❌ Test failed with error: ${error.message}`, 'error')
      setTestStep('failed')
    }
  }

  const navigateToChat = () => {
    addLog('🔀 Navigating to chat page')
    navigate('/chat')
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3>Chat System Test</h3>
          <div>
            <button 
              className="btn btn-primary me-2" 
              onClick={runCompleteTest}
              disabled={testStep !== 'idle' && testStep !== 'completed' && testStep !== 'failed'}
            >
              Run Complete Test
            </button>
            <button 
              className="btn btn-success me-2" 
              onClick={navigateToChat}
              disabled={!isAuthenticated}
            >
              Go to Chat Page
            </button>
            <button className="btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <h5>Current Status</h5>
              <ul className="list-group list-group-flush mb-3">
                <li className="list-group-item">
                  <strong>Test Step:</strong> {testStep}
                </li>
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
              
              {chatTestResults.tokens && (
                <div>
                  <h6>Token Status</h6>
                  <ul className="list-group list-group-flush mb-3">
                    <li className="list-group-item">
                      <strong>Access:</strong> {chatTestResults.tokens.hasAccess ? '✅' : '❌'}
                    </li>
                    <li className="list-group-item">
                      <strong>Refresh:</strong> {chatTestResults.tokens.hasRefresh ? '✅' : '❌'}
                    </li>
                    <li className="list-group-item">
                      <strong>Access Expired:</strong> {chatTestResults.tokens.accessExpired ? '❌' : '✅'}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            <div className="col-md-8">
              <h5>Test Logs</h5>
              <div className="border rounded p-3" style={{ height: '400px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                {logs.length === 0 ? (
                  <p className="text-muted">No logs yet. Click "Run Complete Test" to start.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-danger' : log.type === 'success' ? 'text-success' : 'text-dark'}`}>
                      <small className="text-muted">{log.timestamp}</small> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {Object.keys(chatTestResults).length > 0 && (
            <div className="mt-4">
              <h5>Test Results</h5>
              <pre className="bg-light p-3 rounded" style={{ fontSize: '0.9em' }}>
                {JSON.stringify(chatTestResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatTest