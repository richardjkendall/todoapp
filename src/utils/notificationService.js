/**
 * PWA Notification Service
 * Handles native notifications for aged and high priority todo items
 */

import { filterLogger } from './logger'

// Notification permission states
export const NOTIFICATION_PERMISSIONS = {
  DEFAULT: 'default',
  GRANTED: 'granted',
  DENIED: 'denied'
}

// Notification types for todo app
export const NOTIFICATION_TYPES = {
  AGED_ITEMS: 'aged_items',
  HIGH_PRIORITY: 'high_priority',
  DAILY_DIGEST: 'daily_digest'
}

// Default notification settings
const DEFAULT_SETTINGS = {
  enabled: false,
  agedItemsEnabled: true,
  highPriorityEnabled: true,
  dailyDigestEnabled: true,
  digestTime: '09:00', // 9 AM local time
  permissions: NOTIFICATION_PERMISSIONS.DEFAULT
}

/**
 * Check if notifications are supported in this browser
 * @returns {boolean} True if notifications are supported
 */
export function isNotificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Get current notification permission status
 * @returns {string} Permission state (granted, denied, default)
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return NOTIFICATION_PERMISSIONS.DENIED
  }
  return Notification.permission
}

/**
 * Request notification permission from the user
 * @returns {Promise<string>} Permission state after request
 */
export async function requestNotificationPermission() {
  filterLogger.debug('Requesting notification permission')
  
  if (!isNotificationSupported()) {
    filterLogger.warn('Notifications not supported in this browser')
    return NOTIFICATION_PERMISSIONS.DENIED
  }

  try {
    const permission = await Notification.requestPermission()
    
    filterLogger.info('Notification permission result', { permission })
    
    // Save permission state to settings
    const settings = getNotificationSettings()
    settings.permissions = permission
    settings.enabled = permission === NOTIFICATION_PERMISSIONS.GRANTED
    saveNotificationSettings(settings)
    
    return permission
  } catch (error) {
    filterLogger.error('Failed to request notification permission', { 
      error: error.message 
    })
    return NOTIFICATION_PERMISSIONS.DENIED
  }
}

/**
 * Get notification settings from localStorage
 * @returns {Object} Notification settings object
 */
export function getNotificationSettings() {
  try {
    const saved = localStorage.getItem('notificationSettings')
    if (saved) {
      const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      // Update permission state from browser
      settings.permissions = getNotificationPermission()
      return settings
    }
  } catch (error) {
    filterLogger.warn('Failed to load notification settings', { 
      error: error.message 
    })
  }
  
  return {
    ...DEFAULT_SETTINGS,
    permissions: getNotificationPermission()
  }
}

/**
 * Save notification settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export function saveNotificationSettings(settings) {
  try {
    localStorage.setItem('notificationSettings', JSON.stringify(settings))
    filterLogger.debug('Notification settings saved', { 
      enabled: settings.enabled,
      types: {
        aged: settings.agedItemsEnabled,
        priority: settings.highPriorityEnabled,
        digest: settings.dailyDigestEnabled
      }
    })
  } catch (error) {
    filterLogger.error('Failed to save notification settings', { 
      error: error.message 
    })
  }
}

/**
 * Check if notifications are enabled and permitted
 * @returns {boolean} True if notifications can be shown
 */
export function canShowNotifications() {
  const settings = getNotificationSettings()
  return (
    isNotificationSupported() &&
    settings.enabled &&
    settings.permissions === NOTIFICATION_PERMISSIONS.GRANTED
  )
}

/**
 * Show a native notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} options.icon - Notification icon URL
 * @param {string} options.tag - Notification tag (for grouping)
 * @param {Object} options.data - Custom data to attach
 * @param {Array} options.actions - Notification actions
 * @returns {Promise<boolean>} True if notification was shown
 */
