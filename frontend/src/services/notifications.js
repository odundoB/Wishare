import api from './api'

/**
 * Notification service functions for notification management
 * All functions use the configured 'api' instance from api.js
 */

/**
 * Get all notifications for the current user
 * @param {Object} params - Query parameters (optional)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {boolean} params.is_read - Filter by read status
 * @param {string} params.notification_type - Filter by notification type
 * @param {string} params.ordering - Order by field (e.g., '-created_at', 'created_at')
 * @param {string} params.search - Search query
 * @returns {Promise} Axios promise
 */
export const getNotifications = (params = {}) => {
  return api.get('/notifications/', { params })
}

/**
 * Mark a notification as read
 * @param {number|string} id - Notification ID
 * @returns {Promise} Axios promise
 */
export const markRead = (id) => {
  return api.patch(`/notifications/${id}/`, { is_read: true })
}

/**
 * Mark a notification as unread
 * @param {number|string} id - Notification ID
 * @returns {Promise} Axios promise
 */
export const markUnread = (id) => {
  return api.patch(`/notifications/${id}/`, { is_read: false })
}

/**
 * Delete a notification
 * @param {number|string} id - Notification ID
 * @returns {Promise} Axios promise
 */
export const deleteNotification = (id) => {
  return api.delete(`/notifications/${id}/`)
}

/**
 * Mark all notifications as read
 * @returns {Promise} Axios promise
 */
export const markAllRead = () => {
  return api.post('/notifications/mark-all-read/')
}

/**
 * Mark all notifications as unread
 * @returns {Promise} Axios promise
 */
export const markAllUnread = () => {
  return api.post('/notifications/mark-all-unread/')
}

/**
 * Get notification statistics
 * @returns {Promise} Axios promise
 */
export const getNotificationStats = () => {
  return api.get('/notifications/stats/')
}

/**
 * Get unread notification count
 * @returns {Promise} Axios promise
 */
export const getUnreadCount = () => {
  return api.get('/notifications/unread-count/')
}

/**
 * Search notifications
 * @param {string} query - Search query
 * @param {Object} params - Additional search parameters (optional)
 * @returns {Promise} Axios promise
 */
export const searchNotifications = (query, params = {}) => {
  return api.get('/notifications/search/', {
    params: {
      q: query,
      ...params
    }
  })
}

/**
 * Bulk update notifications
 * @param {Object} data - Bulk update data
 * @param {Array} data.notification_ids - Array of notification IDs
 * @param {boolean} data.is_read - Read status to set
 * @returns {Promise} Axios promise
 */
export const bulkUpdateNotifications = (data) => {
  return api.post('/notifications/bulk-update/', data)
}

/**
 * Bulk delete notifications
 * @param {Object} data - Bulk delete data
 * @param {Array} data.notification_ids - Array of notification IDs to delete
 * @returns {Promise} Axios promise
 */
export const bulkDeleteNotifications = (data) => {
  return api.post('/notifications/bulk-delete/', data)
}

/**
 * WebSocket helper for real-time notifications
 */
export class NotificationWebSocket {
  constructor(onNotification, onError, onConnect, onDisconnect) {
    this.onNotification = onNotification
    this.onError = onError
    this.onConnect = onConnect
    this.onDisconnect = onDisconnect
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 1000
  }

  /**
   * Test if WebSocket server is available
   */
  async testWebSocketAvailability() {
    return new Promise((resolve) => {
      try {
        const testWs = new WebSocket('ws://localhost:8002/ws/test/');
        testWs.onopen = () => {
          testWs.close();
          resolve(true);
        };
        testWs.onerror = () => {
          resolve(false);
        };
        testWs.onclose = () => {
          resolve(false);
        };
        
        // Timeout after 2 seconds
        setTimeout(() => {
          if (testWs.readyState === WebSocket.CONNECTING) {
            testWs.close();
            resolve(false);
          }
        }, 2000);
      } catch (error) {
        resolve(false);
      }
    });
  }

  /**
   * Connect to the notification WebSocket (with availability check)
   */
  async connect() {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        console.warn('No authentication token found for notification WebSocket')
        return
      }

      // First test if WebSocket server is available
      const isAvailable = await this.testWebSocketAvailability();
      if (!isAvailable) {
        console.log('Notification WebSocket server not available, using REST API only');
        return;
      }

