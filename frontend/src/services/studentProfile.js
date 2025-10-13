import api from './api'

/**
 * Student Profile Service
 * Handles all student profile related API calls
 */

/**
 * Get current student's profile
 * @returns {Promise} Axios promise
 */
export const getStudentProfile = () => {
  return api.get('/users/student-profile/')
}

/**
 * Update current student's profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise} Axios promise
 */
export const updateStudentProfile = (profileData) => {
  return api.put('/users/student-profile/update/', profileData)
}

/**
 * Upload profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise} Axios promise
 */
export const uploadProfilePicture = (file) => {
  const formData = new FormData()
  formData.append('profile_picture', file)
  
  return api.put('/users/student-profile/update/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * Get profile picture URL
 * @param {string} profilePicturePath - Path to profile picture
 * @returns {string} Full URL to profile picture
 */
export const getProfilePictureUrl = (profilePicturePath) => {
  if (!profilePicturePath) return null
  
  // If it's already a full URL, return as is
  if (profilePicturePath.startsWith('http')) {
    return profilePicturePath
  }
  
  // Otherwise, construct the full URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  return `${baseUrl.replace('/api', '')}${profilePicturePath}`
}

/**
 * Validate profile data
 * @param {Object} data - Profile data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateProfileData = (data) => {
  const errors = {}
  
  // Required fields validation
  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters long'
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  if (!data.username || data.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters long'
  }
  
  
  if (!data.year_of_study || data.year_of_study < 1 || data.year_of_study > 6) {
    errors.year_of_study = 'Please select a valid year of study (1-6)'
  }
  
  // Optional fields validation
  if (data.bio && data.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters'
  }
  
  if (data.contact && !/^[\+]?[1-9][\d]{0,15}$/.test(data.contact.replace(/\s/g, ''))) {
    errors.contact = 'Please enter a valid contact number'
  }
  
  if (data.date_of_birth) {
    const birthDate = new Date(data.date_of_birth)
    const today = new Date()
    
    if (birthDate > today) {
      errors.date_of_birth = 'Date of birth cannot be in the future'
    }
    
    const age = today.getFullYear() - birthDate.getFullYear()
    if (age < 16 || age > 100) {
      errors.date_of_birth = 'Please enter a valid date of birth'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Format profile data for display
 * @param {Object} profile - Profile data
 * @returns {Object} Formatted profile data
 */
export const formatProfileForDisplay = (profile) => {
  return {
    ...profile,
    profile_picture_url: getProfilePictureUrl(profile.profile_picture),
    date_of_birth_display: profile.date_of_birth 
      ? new Date(profile.date_of_birth).toLocaleDateString()
      : '',
    year_display: profile.year_display || `Year ${profile.year_of_study}`,
    gender_display: profile.gender_display || profile.gender || 'Not specified'
  }
}

/**
 * Get gender options for form
 * @returns {Array} Array of gender options
 */
export const getGenderOptions = () => [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

/**
 * Get year of study options for form
 * @returns {Array} Array of year options
 */
export const getYearOptions = () => [
  { value: '', label: 'Select Year' },
  { value: 1, label: 'First Year' },
  { value: 2, label: 'Second Year' },
  { value: 3, label: 'Third Year' },
  { value: 4, label: 'Fourth Year' },
  { value: 5, label: 'Fifth Year' },
  { value: 6, label: 'Sixth Year' }
]

