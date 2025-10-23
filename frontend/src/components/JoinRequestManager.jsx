import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import chatAPI from '../services/chat';

const JoinRequestManager = ({ room }) => {
  const { approveJoinRequest, denyJoinRequest } = useChat();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Note: This would need a dedicated API endpoint in the backend
  // For now, we'll simulate with the room's join_requests field
  useEffect(() => {
    // In a real implementation, you'd fetch pending requests from the backend
    // GET /api/chat/{room_id}/join-requests/
    // For now, we'll show this as a placeholder
  }, [room.id]);

  const handleApprove = async (requestId) => {
    setLoading(true);
    try {
      await approveJoinRequest(room.id, requestId);
      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      setError('Failed to approve request');
    }
    setLoading(false);
  };

  const handleDeny = async (requestId) => {
    setLoading(true);
    try {
      await denyJoinRequest(room.id, requestId);
      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      setError('Failed to deny request');
    }
    setLoading(false);
  };

  // Only show for room hosts
  if (!user || room.host.id !== user.id) {
    return null;
  }

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <strong>Join Requests</strong>
        {requests.length > 0 && (
          <Badge bg="warning">{requests.length} pending</Badge>
        )}
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {requests.length === 0 ? (
          <p className="text-muted text-center">No pending join requests</p>
        ) : (
          <ListGroup variant="flush">
            {requests.map(request => (
              <ListGroup.Item key={request.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{request.requester.username}</strong>
                  <div className="small text-muted">
                    {request.requester.role === 'student' ? '🎓' : '👨‍🏫'} {request.requester.role}
                  </div>
                  <div className="small text-muted">
                    Requested: {new Date(request.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="success"
                    className="me-2"
                    onClick={() => handleApprove(request.id)}
                    disabled={loading}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeny(request.id)}
                    disabled={loading}
                  >
                    Deny
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default JoinRequestManager;