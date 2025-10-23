// Quick Browser Fix Script
// Copy and paste this into your browser's Developer Console (F12 -> Console tab)

console.log('🧹 Clearing browser cache and storage...');

// Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();

// Clear any cached service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// Suppress common development warnings for the rest of this session
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args[0];
  if (typeof message === 'string') {
    // Skip common non-critical warnings
    if (
      message.includes('runtime.lastError') ||
      message.includes('Receiving end does not exist') ||
      message.includes('Could not establish connection') ||
      message.includes('Download the React DevTools')
    ) {
      return; // Suppress these warnings
    }
  }
  originalConsoleError.apply(console, args);
};

// Suppress Chrome extension runtime errors specifically
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const originalLastError = chrome.runtime.lastError;
  Object.defineProperty(chrome.runtime, 'lastError', {
    get: function() {
      return undefined; // Always return undefined to suppress the warnings
    }
  });
}

console.log('✅ Cache cleared and warnings suppressed!');
console.log('🔄 Refreshing page in 2 seconds...');

// Refresh the page after a short delay
setTimeout(() => {
  window.location.reload();
}, 2000);