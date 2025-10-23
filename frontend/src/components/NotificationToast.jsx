import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const NotificationToast = ({ message, type = 'success', show, onClose }) => {
  useEffect(() => {
    if (show) {
      // Success messages stay longer to let users read them
      const duration = type === 'success' ? 4000 : 3000;
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, type]);

  const getVariant = () => {
    switch (type) {
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'success';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast 
        show={show} 
        onClose={onClose} 
        bg={getVariant()}
        text={type === 'success' || type === 'error' ? 'white' : 'dark'}
      >
        <Toast.Body className="d-flex align-items-center">
          <span className="me-2">{getIcon()}</span>
          {message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default NotificationToast;