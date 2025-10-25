import api from './api'

/**
 * Resource service functions for file management and resource operations
 * All functions use the configured 'api' instance from api.js
 */

/**
 * Upload a new resource file
 * @param {FormData|Object} data - Resource data (FormData for file uploads)
 * @param {Object} options - Upload options
 * @param {Function} options.onProgress - Progress callback function
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise} Axios promise
 */
export const uploadResource = (data, options = {}) => {
  // If data is not FormData, convert it to FormData for file upload
  let formData
  if (data instanceof FormData) {
    formData = data
  } else {
    formData = new FormData()
    
    // Append all fields to FormData
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
  }

  // Check file size before upload
  const file = formData.get('file')
  if (file && file.size > 50 * 1024 * 1024) { // 50MB limit
    return Promise.reject(new Error('File size exceeds 50MB limit'))
  }

  return api.post('/resources/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for large files
    onUploadProgress: (progressEvent) => {
      if (options.onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        options.onProgress(percentCompleted)
      }
    },
    signal: options.signal, // For upload cancellation
  })
}

/**
 * Get all resources with optional filtering and pagination
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.subject - Filter by subject
 * @param {string} params.resource_type - Filter by resource type
 * @param {string} params.grade_level - Filter by grade level
 * @param {boolean} params.is_public - Filter by public status
 * @param {string} params.ordering - Order by field (e.g., '-created_at', 'title')
 * @returns {Promise} Axios promise
 */
export const getResources = (params = {}) => {
  return api.get('/resources/', { params })
}

/**
 * Get a specific resource by ID
 * @param {number|string} id - Resource ID
 * @returns {Promise} Axios promise
 */
export const getResource = (id) => {
  return api.get(`/resources/${id}/`)
}

/**
 * Update an existing resource
 * @param {number|string} id - Resource ID
 * @param {FormData|Object} data - Updated resource data
 * @returns {Promise} Axios promise
 */
export const updateResource = (id, data) => {
  // If data is not FormData, convert it to FormData for file upload
  let formData
  if (data instanceof FormData) {
    formData = data
  } else {
    formData = new FormData()
    
    // Append all fields to FormData
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
  }

  return api.put(`/resources/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * Delete a resource
 * @param {number|string} id - Resource ID
 * @returns {Promise} Axios promise
 */
export const deleteResource = (id) => {
  return api.delete(`/resources/${id}/`)
}

/**
 * Search resources by query
 * @param {string} query - Search query
 * @param {Object} params - Additional search parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.subject - Filter by subject
 * @param {string} params.resource_type - Filter by resource type
 * @returns {Promise} Axios promise
 */
export const searchResources = (query, params = {}) => {
  return api.get('/resources/search/', {
    params: {
      q: query,
      ...params
    }
  })
}

/**
 * Download a resource file
 * @param {number|string} id - Resource ID
 * @returns {Promise} Axios promise (returns blob data)
 */
export const downloadResource = async (id) => {
  try {
    const response = await api.get(`/resources/${id}/download/`, {
      responseType: 'blob'
    })
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers['content-disposition']
    let filename = 'resource'
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }
    
    // Ensure filename has proper extension if not already present
    if (!filename.includes('.')) {
      // Try to get extension from Content-Type header
      const contentType = response.headers['content-type']
      if (contentType) {
        const extensionMap = {
          'application/pdf': '.pdf',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
          'application/vnd.ms-powerpoint': '.ppt',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
          'text/plain': '.txt',
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'video/mp4': '.mp4',
          'audio/mpeg': '.mp3',
          'audio/wav': '.wav',
          'application/zip': '.zip',
          'application/x-rar-compressed': '.rar'
        }
        
        const extension = extensionMap[contentType]
        if (extension) {
          filename += extension
        }
      }
    }
    
    // Create temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(url)
    
    return response
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

/**
 * Get resource statistics
 * @returns {Promise} Axios promise
 */
export const getResourceStats = () => {
  return api.get('/resources/stats/')
}

/**
 * Get resources by uploader
 * @param {number|string} userId - User ID
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise} Axios promise
 */
export const getResourcesByUser = (userId, params = {}) => {
  return api.get(`/resources/user/${userId}/`, { params })
}

/**
 * Toggle resource public status
 * @param {number|string} id - Resource ID
 * @param {boolean} isPublic - Public status
 * @returns {Promise} Axios promise
 */
export const toggleResourcePublic = (id, isPublic) => {
  return api.patch(`/resources/${id}/toggle-public/`, {
    is_public: isPublic
  })
}