export async function showNotification(options) {
  filterLogger.debug('Attempting to show notification', { 
    title: options.title,
    tag: options.tag,
    hasServiceWorker: 'serviceWorker' in navigator,
    permission: Notification.permission,
    supported: isNotificationSupported(),
    canShow: canShowNotifications()
  })

  if (!canShowNotifications()) {
    filterLogger.warn('Cannot show notifications', {
      supported: isNotificationSupported(),
      permission: Notification.permission,
      settings: getNotificationSettings()
    })
    return false
  }

  try {
    let usedServiceWorker = false
    
    // Try service worker first, but with timeout and fallback
    if ('serviceWorker' in navigator) {
      try {
        filterLogger.debug('Checking service worker registration')
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker timeout')), 2000))
        ])
        
        filterLogger.debug('Service worker registration status', {
          exists: !!registration,
          active: !!registration?.active,
          scope: registration?.scope
        })
        
        if (registration && registration.active) {
          // Use service worker for persistent notifications
          await registration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: options.tag,
            data: options.data,
            actions: options.actions || [],
            requireInteraction: false, // Don't require interaction on desktop
            timestamp: Date.now(),
            silent: false
          })
          
          usedServiceWorker = true
          filterLogger.info('Service worker notification shown', { 
            title: options.title,
            tag: options.tag,
            hasActions: options.actions?.length > 0
          })
        } else {
          filterLogger.warn('Service worker not active, falling back to basic notification')
        }
      } catch (swError) {
        filterLogger.warn('Service worker notification failed, falling back to basic', {
          error: swError.message,
          stack: swError.stack
        })
      }
    } else {
      filterLogger.debug('Service worker not supported, using basic notifications')
    }
    
    // Fallback to basic notification if service worker failed or unavailable
    if (!usedServiceWorker) {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/pwa-192x192.png',
        tag: options.tag,
        data: options.data,
        silent: false
      })
      
      // Handle click events for basic notifications
      notification.onclick = () => {
        window.focus()
        notification.close()
        
        // Dispatch custom event for notification click handling
        if (options.data) {
          window.dispatchEvent(new CustomEvent('notification-click', {
            detail: {
              action: 'view',
              ...options.data
            }
          }))
        }
      }
      
      // Auto close after 8 seconds if not interacted with
      setTimeout(() => {
        try {
          notification.close()
        } catch (e) {
          // Notification might already be closed
        }
      }, 8000)
      
      filterLogger.info('Basic notification shown', { 
        title: options.title,
        tag: options.tag 
      })
    }
    
    return true
  } catch (error) {
    filterLogger.error('Failed to show notification', { 
      error: error.message,
      title: options.title,
      stack: error.stack
    })
    return false
  }
}

/**
 * Create notification options for aged items
 * @param {Array} agedItems - Array of aged todo items
 * @returns {Object} Notification options
 */
export function createAgedItemsNotification(agedItems) {
  const count = agedItems.length
  const oldestItem = agedItems.reduce((oldest, item) => {
    const itemAge = Date.now() - (item.timestamp || item.lastModified || Date.now())
    const oldestAge = Date.now() - (oldest.timestamp || oldest.lastModified || Date.now())
    return itemAge > oldestAge ? item : oldest
  }, agedItems[0])
  
  const daysOld = Math.floor((Date.now() - (oldestItem.timestamp || oldestItem.lastModified || Date.now())) / (24 * 60 * 60 * 1000))
  
  const actions = []
  
  // If single item, offer to mark complete
  if (count === 1) {
    actions.push({
      action: 'complete',
      title: 'Mark Complete',
      icon: '/icons/check.png'
    })
  }
  
  // Always offer to view tasks
  actions.push({
    action: 'view',
    title: count === 1 ? 'View Task' : 'View Tasks',
    icon: '/icons/view.png'
  })
  
  // Add snooze option
  actions.push({
    action: 'snooze',
    title: 'Snooze 1 Day',
    icon: '/icons/snooze.png'
  })
  
  return {
    title: `📅 ${count} Overdue Task${count > 1 ? 's' : ''}`,
    body: count === 1 
      ? `"${oldestItem.text}" has been pending for ${daysOld} days`
      : `You have ${count} tasks overdue, oldest is ${daysOld} days old`,
    tag: NOTIFICATION_TYPES.AGED_ITEMS,
    data: {
      type: NOTIFICATION_TYPES.AGED_ITEMS,
      count: count,
      todoIds: agedItems.map(item => item.id),
      oldestDays: daysOld,
      singleTodo: count === 1 ? oldestItem : null
    },
    actions: actions
  }
}

/**
 * Create notification options for high priority items
 * @param {Array} highPriorityItems - Array of high priority todo items
 * @returns {Object} Notification options
 */
