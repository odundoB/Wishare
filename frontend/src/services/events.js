import api from './api'

/**
 * Event service functions for event management and attendance
 * All functions use the configured 'api' instance from api.js
 */

/**
 * Create a new event
 * @param {Object} data - Event data
 * @param {string} data.title - Event title
 * @param {string} data.description - Event description
 * @param {string} data.location - Event location
 * @param {string} data.start_time - Event start time (ISO string)
 * @param {string} data.end_time - Event end time (ISO string)
 * @param {string} data.event_type - Type of event (class, meeting, workshop, exam, etc.)
 * @param {number} data.max_participants - Maximum number of participants (optional)
 * @param {boolean} data.is_public - Whether event is public (optional)
 * @param {string} data.requirements - Event requirements (optional)
 * @param {string} data.materials - Required materials (optional)
 * @returns {Promise} Axios promise
 */
export const createEvent = (data) => {
  return api.post('/events/', data)
}

/**
 * Get all events with optional filtering and pagination
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.event_type - Filter by event type
 * @param {string} params.location - Filter by location
 * @param {string} params.created_by - Filter by creator
 * @param {boolean} params.is_public - Filter by public status
 * @param {string} params.date_from - Filter events from this date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter events to this date (YYYY-MM-DD)
 * @param {string} params.status - Filter by status (upcoming, ongoing, past, cancelled)
 * @param {string} params.ordering - Order by field (e.g., '-start_time', 'start_time', 'title')
 * @returns {Promise} Axios promise
 */
export const getEvents = (params = {}) => {
  return api.get('/events/', { params })
}

/**
 * Get a specific event by ID
 * @param {number|string} id - Event ID
 * @returns {Promise} Axios promise
 */
export const getEvent = (id) => {
  return api.get(`/events/${id}/`)
}

/**
 * Update an existing event
 * @param {number|string} id - Event ID
 * @param {Object} data - Updated event data
 * @param {string} data.title - Event title
 * @param {string} data.description - Event description
 * @param {string} data.location - Event location
 * @param {string} data.start_time - Event start time (ISO string)
 * @param {string} data.end_time - Event end time (ISO string)
 * @param {string} data.event_type - Type of event
 * @param {number} data.max_participants - Maximum number of participants
 * @param {boolean} data.is_public - Whether event is public
 * @param {string} data.requirements - Event requirements
 * @param {string} data.materials - Required materials
 * @param {string} data.status - Event status (scheduled, ongoing, completed, cancelled)
 * @returns {Promise} Axios promise
 */
export const updateEvent = (id, data) => {
  return api.put(`/events/${id}/`, data)
}

/**
 * Delete an event
 * @param {number|string} id - Event ID
 * @returns {Promise} Axios promise
 */
export const deleteEvent = (id) => {
  return api.delete(`/events/${id}/`)
}

// Note: Registration endpoints are not implemented in the backend yet
// These functions are placeholders for future implementation

/**
 * Register for an event (simplified implementation)
 * @param {number|string} id - Event ID
 * @param {Object} data - Registration data (optional)
 * @returns {Promise} Axios promise
 */
export const registerEvent = (id, data = {}) => {
  // For now, simulate a successful registration
  return Promise.resolve({
    data: {
      message: 'Successfully registered for the event!',
      registration_count: Math.floor(Math.random() * 50) + 1
    }
  })
}

/**
 * Unregister from an event (simplified implementation)
 * @param {number|string} id - Event ID
 * @returns {Promise} Axios promise
 */
export const unregisterEvent = (id) => {
  // For now, simulate a successful unregistration
  return Promise.resolve({
    data: {
      message: 'Successfully unregistered from the event!',
      registration_count: Math.floor(Math.random() * 50)
    }
  })
}

/**
 * Get attendees for a specific event (placeholder - not implemented in backend)
 * @param {number|string} id - Event ID
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise} Axios promise
 */
export const getAttendees = (id, params = {}) => {
  return Promise.reject(new Error('Event attendees not implemented yet'))
}

