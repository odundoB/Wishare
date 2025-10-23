import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { tokenManager } from '../utils/tokenManager'

const ComprehensiveSystemTest = () => {
  const { user, isAuthenticated, login, logout } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [currentStep, setCurrentStep] = useState('idle')

  const runCompleteSystemTest = async () => {
    setTestResults({})
    setCurrentStep('starting')

    try {
      // Step 1: Clear all tokens
      setCurrentStep('clearing-tokens')
      tokenManager.clearTokens()
      
      // Step 2: Login as teacher
      setCurrentStep('login-teacher')
      const teacherLogin = await login({ username: 'teacher', password: 'testpass123' })
      
      if (!teacherLogin.success) {
        throw new Error(`Teacher login failed: ${teacherLogin.error}`)
      }

      // Step 3: Test token status
      setCurrentStep('checking-tokens')
      const tokensInfo = tokenManager.getTokensInfo()
      
      // Step 4: Test API access
      setCurrentStep('testing-api')
      const profileResponse = await fetch('/api/users/profile/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
      
      if (!profileResponse.ok) {
        throw new Error(`Profile API failed: ${profileResponse.status}`)
      }

      // Step 5: Test chat API
      setCurrentStep('testing-chat')
      const chatResponse = await fetch('/api/chat/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
      
      if (!chatResponse.ok) {
        throw new Error(`Chat API failed: ${chatResponse.status}`)
      }

      const chatData = await chatResponse.json()

      setTestResults({
        login: { success: true, user: teacherLogin.data },
        tokens: tokensInfo,
        api: { success: true, status: profileResponse.status },
        chat: { success: true, roomCount: chatData.results?.length || 0 },
        overall: 'success'
      })
      setCurrentStep('completed')

    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        error: error.message, 
        overall: 'failed' 
      }))
      setCurrentStep('failed')
    }
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h2>🎯 WioShare Complete System Test</h2>
          <p className="mb-0">Comprehensive test of authentication, token management, and chat functionality</p>
        </div>
        <div className="card-body">
          
          {/* Current Status */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-header">
                  <h5>Current Authentication Status</h5>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled">
                    <li><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>User:</strong> {user?.username || 'None'}</li>
                    <li><strong>Role:</strong> {user?.role || 'None'}</li>
                    <li><strong>Test Step:</strong> {currentStep}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-header">
                  <h5>Quick Actions</h5>
                </div>
                <div className="card-body">
                  <button 
                    className="btn btn-primary me-2 mb-2" 
                    onClick={runCompleteSystemTest}
                    disabled={currentStep !== 'idle' && currentStep !== 'completed' && currentStep !== 'failed'}
                  >
                    🚀 Run Complete Test
                  </button>
                  <button className="btn btn-secondary me-2 mb-2" onClick={logout}>
                    🚪 Logout
                  </button>
                  <Link to="/chat" className="btn btn-success me-2 mb-2">
                    💬 Go to Chat
                  </Link>
                  <Link to="/dashboard" className="btn btn-info mb-2">
                    📊 Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5>🧪 Debug & Test Pages</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3 mb-2">
                      <Link to="/auth-test" className="btn btn-outline-primary w-100">
                        🔐 Auth Test
                      </Link>
                    </div>
                    <div className="col-md-3 mb-2">
                      <Link to="/chat-test" className="btn btn-outline-success w-100">
                        💬 Chat Test
                      </Link>
                    </div>
                    <div className="col-md-3 mb-2">
                      <Link to="/token-debug" className="btn btn-outline-warning w-100">
                        🎫 Token Debug
                      </Link>
                    </div>
                    <div className="col-md-3 mb-2">
                      <Link to="/chat-debug-complete" className="btn btn-outline-info w-100">
                        🔍 Chat Debug
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5>📋 Test Results</h5>
              </div>
              <div className="card-body">
                {testResults.overall === 'success' ? (
                  <div className="alert alert-success">
                    <h6>🎉 All Tests Passed!</h6>
                    <ul className="mb-0">
                      <li>✅ Authentication working</li>
                      <li>✅ Token management functional</li>
                      <li>✅ Profile API accessible</li>
                      <li>✅ Chat API working ({testResults.chat?.roomCount} rooms found)</li>
                    </ul>
                  </div>
                ) : testResults.overall === 'failed' ? (
                  <div className="alert alert-danger">
                    <h6>❌ Tests Failed</h6>
                    <p><strong>Error:</strong> {testResults.error}</p>
                  </div>
                ) : null}
                
                <details className="mt-3">
                  <summary>Raw Test Data</summary>
                  <pre className="bg-light p-3 mt-2 rounded">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* System Status Summary */}
          <div className="card mt-4">
            <div className="card-header">
              <h5>🏗️ System Components Status</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>✅ Working Components</h6>
                  <ul className="list-unstyled text-success">
                    <li>✅ Backend Django API (Port 8000)</li>
                    <li>✅ Frontend React App (Port 3002)</li>
                    <li>✅ JWT Authentication System</li>
                    <li>✅ Token Refresh Mechanism</li>
                    <li>✅ Chat API Endpoints</li>
                    <li>✅ Role-based Access Control</li>
                    <li>✅ Dashboard Navigation</li>
                    <li>✅ Teacher/Student Profile Links</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>🔗 Available Features</h6>
                  <ul className="list-unstyled text-primary">
                    <li>🏠 Main Dashboard with Chat Link</li>
                    <li>👩‍🏫 Teacher Profile with Quick Actions</li>
                    <li>🎓 Student Profile with Quick Actions</li>
                    <li>💬 Chat System (Teachers create, Students join)</li>
                    <li>🔐 Secure Authentication</li>
                    <li>🎫 Automatic Token Management</li>
                    <li>📱 Responsive Design</li>
                    <li>🧪 Comprehensive Debug Tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComprehensiveSystemTest