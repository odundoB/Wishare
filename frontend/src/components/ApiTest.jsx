import React, { useState } from 'react'
import { Button, Alert, Card } from 'react-bootstrap'
import { authAPI } from '../services/api'

const ApiTest = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testApiConnection = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Test basic API connectivity
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'test',
          password: 'test'
        })
      })

      if (response.ok) {
        setResult({
          type: 'success',
          message: 'API connection successful! Backend is running and accessible.'
        })
      } else {
        setResult({
          type: 'warning',
          message: `API responded with status ${response.status}. Backend is running but credentials are invalid (expected).`
        })
      }
    } catch (error) {
      setResult({
        type: 'danger',
  message: `API connection failed: ${error.message}. Make sure the Django backend is running on http://localhost:8000`
      })
    }

    setLoading(false)
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">API Connection Test</h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted">
          Test the connection to the Django backend API.
        </p>
        <Button 
          variant="primary" 
          onClick={testApiConnection}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </Button>
        
        {result && (
          <Alert variant={result.type} className="mt-3">
            {result.message}
          </Alert>
        )}
        
        <div className="mt-3">
          <small className="text-muted">
            <strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL}
          </small>
        </div>
      </Card.Body>
    </Card>
  )
}

export default ApiTest
