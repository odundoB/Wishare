import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { registerUser, loginUser, logoutUser, getProfile, updateProfile } from '../services/users'

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

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          // Verify token is still valid
          await authAPI.verify(token)
          
          // Get user profile
          const response = await getProfile()
          setUser(response.data)
          setIsAuthenticated(true)
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setUser(null)
          setIsAuthenticated(false)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { access, refresh } = response.data
      
      // Store tokens
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Get user profile
      const profileResponse = await getProfile()
      setUser(profileResponse.data)
      setIsAuthenticated(true)
      
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
      // Clear tokens and user data
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setIsAuthenticated(false)
    }
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
    updateProfile: updateUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
