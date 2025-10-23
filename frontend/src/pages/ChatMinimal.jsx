import React from 'react';
import { Container, Alert } from 'react-bootstrap';

const ChatMinimal = () => {
  console.log('🔍 ChatMinimal component rendered successfully');
  
  return (
    <Container className="py-4">
      <Alert variant="success">
        <Alert.Heading>✅ Chat Component Loading Test</Alert.Heading>
        <p>If you can see this message, React components are rendering properly.</p>
        <hr />
        <p className="mb-0">
          <strong>Time:</strong> {new Date().toLocaleTimeString()}<br />
          <strong>Component:</strong> ChatMinimal<br />
          <strong>Status:</strong> Successfully rendered
        </p>
      </Alert>
      
      <div className="mt-4">
        <h3>Next Steps:</h3>
        <ul>
          <li>✅ Frontend server is running</li>
          <li>✅ React components can render</li>
          <li>✅ Bootstrap styling is working</li>
          <li>❓ Test authentication flow</li>
          <li>❓ Test API connectivity</li>
        </ul>
      </div>
    </Container>
  );
};

export default ChatMinimal;