/**
 * Get upcoming events
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.event_type - Filter by event type
 * @param {string} params.location - Filter by location
 * @returns {Promise} Axios promise
 */
export const getUpcomingEvents = (params = {}) => {
  return api.get('/events/upcoming/', { params })
}

/**
 * Get past events
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.event_type - Filter by event type
 * @param {string} params.location - Filter by location
 * @returns {Promise} Axios promise
 */
export const getPastEvents = (params = {}) => {
  return api.get('/events/past/', { params })
}

/**
 * Get ongoing events
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.event_type - Filter by event type
 * @param {string} params.location - Filter by location
 * @returns {Promise} Axios promise
 */
export const getOngoingEvents = (params = {}) => {
  return api.get('/events/ongoing/', { params })
}

/**
 * Get events created by current user
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.event_type - Filter by event type
 * @param {string} params.status - Filter by status
 * @returns {Promise} Axios promise
 */
export const getMyEvents = (params = {}) => {
  return api.get('/events/my/', { params })
}

/**
 * Get events user is registered for
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.event_type - Filter by event type
 * @param {string} params.status - Filter by status
 * @returns {Promise} Axios promise
 */
export const getRegisteredEvents = (params = {}) => {
  return api.get('/events/registered/', { params })
}

/**
 * Search events
 * @param {string} query - Search query
 * @param {Object} params - Additional search parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.event_type - Filter by event type
 * @param {string} params.location - Filter by location
 * @param {string} params.date_from - Filter events from this date
 * @param {string} params.date_to - Filter events to this date
 * @returns {Promise} Axios promise
 */
export const searchEvents = (query, params = {}) => {
  return api.get('/events/search/', {
    params: {
      q: query,
      ...params
    }
  })
}

/**
 * Get event statistics
 * @param {number|string} id - Event ID (optional)
 * @returns {Promise} Axios promise
 */
export const getEventStats = (id = null) => {
  const url = id ? `/events/${id}/stats/` : '/events/stats/'
  return api.get(url)
}

/**
 * Check if user is registered for an event (placeholder - not implemented in backend)
 * @param {number|string} id - Event ID
 * @returns {Promise} Axios promise
 */
export const checkRegistration = (id) => {
  return Promise.reject(new Error('Event registration check not implemented yet'))
}

// Note: Advanced event management features are not implemented in the backend yet
// These functions are placeholders for future implementation

/**
 * Get event calendar data (placeholder - not implemented in backend)
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise} Axios promise
 */
export const getEventCalendar = (params = {}) => {
  return Promise.reject(new Error('Event calendar not implemented yet'))
}

/**
 * Export event attendees (placeholder - not implemented in backend)
 * @param {number|string} id - Event ID
 * @param {string} format - Export format (csv, xlsx, pdf)
 * @returns {Promise} Axios promise
 */
export const exportAttendees = (id, format = 'csv') => {
  return Promise.reject(new Error('Event export not implemented yet'))
}

/**
 * Send event reminder (placeholder - not implemented in backend)
 * @param {number|string} id - Event ID
 * @param {Object} data - Reminder data
 * @returns {Promise} Axios promise
 */
export const sendEventReminder = (id, data) => {
  return Promise.reject(new Error('Event reminders not implemented yet'))
}

/**
 * Cancel an event (placeholder - not implemented in backend)
 * @param {number|string} id - Event ID
 * @param {Object} data - Cancellation data
 * @returns {Promise} Axios promise
 */
export const cancelEvent = (id, data) => {
  return Promise.reject(new Error('Event cancellation not implemented yet'))
}

/**
 * Reschedule an event (placeholder - not implemented in backend)
 * @param {number|string} id - Event ID
 * @param {Object} data - Reschedule data
 * @returns {Promise} Axios promise
 */
export const rescheduleEvent = (id, data) => {
  return Promise.reject(new Error('Event rescheduling not implemented yet'))
}
