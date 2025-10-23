import axios from 'axios'
import { tokenManager } from '../utils/tokenManager'

// Create reusable axios instance with automatic backend connection
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor that automatically attaches token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Don't try to refresh token for the refresh endpoint itself to prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/token/refresh/')) {
      originalRequest._retry = true

      // Check if we have valid refresh token before attempting refresh
      const refreshToken = localStorage.getItem('refresh_token')
      const tokensInfo = tokenManager.getTokensInfo()
      
      console.log('🔄 401 Error - Token refresh attempt:', tokensInfo)
      
      if (refreshToken && !tokensInfo.refreshExpired) {
        try {
          // Create a new axios instance to avoid interceptor loops
          const refreshResponse = await axios.post('http://localhost:8000/api/token/refresh/', {
            refresh: refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            }
          })

          const { access, refresh: newRefresh } = refreshResponse.data
          localStorage.setItem('access_token', access)
          
          // Update refresh token if a new one was provided (token rotation)
          if (newRefresh) {
            localStorage.setItem('refresh_token', newRefresh)
            console.log('🔄 Tokens refreshed successfully with rotation')
          } else {
            console.log('🔄 Access token refreshed successfully')
          }
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
          
        } catch (refreshError) {
          console.log('❌ Token refresh failed:', refreshError.response?.status, refreshError.response?.data)
          
          // Clear invalid tokens
          tokenManager.clearTokens()
          
          // Only redirect if we're not already on the login page
          if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            console.log('🔀 Redirecting to login due to refresh failure')
            window.location.href = '/'
          }
          
          return Promise.reject(refreshError)
        }
      } else {
        console.log('❌ No valid refresh token available:', {
          hasRefresh: !!refreshToken,
          refreshExpired: tokensInfo.refreshExpired
        })
        
        // Clear invalid tokens
        tokenManager.clearTokens()
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          console.log('🔀 Redirecting to login due to invalid refresh token')
          window.location.href = '/'
        }
        
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/token/', credentials),
  refresh: (refreshToken) => api.post('/token/refresh/', { refresh: refreshToken }),
  verify: (token) => api.post('/token/verify/', { token }),
}

export const userAPI = {
  register: (userData) => api.post('/users/register/', userData),
  login: (credentials) => api.post('/users/login/', credentials),
  logout: () => api.post('/users/logout/'),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (userData) => api.put('/users/profile/', userData),
  getUsers: () => api.get('/users/'),
  getUser: (id) => api.get(`/users/${id}/`),
  updateUser: (id, userData) => api.put(`/users/${id}/`, userData),
  deleteUser: (id) => api.delete(`/users/${id}/`),
}

export const resourceAPI = {
  getResources: (params) => api.get('/resources/', { params }),
  getResource: (id) => api.get(`/resources/${id}/`),
  createResource: (formData) => api.post('/resources/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateResource: (id, formData) => api.put(`/resources/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteResource: (id) => api.delete(`/resources/${id}/`),
  downloadResource: (id) => api.get(`/resources/${id}/download/`, {
    responseType: 'blob'
  }),
  searchResources: (query) => api.get('/resources/search/', { params: { q: query } }),
}

export const eventAPI = {
  getEvents: (params) => api.get('/events/', { params }),
  getEvent: (id) => api.get(`/events/${id}/`),
  createEvent: (eventData) => api.post('/events/', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}/`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}/`),
  getUpcomingEvents: () => api.get('/events/upcoming/'),
  getPastEvents: () => api.get('/events/past/'),
}


export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications/', { params }),
  getNotification: (id) => api.get(`/notifications/${id}/`),
  updateNotification: (id, data) => api.patch(`/notifications/${id}/`, data),
  deleteNotification: (id) => api.delete(`/notifications/${id}/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
  bulkUpdate: (data) => api.post('/notifications/bulk-update/', data),
  bulkDelete: (data) => api.post('/notifications/bulk-delete/', data),
  getStats: () => api.get('/notifications/stats/'),
  searchNotifications: (query) => api.get('/notifications/search/', { params: { q: query } }),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
}

export const searchAPI = {
  globalSearch: (query, params) => api.get('/search/', { 
    params: { q: query, ...params } 
  }),
}

export default api
