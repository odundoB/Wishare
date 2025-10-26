import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, userAPI } from '../services/api'
import { registerUser, loginUser, logoutUser, getProfile, updateProfile } from '../services/users'
import { tokenManager } from '../utils/tokenManager'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState(null)

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 AuthContext - Starting authentication check...');
      
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('🔐 AuthContext - Timeout reached, setting loading to false');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        // Simple token check
        const accessToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        
        if (!accessToken || !refreshToken) {
          console.log('🔐 AuthContext - No tokens found');
          setUser(null)
          setIsAuthenticated(false)
          setToken(null)
          return
        }
        
        console.log('🔐 AuthContext - Getting profile...');
        // Get user profile (this might trigger token refresh if needed)
        const response = await getProfile()
        console.log('🔐 AuthContext - Profile loaded:', response.data?.username);
        
        setUser(response.data)
        setIsAuthenticated(true)
        setToken(accessToken)
        
      } catch (error) {
        console.log('🔐 AuthContext - Auth failed:', error.message);
        // Clear invalid tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        setIsAuthenticated(false)
        setToken(null)
      } finally {
        clearTimeout(timeout);
        console.log('🔐 AuthContext - Setting loading to false');
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await userAPI.login(credentials)
      const { access, refresh } = response.data
      
      // Store tokens directly - simple approach
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Get user profile
      const profileResponse = await getProfile()
      
      setUser(profileResponse.data)
      setIsAuthenticated(true)
      setToken(access)
      
      return { success: true, data: profileResponse.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await registerUser(userData)
      return { success: true, data: response.data }
    } catch (error) {
      // Handle validation errors from Django REST Framework
      if (error.response?.data) {
        const errorData = error.response.data
        if (typeof errorData === 'object') {
          // Extract field-specific errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          return { 
            success: false, 
            error: fieldErrors || 'Registration failed'
          }
        } else {
          return { 
            success: false, 
            error: errorData || 'Registration failed'
          }
        }
      }
      
      return { 
        success: false, 
        error: error.message || 'Registration failed'
      }
    }
  }

  const logout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear tokens and user data - simple approach
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setIsAuthenticated(false)
      setToken(null)
    }
  }

  const forceLogout = () => {
    console.log('🔐 AuthContext - Force logout due to invalid tokens');
    // Clear tokens and user data immediately without API call - simple approach
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setIsAuthenticated(false)
    setToken(null)
  }

  const updateUserProfile = async (userData) => {
    try {
      const response = await updateProfile(userData)
      setUser(response.data)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Profile update failed' 
      }
    }
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    forceLogout,
    updateProfile: updateUserProfile,
    token, // Add token to the context value
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