      const wsUrl = `ws://localhost:8002/ws/notifications/?token=${token}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = (event) => {
        console.log('Notification WebSocket connected:', event)
        this.reconnectAttempts = 0
        this.onConnect && this.onConnect(event)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.onNotification(data)
        } catch (error) {
          console.error('Error parsing notification WebSocket message:', error)
          this.onError && this.onError('Error parsing notification message')
        }
      }

      this.ws.onclose = (event) => {
        console.log('Notification WebSocket disconnected (using REST API fallback):', event)
        this.onDisconnect && this.onDisconnect(event)
        
        // Attempt to reconnect if not a normal closure (but only if server was available)
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(async () => {
            const stillAvailable = await this.testWebSocketAvailability();
            if (stillAvailable) {
              console.log(`Attempting to reconnect notification WebSocket... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
              this.connect()
            } else {
              console.log('Notification WebSocket server still unavailable, using REST API only');
            }
          }, this.reconnectInterval * this.reconnectAttempts)
        }
      }

      this.ws.onerror = (error) => {
        console.log('Notification WebSocket error (fallback to REST API):', error)
        // Don't call onError for connection issues since REST API is available
      }

    } catch (error) {
      console.log('Error creating notification WebSocket connection (using REST API fallback):', error)
      // Don't call onError for connection issues since REST API is available
    }
  }

  /**
   * Send a command to the notification WebSocket
   * @param {Object} command - Command data
   * @param {string} command.type - Command type (e.g., 'get_unread_count', 'mark_as_read')
   * @param {*} command.data - Command data
   */
  sendCommand(command) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command))
    } else {
      console.log('Notification WebSocket not connected, command ignored (using REST API instead)')
      // Don't call onError since REST API is available as fallback
    }
  }

  /**
   * Request unread count
   */
  requestUnreadCount() {
    this.sendCommand({
      type: 'get_unread_count'
    })
  }

  /**
   * Mark notification as read
   * @param {number|string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    this.sendCommand({
      type: 'mark_as_read',
      notification_id: notificationId
    })
  }

  /**
   * Mark notification as unread
   * @param {number|string} notificationId - Notification ID
   */
  markAsUnread(notificationId) {
    this.sendCommand({
      type: 'mark_as_unread',
      notification_id: notificationId
    })
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.sendCommand({
      type: 'mark_all_as_read'
    })
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }
  }

  /**
   * Get connection status
   * @returns {string} Connection status
   */
  getStatus() {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }
}

/**
 * Helper function to create and connect to notification WebSocket
 * @param {Function} onNotification - Callback for received notifications
 * @param {Function} onError - Callback for errors
 * @param {Function} onConnect - Callback for connection
 * @param {Function} onDisconnect - Callback for disconnection
 * @returns {NotificationWebSocket} WebSocket instance
 */
export const connectNotificationSocket = (onNotification, onError, onConnect, onDisconnect) => {
  const notificationWs = new NotificationWebSocket(onNotification, onError, onConnect, onDisconnect)
  notificationWs.connect()
  return notificationWs
}

/**
 * Helper function to create notification WebSocket with default handlers
 * @param {Function} onNotification - Callback for received notifications
 * @returns {NotificationWebSocket} WebSocket instance
 */
export const createNotificationSocket = (onNotification) => {
  return connectNotificationSocket(
    onNotification,
    (error) => console.error('Notification WebSocket error:', error),
    () => console.log('Notification WebSocket connected'),
    () => console.log('Notification WebSocket disconnected')
  )
}

/**
 * Notification manager class for handling notifications state
 */
export class NotificationManager {
  constructor() {
    this.notifications = []
    this.unreadCount = 0
    this.ws = null
    this.listeners = new Set()
  }

  /**
   * Add a listener for notification updates
   * @param {Function} listener - Callback function
   */
  addListener(listener) {
    this.listeners.add(listener)
  }

  /**
   * Remove a listener
   * @param {Function} listener - Callback function
   */
  removeListener(listener) {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        notifications: this.notifications,
        unreadCount: this.unreadCount
      })
    })
  }

  /**
   * Connect to notification WebSocket
   */
  connect() {
    this.ws = createNotificationSocket((data) => {
      this.handleNotification(data)
    })

    // Request initial unread count
    this.ws.requestUnreadCount()
  }

  /**
   * Handle incoming notification data
   * @param {Object} data - Notification data
   */
  handleNotification(data) {
    switch (data.type) {
      case 'new_notification':
        this.notifications.unshift(data.notification)
        this.unreadCount++
        this.notifyListeners()
        break
      
      case 'unread_count':
        this.unreadCount = data.count
        this.notifyListeners()
        break
      
      case 'notification_updated':
        const index = this.notifications.findIndex(n => n.id === data.notification.id)
        if (index !== -1) {
          this.notifications[index] = data.notification
          this.notifyListeners()
        }
        break
      
      case 'notification_deleted':
        this.notifications = this.notifications.filter(n => n.id !== data.notification_id)
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        this.notifyListeners()
        break
      
      default:
        console.log('Unknown notification type:', data.type)
    }
  }

  /**
   * Load notifications from API
   */
  async loadNotifications() {
    try {
      const response = await getNotifications({ page_size: 50 })
      this.notifications = response.data.results || response.data
      this.notifyListeners()
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  /**
   * Mark notification as read
   * @param {number|string} id - Notification ID
   */
  async markAsRead(id) {
    try {
      await markRead(id)
      
      // Update local state
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.is_read = true
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Delete notification
   * @param {number|string} id - Notification ID
   */
  async deleteNotification(id) {
    try {
      await deleteNotification(id)
      
      // Update local state
      const notification = this.notifications.find(n => n.id === id)
      this.notifications = this.notifications.filter(n => n.id !== id)
      if (notification && !notification.is_read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1)
      }
      this.notifyListeners()
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.disconnect()
      this.ws = null
    }
  }
}
