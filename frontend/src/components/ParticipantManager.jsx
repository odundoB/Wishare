import React, { useState } from 'react';
import { Card, Button, Badge, Modal, ListGroup, Alert } from 'react-bootstrap';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const ParticipantManager = ({ room }) => {
  const { removeParticipant } = useChat();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isHost = user && room.host.id === user.id;
  const allParticipants = [room.host, ...room.participants];

  const handleRemoveClick = (participant) => {
    setSelectedParticipant(participant);
    setShowModal(true);
  };

  const confirmRemove = async () => {
    if (!selectedParticipant) return;
    
    setLoading(true);
    try {
      await removeParticipant(room.id, selectedParticipant.id);
      setShowModal(false);
      setSelectedParticipant(null);
    } catch (error) {
      setError('Failed to remove participant');
    }
    setLoading(false);
  };

  return (
    <>
      <Card className="mt-3">
        <Card.Header>
          <strong>Participants ({allParticipants.length})</strong>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <ListGroup variant="flush">
            {allParticipants.map(participant => (
              <ListGroup.Item key={participant.id} className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div>
                    <strong>{participant.username}</strong>
                    {participant.id === room.host.id && (
                      <Badge bg="warning" text="dark" className="ms-2">
                        👑 Host
                      </Badge>
                    )}
                    {participant.id === user.id && (
                      <Badge bg="info" className="ms-2">
                        You
                      </Badge>
                    )}
                    <div className="small text-muted">
                      {participant.role === 'student' ? '🎓' : '👨‍🏫'} {participant.role}
                    </div>
                  </div>
                </div>
                
                {isHost && participant.id !== room.host.id && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleRemoveClick(participant)}
                  >
                    Remove
                  </Button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Remove Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Remove Participant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove <strong>{selectedParticipant?.username}</strong> from this room?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmRemove}
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ParticipantManager;