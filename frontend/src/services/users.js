import api from './api'

/**
 * User service functions for authentication and profile management
 * All functions use the configured 'api' instance from api.js
 */

/**
 * Register a new user
 * @param {Object} data - User registration data
 * @param {string} data.username - Username
 * @param {string} data.email - Email address
 * @param {string} data.password - Password
 * @param {string} data.role - User role (student/teacher)
 * @returns {Promise} Axios promise
 */
export const registerUser = (data) => {
  return api.post('/users/register/', data)
}

/**
 * Login user with credentials
 * @param {Object} data - Login credentials
 * @param {string} data.username - Username
 * @param {string} data.password - Password
 * @returns {Promise} Axios promise
 */
export const loginUser = (data) => {
  return api.post('/users/login/', data)
}

/**
 * Logout current user
 * @returns {Promise} Axios promise
 */
export const logoutUser = () => {
  const refreshToken = localStorage.getItem('refresh_token')
  return api.post('/users/logout/', {
    refresh_token: refreshToken
  })
}

/**
 * Get current user profile
 * @returns {Promise} Axios promise
 */
export const getProfile = () => {
  return api.get('/users/profile/')
}

/**
 * Update current user profile
 * @param {Object} data - Profile update data
 * @returns {Promise} Axios promise
 */
export const updateProfile = (data) => {
  return api.put('/users/profile/update/', data)
}

/**
 * Update user profile (alias for updateProfile)
 * @param {Object} data - Profile update data
 * @returns {Promise} Axios promise
 */
export const updateUserProfile = (data) => {
  return api.put('/users/profile/update/', data)
}

/**
 * Change user password
 * @param {Object} data - Password change data
 * @param {string} data.current_password - Current password
 * @param {string} data.new_password - New password
 * @returns {Promise} Axios promise
 */
export const changePassword = (data) => {
  return api.post('/users/change-password/', data)
}

/**
 * Upload profile photo
 * @param {FormData} formData - FormData containing the photo file
 * @returns {Promise} Axios promise
 */
export const uploadProfilePhoto = (formData) => {
  return api.post('/users/profile/photo/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Delete profile photo
 * @returns {Promise} Axios promise
 */
export const deleteProfilePhoto = () => {
  return api.delete('/users/profile/photo/')
}
