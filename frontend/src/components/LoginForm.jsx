import React, { useState } from 'react'
import { Form, Button, Alert, Card, Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/users'

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call loginUser from users.js service
      const response = await loginUser(formData)
      
      // Check if login was successful
      if (response.data && response.data.access) {
        // Store auth token in localStorage
        localStorage.setItem('access_token', response.data.access)
        
        // Store refresh token if available
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh)
        }
        
        // Redirect to dashboard on success
        navigate('/dashboard')
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } catch (error) {
      // Handle login failure
      console.error('Login error:', error)
      
      // Extract error message from response
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please try again.'
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">Login</h2>
                <p className="text-muted">Welcome back to Wiobiero Share</p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="danger" className="mb-3">
                  <Alert.Heading className="h6">Login Failed</Alert.Heading>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="username">Username</Form.Label>
                  <Form.Control
                    id="username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Enter your username"
                    disabled={loading}
                    className={error ? 'is-invalid' : ''}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label htmlFor="password">Password</Form.Label>
                  <Form.Control
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    disabled={loading}
                    className={error ? 'is-invalid' : ''}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 mb-3"
                  disabled={loading || !formData.username || !formData.password}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </Form>

              {/* Additional Links */}
              <div className="text-center">
                <p className="mb-0 text-muted">
                  Don't have an account?{' '}
                  <a href="/register" className="text-primary text-decoration-none">
                    Sign up here
                  </a>
                </p>
                <p className="mb-0 mt-2">
                  <a href="/forgot-password" className="text-muted text-decoration-none small">
                    Forgot your password?
                  </a>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default LoginForm
