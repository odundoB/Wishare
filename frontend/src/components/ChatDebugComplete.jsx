import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tokenManager } from '../utils/tokenManager';
import chatAPI from '../services/chat';

const ChatDebugComplete = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [chatData, setChatData] = useState(null);
  const [chatError, setChatError] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const updateDebugInfo = () => {
      const tokensInfo = tokenManager.getTokensInfo();
      setDebugInfo({
        timestamp: new Date().toLocaleTimeString(),
        authLoading,
        isAuthenticated,
        user: user ? {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        } : null,
        tokens: tokensInfo
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [user, authLoading, isAuthenticated]);

  const testChatAPI = async () => {
    setChatLoading(true);
    setChatError(null);
    setChatData(null);

    try {
      console.log('🧪 Testing chat API...');
      const response = await chatAPI.getRooms();
      console.log('✅ Chat API response:', response);
      setChatData(response.data);
    } catch (error) {
      console.error('❌ Chat API error:', error);
      setChatError({
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } finally {
      setChatLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading authentication... (Auth Loading = {String(authLoading)})</p>
          <small>Timestamp: {new Date().toLocaleTimeString()}</small>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/chat" replace />;
  }

  // Show error if user data is not available
  if (!user) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <Container>
          <Alert variant="warning" className="text-center">
            <Alert.Heading>Authentication Error</Alert.Heading>
            <p>User authenticated but no user data available.</p>
            <p>isAuthenticated: {String(isAuthenticated)}</p>
            <p>user: {String(user)}</p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <h2>Chat Debug - Complete Information</h2>
          
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header">
                  <h5>Authentication Status</h5>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Timestamp:</strong> {debugInfo.timestamp}
                    </li>
                    <li className="list-group-item">
                      <strong>Auth Loading:</strong> {String(debugInfo.authLoading)}
                    </li>
                    <li className="list-group-item">
                      <strong>Is Authenticated:</strong> {String(debugInfo.isAuthenticated)}
                    </li>
                    <li className="list-group-item">
                      <strong>User ID:</strong> {debugInfo.user?.id || 'N/A'}
                    </li>
                    <li className="list-group-item">
                      <strong>Username:</strong> {debugInfo.user?.username || 'N/A'}
                    </li>
                    <li className="list-group-item">
                      <strong>Role:</strong> {debugInfo.user?.role || 'N/A'}
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="card mb-3">
                <div className="card-header">
                  <h5>Token Status</h5>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Has Access Token:</strong> {debugInfo.tokens?.hasAccess ? '✅' : '❌'}
                    </li>
                    <li className="list-group-item">
                      <strong>Has Refresh Token:</strong> {debugInfo.tokens?.hasRefresh ? '✅' : '❌'}
                    </li>
                    <li className="list-group-item">
                      <strong>Access Expired:</strong> {
                        debugInfo.tokens?.accessExpired === null ? 'N/A' : 
                        debugInfo.tokens?.accessExpired ? '❌ Yes' : '✅ No'
                      }
                    </li>
                    <li className="list-group-item">
                      <strong>Refresh Expired:</strong> {
                        debugInfo.tokens?.refreshExpired === null ? 'N/A' : 
                        debugInfo.tokens?.refreshExpired ? '❌ Yes' : '✅ No'
                      }
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>Chat API Test</h5>
                  <Button 
                    variant="primary" 
                    onClick={testChatAPI}
                    disabled={chatLoading}
                  >
                    {chatLoading ? 'Testing...' : 'Test Chat API'}
                  </Button>
                </div>
                <div className="card-body">
                  {chatLoading && (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Testing chat API...
                    </div>
                  )}
                  
                  {chatError && (
                    <Alert variant="danger">
                      <strong>Chat API Error:</strong>
                      <pre style={{ fontSize: '0.9em', marginTop: '10px' }}>
                        {JSON.stringify(chatError, null, 2)}
                      </pre>
                    </Alert>
                  )}
                  
                  {chatData && (
                    <Alert variant="success">
                      <strong>Chat API Success:</strong>
                      <p>Found {chatData.results?.length || 0} rooms</p>
                      <details>
                        <summary>Full Response</summary>
                        <pre style={{ fontSize: '0.8em', marginTop: '10px' }}>
                          {JSON.stringify(chatData, null, 2)}
                        </pre>
                      </details>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5>Raw Debug Data</h5>
                </div>
                <div className="card-body">
                  <pre style={{ fontSize: '0.8em', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatDebugComplete;