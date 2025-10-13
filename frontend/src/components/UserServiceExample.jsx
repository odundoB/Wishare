import React, { useState } from 'react'
import { Button, Card, Alert, Form, Row, Col } from 'react-bootstrap'
import { registerUser, loginUser, logoutUser, getProfile, updateProfile } from '../services/users'

const UserServiceExample = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student'
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const testRegister = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await registerUser(formData)
      setResult({
        type: 'success',
        message: 'Registration successful!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Registration failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await loginUser({
        username: formData.username,
        password: formData.password
      })
      setResult({
        type: 'success',
        message: 'Login successful!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Login failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testGetProfile = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getProfile()
      setResult({
        type: 'success',
        message: 'Profile retrieved successfully!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get profile failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testUpdateProfile = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await updateProfile({
        email: formData.email,
        first_name: 'Updated',
        last_name: 'User'
      })
      setResult({
        type: 'success',
        message: 'Profile updated successfully!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Update profile failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testLogout = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await logoutUser()
      setResult({
        type: 'success',
        message: 'Logout successful!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Logout failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">User Service Functions Test</h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-4">
          Test the user service functions from <code>src/services/users.js</code>
        </p>

        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button 
            variant="primary" 
            onClick={testRegister}
            disabled={loading}
          >
            Test Register
          </Button>
          <Button 
            variant="success" 
            onClick={testLogin}
            disabled={loading}
          >
            Test Login
          </Button>
          <Button 
            variant="info" 
            onClick={testGetProfile}
            disabled={loading}
          >
            Test Get Profile
          </Button>
          <Button 
            variant="warning" 
            onClick={testUpdateProfile}
            disabled={loading}
          >
            Test Update Profile
          </Button>
          <Button 
            variant="secondary" 
            onClick={testLogout}
            disabled={loading}
          >
            Test Logout
          </Button>
        </div>

        {loading && (
          <Alert variant="info">
            Testing API call...
          </Alert>
        )}

        {result && (
          <Alert variant={result.type}>
            <strong>{result.message}</strong>
            {result.data && (
              <pre className="mt-2 mb-0" style={{ fontSize: '0.8em' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </Alert>
        )}
      </Card.Body>
    </Card>
  )
}

export default UserServiceExample
