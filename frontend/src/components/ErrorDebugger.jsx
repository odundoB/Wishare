import React, { useState, useEffect } from 'react';
import { Container, Alert, Button, Spinner, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

const ErrorDebugger = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);
  
  // Try to access auth and chat contexts
  let authContext = null;
  let chatContext = null;
  let authError = null;
  let chatError = null;

  try {
    authContext = useAuth();
  } catch (error) {
    authError = error.message;
  }

  try {
    chatContext = useChat();
  } catch (error) {
    chatError = error.message;
  }

  const runTests = async () => {
    setTesting(true);
    const results = {};

    // Test 1: Auth Context
    results.authContext = {
      status: authError ? 'ERROR' : 'OK',
      error: authError,
      user: authContext?.user?.username || 'None',
      token: authContext?.token ? 'Present' : 'Missing',
      loading: authContext?.loading
    };

    // Test 2: Chat Context  
    results.chatContext = {
      status: chatError ? 'ERROR' : 'OK',
      error: chatError,
      rooms: chatContext?.rooms?.length || 0,
      loading: chatContext?.loading,
      hasError: !!chatContext?.error
    };

    // Test 3: Direct API call
    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'teacher', password: 'testpass123' })
      });
      
      if (response.ok) {
        const data = await response.json();
        results.directAPI = {
          status: 'OK',
          tokenLength: data.access?.length || 0
        };

        // Test rooms with this token
        const roomsResponse = await fetch('http://localhost:8000/api/chat/', {
          headers: { 'Authorization': `Bearer ${data.access}` }
        });
        
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          results.directRooms = {
            status: 'OK',
            count: roomsData.results?.length || roomsData.length || 0,
            format: roomsData.results ? 'paginated' : 'direct'
          };
        } else {
          results.directRooms = {
            status: 'ERROR',
            error: `HTTP ${roomsResponse.status}`
          };
        }
      } else {
        results.directAPI = {
          status: 'ERROR',
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      results.directAPI = {
        status: 'ERROR',
        error: error.message
      };
    }

    setTestResults(results);
    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <Container className="py-4">
      <h2>🔧 Error Debugger</h2>
      
      {testing && (
        <div className="text-center mb-4">
          <Spinner animation="border" />
          <p>Running diagnostic tests...</p>
        </div>
      )}

      {Object.keys(testResults).length > 0 && (
        <div>
          <Alert variant={testResults.authContext?.status === 'OK' ? 'success' : 'danger'}>
            <strong>Auth Context Test:</strong>
            <ul className="mb-0">
              <li>Status: {testResults.authContext?.status}</li>
              <li>User: {testResults.authContext?.user}</li>
              <li>Token: {testResults.authContext?.token}</li>
              <li>Loading: {String(testResults.authContext?.loading)}</li>
              {testResults.authContext?.error && <li>Error: {testResults.authContext.error}</li>}
            </ul>
          </Alert>

          <Alert variant={testResults.chatContext?.status === 'OK' ? 'success' : 'danger'}>
            <strong>Chat Context Test:</strong>
            <ul className="mb-0">
              <li>Status: {testResults.chatContext?.status}</li>
              <li>Rooms: {testResults.chatContext?.rooms}</li>
              <li>Loading: {String(testResults.chatContext?.loading)}</li>
              <li>Has Error: {String(testResults.chatContext?.hasError)}</li>
              {testResults.chatContext?.error && <li>Error: {testResults.chatContext.error}</li>}
            </ul>
          </Alert>

          <Alert variant={testResults.directAPI?.status === 'OK' ? 'success' : 'danger'}>
            <strong>Direct API Test:</strong>
            <ul className="mb-0">
              <li>Status: {testResults.directAPI?.status}</li>
              {testResults.directAPI?.tokenLength && <li>Token Length: {testResults.directAPI.tokenLength}</li>}
              {testResults.directAPI?.error && <li>Error: {testResults.directAPI.error}</li>}
            </ul>
          </Alert>

          {testResults.directRooms && (
            <Alert variant={testResults.directRooms?.status === 'OK' ? 'success' : 'danger'}>
              <strong>Direct Rooms Test:</strong>
              <ul className="mb-0">
                <li>Status: {testResults.directRooms?.status}</li>
                <li>Room Count: {testResults.directRooms?.count}</li>
                <li>Format: {testResults.directRooms?.format}</li>
                {testResults.directRooms?.error && <li>Error: {testResults.directRooms.error}</li>}
              </ul>
            </Alert>
          )}

          <Card className="mt-4">
            <Card.Header>Diagnosis</Card.Header>
            <Card.Body>
              {testResults.directAPI?.status === 'OK' && testResults.directRooms?.count > 0 ? (
                <Alert variant="success">
                  ✅ <strong>Backend is working!</strong> {testResults.directRooms.count} rooms available.
                  The issue is likely in the frontend context or component rendering.
                </Alert>
              ) : (
                <Alert variant="danger">
                  ❌ <strong>Backend issue detected!</strong> Check server connection and authentication.
                </Alert>
              )}

              {testResults.authContext?.status === 'ERROR' && (
                <Alert variant="warning">
                  ⚠️ <strong>Auth Context Error:</strong> Authentication provider may not be working properly.
                </Alert>
              )}

              {testResults.chatContext?.status === 'ERROR' && (
                <Alert variant="warning">
                  ⚠️ <strong>Chat Context Error:</strong> Chat provider may have issues.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      <Button onClick={runTests} disabled={testing} className="mt-3">
        🔄 Run Tests Again
      </Button>
    </Container>
  );
};

export default ErrorDebugger;