export function createHighPriorityNotification(highPriorityItems) {
  const count = highPriorityItems.length
  const urgentItems = highPriorityItems.filter(item => item.priority === 5)
  const importantItems = highPriorityItems.filter(item => item.priority === 4)
  
  let bodyText = ''
  if (urgentItems.length > 0) {
    bodyText = urgentItems.length === 1 
      ? `"${urgentItems[0].text}" needs immediate attention`
      : `${urgentItems.length} urgent tasks need immediate attention`
  } else if (importantItems.length > 0) {
    bodyText = importantItems.length === 1
      ? `"${importantItems[0].text}" is high priority`
      : `${importantItems.length} important tasks await your attention`
  }
  
  const actions = []
  
  // If single high priority item, offer to mark complete
  if (count === 1) {
    actions.push({
      action: 'complete',
      title: 'Mark Complete',
      icon: '/icons/check.png'
    })
  }
  
  // Always offer to view high priority tasks
  actions.push({
    action: 'view',
    title: count === 1 ? 'View Task' : 'View Tasks',
    icon: '/icons/view.png'
  })
  
  // Add snooze for urgent items
  if (urgentItems.length > 0) {
    actions.push({
      action: 'snooze',
      title: 'Snooze 2 Hours',
      icon: '/icons/snooze.png'
    })
  }
  
  return {
    title: `⚡ ${count} High Priority Task${count > 1 ? 's' : ''}`,
    body: bodyText,
    tag: NOTIFICATION_TYPES.HIGH_PRIORITY,
    data: {
      type: NOTIFICATION_TYPES.HIGH_PRIORITY,
      count: count,
      todoIds: highPriorityItems.map(item => item.id),
      urgentCount: urgentItems.length,
      importantCount: importantItems.length,
      singleTodo: count === 1 ? highPriorityItems[0] : null
    },
    actions: actions
  }
}

/**
 * Create daily digest notification
 * @param {Object} summary - Daily summary data
 * @returns {Object} Notification options
 */
export function createDailyDigestNotification(summary) {
  const { totalTasks, completedToday, overdue, highPriority } = summary
  
  let bodyText = `${totalTasks} total tasks`
  if (completedToday > 0) {
    bodyText += `, ${completedToday} completed today`
  }
  if (overdue > 0) {
    bodyText += `, ${overdue} overdue`
  }
  if (highPriority > 0) {
    bodyText += `, ${highPriority} high priority`
  }
  
  const actions = [{
    action: 'view',
    title: 'Open App',
    icon: '/icons/view.png'
  }]
  
  // Add specific actions based on summary content
  if (overdue > 0) {
    actions.push({
      action: 'view_overdue',
      title: 'View Overdue',
      icon: '/icons/overdue.png'
    })
  }
  
  if (highPriority > 0) {
    actions.push({
      action: 'view_priority',
      title: 'View Priority',
      icon: '/icons/priority.png'
    })
  }
  
  return {
    title: '📊 Daily Task Summary',
    body: bodyText,
    tag: NOTIFICATION_TYPES.DAILY_DIGEST,
    data: {
      type: NOTIFICATION_TYPES.DAILY_DIGEST,
      summary: summary
    },
    actions: actions.slice(0, 3) // Limit to 3 actions for better UX
  }
}

/**
 * Clear all scheduled notifications
 */
export async function clearAllNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready
    const notifications = await registration.getNotifications()
    
    notifications.forEach(notification => {
      notification.close()
    })
    
    filterLogger.info('Cleared all notifications', { 
      count: notifications.length 
    })
  } catch (error) {
    filterLogger.error('Failed to clear notifications', { 
      error: error.message 
    })
  }
}

/**
 * Handle notification click events and actions
 * @param {Object} event - Notification event object
 * @param {Object} notificationData - Data from clicked notification
 * @param {Function} toggleTodoComplete - Function to mark todo as complete
 * @returns {Promise<void>}
 */
