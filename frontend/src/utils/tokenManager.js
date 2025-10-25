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
  clearTokens: (userId = null) => {
    if (userId) {
      console.log(`🧹 Clearing tokens for user ${userId} from localStorage`)
      localStorage.removeItem(`access_token_${userId}`)
      localStorage.removeItem(`refresh_token_${userId}`)
      localStorage.removeItem(`current_user_id`)
    } else {
      console.log('🧹 Clearing all tokens from localStorage')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('current_user_id')
    }
  },

  // Check if both tokens are valid
  areTokensValid: (userId = null) => {
    const accessTokenKey = userId ? `access_token_${userId}` : 'access_token'
    const refreshTokenKey = userId ? `refresh_token_${userId}` : 'refresh_token'
    
    const accessToken = localStorage.getItem(accessTokenKey)
    const refreshToken = localStorage.getItem(refreshTokenKey)
    
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
  getTokensInfo: (userId = null) => {
    const accessTokenKey = userId ? `access_token_${userId}` : 'access_token'
    const refreshTokenKey = userId ? `refresh_token_${userId}` : 'refresh_token'
    
    const accessToken = localStorage.getItem(accessTokenKey)
    const refreshToken = localStorage.getItem(refreshTokenKey)
    
    return {
      hasAccess: !!accessToken,
      hasRefresh: !!refreshToken,
      accessExpired: accessToken ? tokenManager.isTokenExpired(accessToken) : null,
      refreshExpired: refreshToken ? tokenManager.isTokenExpired(refreshToken) : null,
      accessExpiration: accessToken ? tokenManager.getTokenExpiration(accessToken) : null,
      refreshExpiration: refreshToken ? tokenManager.getTokenExpiration(refreshToken) : null,
    }
  },

  // Get tokens for specific user or current user
  getTokens: (userId = null) => {
    const accessTokenKey = userId ? `access_token_${userId}` : 'access_token'
    const refreshTokenKey = userId ? `refresh_token_${userId}` : 'refresh_token'
    
    return {
      access: localStorage.getItem(accessTokenKey),
      refresh: localStorage.getItem(refreshTokenKey)
    }
  },

  // Set tokens for specific user
  setTokens: (accessToken, refreshToken, userId = null) => {
    if (userId) {
      localStorage.setItem(`access_token_${userId}`, accessToken)
      localStorage.setItem(`refresh_token_${userId}`, refreshToken)
      // Store user ID in sessionStorage (tab-specific) instead of localStorage (global)
      sessionStorage.setItem('current_user_id', userId)
    } else {
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
    }
  },

  // Get current active user ID (tab-specific)
  getCurrentUserId: () => {
    // Try sessionStorage first (tab-specific), fallback to localStorage for backward compatibility
    return sessionStorage.getItem('current_user_id') || localStorage.getItem('current_user_id')
  },

  // Clear current user ID (tab-specific)
  clearCurrentUserId: () => {
    sessionStorage.removeItem('current_user_id')
    // Also clear global one for cleanup
    localStorage.removeItem('current_user_id')
  },

  // Set current user ID for this tab only
  setCurrentUserId: (userId) => {
    sessionStorage.setItem('current_user_id', userId)
  }
}