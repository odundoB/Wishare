// Authentication monitoring script
import { tokenManager } from '../utils/tokenManager'

// Function to monitor authentication state
export const authMonitor = {
  // Start monitoring authentication state
  start: (intervalMs = 5000) => {
    console.log('🔍 Starting authentication monitoring...');
    
    const monitor = setInterval(() => {
      const tokensInfo = tokenManager.getTokensInfo()
      const isValid = tokenManager.areTokensValid()
      
      console.log('🔍 Auth Monitor:', {
        timestamp: new Date().toLocaleTimeString(),
        isValid,
        hasAccess: tokensInfo.hasAccess,
        hasRefresh: tokensInfo.hasRefresh,
        accessExpired: tokensInfo.accessExpired,
        refreshExpired: tokensInfo.refreshExpired,
        accessExpiresIn: tokensInfo.accessExpiration ? 
          Math.round((tokensInfo.accessExpiration - new Date()) / 1000 / 60) + ' minutes' : 'N/A',
        refreshExpiresIn: tokensInfo.refreshExpiration ? 
          Math.round((tokensInfo.refreshExpiration - new Date()) / 1000 / 60 / 60) + ' hours' : 'N/A'
      })
    }, intervalMs)
    
    return monitor
  },
  
  // Stop monitoring
  stop: (monitor) => {
    if (monitor) {
      clearInterval(monitor)
      console.log('🔍 Stopped authentication monitoring');
    }
  },
  
  // Get current status
  getStatus: () => {
    return {
      ...tokenManager.getTokensInfo(),
      areValid: tokenManager.areTokensValid()
    }
  }
}

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.authMonitor = authMonitor
  window.tokenManager = tokenManager
}