export async function handleNotificationClick(event, notificationData, toggleTodoComplete = null) {
  const { action, type, todoIds, singleTodo } = notificationData
  
  filterLogger.info('Notification action triggered', { 
    type: type,
    action: action,
    todoCount: todoIds?.length || 0
  })
  
  // Handle different notification actions
  switch (action) {
    case 'complete':
      if (singleTodo && toggleTodoComplete) {
        try {
          await toggleTodoComplete(singleTodo.id)
          filterLogger.info('Todo marked complete from notification', { 
            todoId: singleTodo.id,
            text: singleTodo.text 
          })
          
          // Show success notification
          await showNotification({
            title: '✅ Task Completed',
            body: `"${singleTodo.text}" marked as complete`,
            tag: 'completion_success',
            data: { type: 'completion', todoId: singleTodo.id }
          })
          
          // Close the original notification
          event.notification?.close()
          return
        } catch (error) {
          filterLogger.error('Failed to complete todo from notification', { 
            error: error.message,
            todoId: singleTodo.id 
          })
        }
      }
      break
      
    case 'snooze':
      // Set snooze timestamp to prevent re-notification for specified time
      const snoozeKey = `snooze_${type}_${todoIds?.join(',') || 'digest'}`
      const snoozeTime = type === NOTIFICATION_TYPES.HIGH_PRIORITY 
        ? Date.now() + (2 * 60 * 60 * 1000) // 2 hours for high priority
        : Date.now() + (24 * 60 * 60 * 1000) // 1 day for aged items
      
      localStorage.setItem(snoozeKey, snoozeTime.toString())
      
      filterLogger.info('Notification snoozed', { 
        type: type,
        snoozeKey: snoozeKey,
        snoozeUntil: new Date(snoozeTime).toLocaleString()
      })
      
      // Show snooze confirmation
      await showNotification({
        title: '😴 Snoozed',
        body: type === NOTIFICATION_TYPES.HIGH_PRIORITY 
          ? 'High priority tasks snoozed for 2 hours'
          : 'Overdue tasks snoozed for 1 day',
        tag: 'snooze_confirmation',
        data: { type: 'snooze_confirmation' }
      })
      
      event.notification?.close()
      return
      
    case 'view':
    case 'view_overdue':
    case 'view_priority':
    default:
      // Open app with appropriate filter
      const filterParams = getFilterParamsForAction(action, type)
      const url = filterParams ? `/?filter=${filterParams}` : '/'
      
      // Focus or open the app window
      if ('clients' in self) {
        // Service Worker context
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        
        if (clients.length > 0) {
          // Focus existing window and navigate
          const client = clients[0]
          await client.focus()
          await client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: action,
            notificationType: type,
            filterParams: filterParams,
            url: url
          })
        } else {
          // Open new window
          await self.clients.openWindow(url)
        }
      } else if (window) {
        // Main thread context
        window.focus()
        // Navigate to appropriate filter
        if (filterParams && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('notification-filter-request', {
            detail: { filterParams, type, action }
          }))
        }
      }
      
      break
  }
  
  // Close the notification after handling
  if (event.notification) {
    event.notification.close()
  }
}

/**
 * Get filter parameters for notification actions
 * @param {string} action - The notification action
 * @param {string} type - The notification type
 * @returns {string|null} Filter parameter string
 */
function getFilterParamsForAction(action, type) {
  switch (action) {
    case 'view_overdue':
      return 'aged'
    case 'view_priority':
      return 'high-priority'
    case 'view':
      switch (type) {
        case NOTIFICATION_TYPES.AGED_ITEMS:
          return 'aged'
        case NOTIFICATION_TYPES.HIGH_PRIORITY:
          return 'high-priority'
        case NOTIFICATION_TYPES.DAILY_DIGEST:
        default:
          return null // No specific filter for daily digest
      }
    default:
      return null
  }
}

/**
 * Check if a notification should be snoozed
 * @param {string} type - Notification type
 * @param {Array} todoIds - Array of todo IDs
 * @returns {boolean} True if currently snoozed
 */
export function isNotificationSnoozed(type, todoIds = []) {
  const snoozeKey = `snooze_${type}_${todoIds.join(',') || 'digest'}`
  const snoozeUntil = localStorage.getItem(snoozeKey)
  
  if (!snoozeUntil) return false
  
  const snoozeTime = parseInt(snoozeUntil)
  const now = Date.now()
  
  if (now >= snoozeTime) {
    // Snooze expired, clean up
    localStorage.removeItem(snoozeKey)
    return false
  }
  
  return true
}