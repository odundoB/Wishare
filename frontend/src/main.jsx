import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

// Suppress non-critical browser extension errors in development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' && (
        message.includes('runtime.lastError') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Could not establish connection') ||
        message.includes('Download the React DevTools')
      )
    ) {
      // Suppress these common development warnings
      return;
    }
    originalError.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
