import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { tokenManager } from '../utils/tokenManager'

const AuthTest = () => {
  const { user, isAuthenticated, login, logout } = useAuth()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginResult, setLoginResult] = useState(null)
  const [apiTest, setApiTest] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('🔐 Testing login...')
    
    const result = await login(loginForm)
    setLoginResult(result)
    
    if (result.success) {
      console.log('✅ Login successful')
      // Test API call after login
      await testAPI()
    } else {
      console.error('❌ Login failed:', result.error)
    }
  }

  const testAPI = async () => {
    try {
      console.log('🧪 Testing API call...')
      const response = await fetch('http://localhost:8000/api/users/profile/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiTest({ success: true, data })
        console.log('✅ API test successful:', data)
      } else {
        const error = await response.text()
        setApiTest({ success: false, error: `${response.status}: ${error}` })
        console.error('❌ API test failed:', response.status, error)
      }
    } catch (error) {
      setApiTest({ success: false, error: error.message })
      console.error('❌ API test error:', error)
    }
  }

  const quickLogin = async (username, password) => {
    setLoginForm({ username, password })
    const result = await login({ username, password })
    setLoginResult(result)
    
    if (result.success) {
      await testAPI()
    }
  }

  const tokensInfo = tokenManager.getTokensInfo()

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3>Authentication Test</h3>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>Current Auth State</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
                    </li>
                    <li className="list-group-item">
                      <strong>User:</strong> {user?.username || 'None'}
                    </li>
                    <li className="list-group-item">
                      <strong>Role:</strong> {user?.role || 'None'}
                    </li>
                    <li className="list-group-item">
                      <strong>User ID:</strong> {user?.id || 'None'}
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>Token Status</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Access Token:</strong> {tokensInfo.hasAccess ? '✅ Present' : '❌ Missing'}
                    </li>
                    <li className="list-group-item">
                      <strong>Refresh Token:</strong> {tokensInfo.hasRefresh ? '✅ Present' : '❌ Missing'}
                    </li>
                    <li className="list-group-item">
                      <strong>Access Expired:</strong> {tokensInfo.accessExpired === null ? 'N/A' : tokensInfo.accessExpired ? '❌ Yes' : '✅ No'}
                    </li>
                    <li className="list-group-item">
                      <strong>Refresh Expired:</strong> {tokensInfo.refreshExpired === null ? 'N/A' : tokensInfo.refreshExpired ? '❌ Yes' : '✅ No'}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mb-3">
                <h5>Quick Login</h5>
                <div className="btn-group me-2 mb-2">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => quickLogin('teacher', 'testpass123')}
                  >
                    Login as Teacher
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => quickLogin('test_student', 'testpass123')}
                  >
                    Login as Student
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <h5>Manual Login</h5>
                <form onSubmit={handleLogin}>
                  <div className="row">
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      />
                    </div>
                    <div className="col-md-4">
                      <button type="submit" className="btn btn-success">Login</button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="mb-3">
                <h5>Actions</h5>
                <button className="btn btn-danger me-2" onClick={logout}>
                  Logout
                </button>
                <button className="btn btn-info me-2" onClick={testAPI}>
                  Test API Call
                </button>
                <button className="btn btn-warning" onClick={() => {tokenManager.clearTokens(); window.location.reload()}}>
                  Clear Tokens & Refresh
                </button>
              </div>

              {loginResult && (
                <div className="mb-3">
                  <h5>Login Result</h5>
                  <div className={`alert ${loginResult.success ? 'alert-success' : 'alert-danger'}`}>
                    <pre>{JSON.stringify(loginResult, null, 2)}</pre>
                  </div>
                </div>
              )}

              {apiTest && (
                <div className="mb-3">
                  <h5>API Test Result</h5>
                  <div className={`alert ${apiTest.success ? 'alert-success' : 'alert-danger'}`}>
                    <pre>{JSON.stringify(apiTest, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthTest