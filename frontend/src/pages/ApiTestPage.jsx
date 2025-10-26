import React, { useState } from 'react'
import { Button, Container, Alert } from 'react-bootstrap'
import { userAPI } from '../services/api'

const ApiTestPage = () => {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testStudentRegistration = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const testData = {
        first_name: "Test",
        surname: "Student",
        admission_number: "TEST001",
        email: "test@example.com",
        password: "TestPass123!",
        confirm_password: "TestPass123!",
        username: "TEST001",
        role: "student"
      }
      
      console.log('Sending registration data:', testData)
      const response = await userAPI.register(testData)
      console.log('Registration response:', response.data)
      setResult(`✅ Registration Success: ${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      console.error('Registration error:', error)
      setResult(`❌ Registration Error: ${error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testStudentLogin = async () => {
    setLoading(true)
    setResult('')
    
    try {
      const loginData = {
        username: "TEST001",
        password: "TestPass123!"
      }
      
      console.log('Sending login data:', loginData)
      const response = await userAPI.login(loginData)
      console.log('Login response:', response.data)
      setResult(`✅ Login Success: ${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      console.error('Login error:', error)
      setResult(`❌ Login Error: ${error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <h2>API Test Page</h2>
      <div className="mb-3">
        <Button 
          onClick={testStudentRegistration} 
          disabled={loading}
          className="me-2"
          variant="primary"
        >
          {loading ? 'Testing...' : 'Test Student Registration'}
        </Button>
        <Button 
          onClick={testStudentLogin} 
          disabled={loading}
          variant="success"
        >
          {loading ? 'Testing...' : 'Test Student Login'}
        </Button>
      </div>
      
      {result && (
        <Alert variant={result.includes('✅') ? 'success' : 'danger'}>
          <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
            {result}
          </pre>
        </Alert>
      )}
    </Container>
  )
}

export default ApiTestPage