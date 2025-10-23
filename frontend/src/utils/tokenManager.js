// Token management utilities
import { jwtDecode } from 'jwt-decode'

export const tokenManager = {
  // Check if token is expired
  isTokenExpired: (token) => {
    if (!token) return true
    
    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000
      return decoded.exp < currentTime
    } catch (error) {
      console.error('Error decoding token:', error)
      return true
    }
  },

  // Check if token expires within the next X minutes
  isTokenExpiringSoon: (token, minutesThreshold = 5) => {
    if (!token) return true
    
    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000
      const threshold = minutesThreshold * 60
      return decoded.exp - currentTime < threshold
    } catch (error) {
      console.error('Error decoding token:', error)
      return true
    }
  },

  // Get token expiration time
  getTokenExpiration: (token) => {
    if (!token) return null
    
    try {
      const decoded = jwtDecode(token)
      return new Date(decoded.exp * 1000)
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  },

  // Clear all tokens from localStorage
  clearTokens: () => {
    console.log('🧹 Clearing all tokens from localStorage')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  // Check if both tokens are valid
  areTokensValid: () => {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (!accessToken || !refreshToken) {
      console.log('🔍 Missing tokens - access:', !!accessToken, 'refresh:', !!refreshToken)
      return false
    }

    const accessExpired = tokenManager.isTokenExpired(accessToken)
    const refreshExpired = tokenManager.isTokenExpired(refreshToken)
    
    console.log('🔍 Token status - access expired:', accessExpired, 'refresh expired:', refreshExpired)
    
    // If refresh token is expired, both are invalid
    return !refreshExpired
  },

  // Get current tokens info for debugging
  getTokensInfo: () => {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    
    return {
      hasAccess: !!accessToken,
      hasRefresh: !!refreshToken,
      accessExpired: accessToken ? tokenManager.isTokenExpired(accessToken) : null,
      refreshExpired: refreshToken ? tokenManager.isTokenExpired(refreshToken) : null,
      accessExpiration: accessToken ? tokenManager.getTokenExpiration(accessToken) : null,
      refreshExpiration: refreshToken ? tokenManager.getTokenExpiration(refreshToken) : null,
    }
  }
}