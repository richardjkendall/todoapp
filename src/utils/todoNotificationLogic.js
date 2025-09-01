/**
 * Todo-specific notification logic
 * Analyzes todos for aged items and high priority notifications
 */

import { filterLogger } from './logger'
import { 
  showNotification, 
  getNotificationSettings,
  createAgedItemsNotification,
  createHighPriorityNotification,
  createDailyDigestNotification,
  isNotificationSnoozed,
  NOTIFICATION_TYPES
} from './notificationService'

// Time constants
const ONE_DAY = 24 * 60 * 60 * 1000
const ONE_WEEK = 7 * ONE_DAY
const ONE_MONTH = 30 * ONE_DAY

/**
 * Detect aged todo items that should trigger notifications
 * @param {Array} todos - Array of todo items
 * @param {Object} options - Detection options
 * @returns {Object} Aged items categorized by urgency
 */
export function detectAgedItems(todos, options = {}) {
  const now = Date.now()
  const {
    oldThreshold = ONE_WEEK,
    veryOldThreshold = ONE_MONTH,
    includeCompleted = false
  } = options
  
  const agedItems = {
    old: [],
    veryOld: [],
    all: []
  }
  
  todos.forEach(todo => {
    // Skip completed items unless explicitly included
    if (todo.completed && !includeCompleted) {
      return
    }
    
    // Get the most relevant timestamp for age calculation
    const todoTime = todo.lastModified || todo.timestamp || now
    const age = now - todoTime
    
    if (age > veryOldThreshold) {
      agedItems.veryOld.push({
        ...todo,
        age: age,
        daysOld: Math.floor(age / ONE_DAY)
      })
      agedItems.all.push(todo)
    } else if (age > oldThreshold) {
      agedItems.old.push({
        ...todo,
        age: age,
        daysOld: Math.floor(age / ONE_DAY)
      })
      agedItems.all.push(todo)
    }
  })
  
  filterLogger.debug('Aged items detected', {
    totalTodos: todos.length,
    oldItems: agedItems.old.length,
    veryOldItems: agedItems.veryOld.length,
    totalAged: agedItems.all.length
  })
  
  return agedItems
}

/**
 * Detect high priority items that need attention
 * @param {Array} todos - Array of todo items
 * @param {Object} options - Detection options  
 * @returns {Array} High priority items with urgency info
 */
export function detectHighPriorityItems(todos, options = {}) {
  const now = Date.now()
  const {
    urgentThreshold = ONE_DAY, // Priority 5 items older than 1 day
    importantThreshold = 3 * ONE_DAY, // Priority 4 items older than 3 days
    includeCompleted = false
  } = options
  
  const highPriorityItems = []
  
  todos.forEach(todo => {
    // Skip completed items unless explicitly included
    if (todo.completed && !includeCompleted) {
      return
    }
    
    // Only consider high priority items (4 and 5, where 5 is highest)
    if (!todo.priority || todo.priority < 4) {
      return
    }
    
    const todoTime = todo.lastModified || todo.timestamp || now
    const age = now - todoTime
    
    // Check if item needs attention based on priority and age
    const needsAttention = (
      (todo.priority === 5 && age > urgentThreshold) ||
      (todo.priority === 4 && age > importantThreshold)
    )
    
    if (needsAttention) {
      highPriorityItems.push({
        ...todo,
        age: age,
        daysOld: Math.floor(age / ONE_DAY),
        urgencyLevel: todo.priority === 5 ? 'urgent' : 'important'
      })
    }
  })
  
  // Sort by priority (highest first) then by age (oldest first)
  highPriorityItems.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority // Higher priority first
    }
    return b.age - a.age // Older items first
  })
  
  filterLogger.debug('High priority items detected', {
    totalTodos: todos.length,
    highPriorityItems: highPriorityItems.length,
    urgent: highPriorityItems.filter(item => item.urgencyLevel === 'urgent').length,
    important: highPriorityItems.filter(item => item.urgencyLevel === 'important').length
  })
  
  return highPriorityItems
}

/**
 * Generate daily summary for digest notifications
 * @param {Array} todos - Array of todo items
 * @returns {Object} Daily summary statistics
 */
export function generateDailySummary(todos) {
  const now = Date.now()
  const todayStart = new Date().setHours(0, 0, 0, 0)
  
  const summary = {
    totalTasks: todos.length,
    completedTotal: 0,
    completedToday: 0,
    pending: 0,
    overdue: 0,
    highPriority: 0
  }
  
  todos.forEach(todo => {
    if (todo.completed) {
      summary.completedTotal++
      
      // Check if completed today
      const completedTime = todo.lastModified || todo.timestamp || 0
      if (completedTime >= todayStart) {
        summary.completedToday++
      }
    } else {
      summary.pending++
      
      // Check if overdue (older than 1 week)
      const todoTime = todo.lastModified || todo.timestamp || now
      if (now - todoTime > ONE_WEEK) {
        summary.overdue++
      }
      
      // Check if high priority
      if (todo.priority && todo.priority >= 4) {
        summary.highPriority++
      }
    }
  })
  
  filterLogger.debug('Daily summary generated', summary)
  
  return summary
}

/**
 * Check if it's time to show aged items notification
 * @param {Array} agedItems - Array of aged todo items
 * @returns {boolean} True if notification should be shown
 */
function shouldNotifyAgedItems(agedItems) {
  const settings = getNotificationSettings()
  if (!settings.agedItemsEnabled || agedItems.length === 0) {
    return false
  }
  
  // Check if notification is snoozed
  const todoIds = agedItems.map(item => item.id)
  if (isNotificationSnoozed(NOTIFICATION_TYPES.AGED_ITEMS, todoIds)) {
    filterLogger.debug('Aged items notification is snoozed', { 
      todoIds: todoIds 
    })
    return false
  }
  
  // Check if we've already notified recently about aged items
  const lastNotified = localStorage.getItem('lastAgedItemsNotification')
  const lastNotifiedTime = lastNotified ? parseInt(lastNotified) : 0
  const timeSinceLastNotification = Date.now() - lastNotifiedTime
  
  // Only notify once per day about aged items
  return timeSinceLastNotification > ONE_DAY
}

/**
 * Check if it's time to show high priority notification  
 * @param {Array} highPriorityItems - Array of high priority items
 * @returns {boolean} True if notification should be shown
 */
function shouldNotifyHighPriority(highPriorityItems) {
  const settings = getNotificationSettings()
  if (!settings.highPriorityEnabled || highPriorityItems.length === 0) {
    return false
  }
  
  // Check if notification is snoozed
  const todoIds = highPriorityItems.map(item => item.id)
  if (isNotificationSnoozed(NOTIFICATION_TYPES.HIGH_PRIORITY, todoIds)) {
    filterLogger.debug('High priority notification is snoozed', { 
      todoIds: todoIds 
    })
    return false
  }
  
  // Check if we've already notified recently
  const lastNotified = localStorage.getItem('lastHighPriorityNotification')
  const lastNotifiedTime = lastNotified ? parseInt(lastNotified) : 0
  const timeSinceLastNotification = Date.now() - lastNotifiedTime
  
  // Only notify once per 4 hours about high priority items
  return timeSinceLastNotification > (4 * 60 * 60 * 1000)
}

/**
 * Check if it's time for daily digest
 * @returns {boolean} True if digest should be shown
 */
function shouldShowDailyDigest() {
  const settings = getNotificationSettings()
  if (!settings.dailyDigestEnabled) {
    return false
  }
  
  const now = new Date()
  const digestTime = settings.digestTime || '09:00'
  const [hours, minutes] = digestTime.split(':').map(n => parseInt(n))
  
  // Check if we're within 30 minutes of the digest time
  const digestTimeToday = new Date()
  digestTimeToday.setHours(hours, minutes, 0, 0)
  
  const timeDiff = Math.abs(now.getTime() - digestTimeToday.getTime())
  const withinDigestWindow = timeDiff < (30 * 60 * 1000) // 30 minutes
  
  // Check if we already sent digest today
  const lastDigest = localStorage.getItem('lastDailyDigest')
  const lastDigestDate = lastDigest ? new Date(parseInt(lastDigest)) : new Date(0)
  const isNewDay = now.toDateString() !== lastDigestDate.toDateString()
  
  return withinDigestWindow && isNewDay
}

/**
 * Process todos and trigger appropriate notifications with smart batching
 * @param {Array} todos - Array of todo items
 * @param {Object} todoOperations - Object containing todo operation functions
 * @returns {Promise<Object>} Results of notification processing
 */
export async function processNotifications(todos, todoOperations = {}) {
  filterLogger.debug('Processing notifications', { todoCount: todos.length })
  
  const results = {
    agedItemsNotified: false,
    highPriorityNotified: false,
    dailyDigestSent: false,
    batchedNotifications: false,
    errors: []
  }
  
  try {
    // Collect all potential notifications
    const pendingNotifications = []
    
    // Check aged items
    const agedItems = detectAgedItems(todos)
    if (shouldNotifyAgedItems(agedItems.all)) {
      pendingNotifications.push({
        type: 'aged',
        notification: createAgedItemsNotification(agedItems.all),
        data: agedItems.all
      })
    }
    
    // Check high priority items
    const highPriorityItems = detectHighPriorityItems(todos)
    if (shouldNotifyHighPriority(highPriorityItems)) {
      pendingNotifications.push({
        type: 'priority',
        notification: createHighPriorityNotification(highPriorityItems),
        data: highPriorityItems
      })
    }
    
    // Check daily digest
    if (shouldShowDailyDigest()) {
      const summary = generateDailySummary(todos)
      pendingNotifications.push({
        type: 'digest',
        notification: createDailyDigestNotification(summary),
        data: summary
      })
    }
    
    // Smart batching: if multiple notifications, consider combining or spacing them
    if (pendingNotifications.length > 1) {
      const batchResult = await handleBatchedNotifications(pendingNotifications)
      Object.assign(results, batchResult)
    } else if (pendingNotifications.length === 1) {
      // Single notification - send immediately
      const { type, notification, data } = pendingNotifications[0]
      const success = await showNotification(notification)
      
      if (success) {
        updateNotificationTimestamp(type)
        logNotificationSent(type, data)
        updateResultForType(results, type, true)
      }
    }
    
  } catch (error) {
    filterLogger.error('Error processing notifications', { 
      error: error.message 
    })
    results.errors.push(error.message)
  }
  
  return results
}

/**
 * Handle multiple notifications intelligently
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<Object>} Results of batch processing
 */
async function handleBatchedNotifications(notifications) {
  const results = {
    agedItemsNotified: false,
    highPriorityNotified: false,
    dailyDigestSent: false,
    batchedNotifications: true
  }
  
  // Priority order: high priority > aged > digest
  const sortedNotifications = notifications.sort((a, b) => {
    const priority = { priority: 3, aged: 2, digest: 1 }
    return priority[b.type] - priority[a.type]
  })
  
  // Check if we should batch into a single combined notification
  const shouldBatch = shouldCreateBatchedNotification(notifications)
  
  if (shouldBatch) {
    // Create a single combined notification
    const batchedNotification = createBatchedNotification(notifications)
    const success = await showNotification(batchedNotification)
    
    if (success) {
      // Mark all as sent
      for (const { type, data } of notifications) {
        updateNotificationTimestamp(type)
        logNotificationSent(type, data)
        updateResultForType(results, type, true)
      }
      
      filterLogger.info('Batched notification sent', { 
        types: notifications.map(n => n.type),
        count: notifications.length 
      })
    }
  } else {
    // Send notifications with smart timing (space them out)
    for (let i = 0; i < sortedNotifications.length; i++) {
      const { type, notification, data } = sortedNotifications[i]
      
      // Add delay between notifications (except first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay
      }
      
      const success = await showNotification(notification)
      
      if (success) {
        updateNotificationTimestamp(type)
        logNotificationSent(type, data)
        updateResultForType(results, type, true)
      }
    }
  }
  
  return results
}

/**
 * Determine if notifications should be batched into one
 * @param {Array} notifications - Array of notification objects
 * @returns {boolean} True if should create single batched notification
 */
function shouldCreateBatchedNotification(notifications) {
  // Don't batch if only high priority items (they need immediate attention)
  if (notifications.length === 1 && notifications[0].type === 'priority') {
    return false
  }
  
  // Batch if we have 3+ notifications or if user has preference for minimal notifications
  return notifications.length >= 3
}

/**
 * Create a single notification that combines multiple types
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Combined notification object
 */
function createBatchedNotification(notifications) {
  const types = notifications.map(n => n.type)
  const hasAged = types.includes('aged')
  const hasPriority = types.includes('priority')
  const hasDigest = types.includes('digest')
  
  let title = '📋 Multiple Updates'
  let body = 'You have several task notifications: '
  
  const bodyParts = []
  if (hasPriority) bodyParts.push('high priority tasks')
  if (hasAged) bodyParts.push('overdue items')
  if (hasDigest) bodyParts.push('daily summary')
  
  body += bodyParts.join(', ')
  
  // Combine all todo IDs for actions
  const allTodoIds = []
  notifications.forEach(n => {
    if (n.data && Array.isArray(n.data)) {
      allTodoIds.push(...n.data.map(item => item.id).filter(id => id))
    }
  })
  
  return {
    title,
    body,
    tag: 'batched_notifications',
    data: {
      type: 'batched',
      types: types,
      todoIds: allTodoIds,
      notifications: notifications.length
    },
    actions: [
      {
        action: 'view',
        title: 'Open App',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  }
}

/**
 * Update notification timestamp for a given type
 * @param {string} type - Notification type
 */
function updateNotificationTimestamp(type) {
  const timestampKeys = {
    aged: 'lastAgedItemsNotification',
    priority: 'lastHighPriorityNotification',
    digest: 'lastDailyDigest'
  }
  
  const key = timestampKeys[type]
  if (key) {
    localStorage.setItem(key, Date.now().toString())
  }
}

/**
 * Log that a notification was sent
 * @param {string} type - Notification type
 * @param {*} data - Notification data
 */
function logNotificationSent(type, data) {
  switch (type) {
    case 'aged':
      filterLogger.info('Aged items notification sent', { count: data.length })
      break
    case 'priority':
      filterLogger.info('High priority notification sent', { count: data.length })
      break
    case 'digest':
      filterLogger.info('Daily digest sent', data)
      break
  }
}

/**
 * Update results object for notification type
 * @param {Object} results - Results object to update
 * @param {string} type - Notification type
 * @param {boolean} success - Whether notification was successful
 */
function updateResultForType(results, type, success) {
  switch (type) {
    case 'aged':
      results.agedItemsNotified = success
      break
    case 'priority':
      results.highPriorityNotified = success
      break
    case 'digest':
      results.dailyDigestSent = success
      break
  }
}

/**
 * Initialize notification monitoring
 * Sets up periodic checks for notification triggers
 * @param {Function} getTodos - Function to retrieve current todos
 * @param {Object} todoOperations - Object containing todo operation functions
 * @param {number} checkInterval - Check interval in milliseconds (default: 30 minutes)
 */
export function initializeNotificationMonitoring(getTodos, todoOperations = {}, checkInterval = 30 * 60 * 1000) {
  filterLogger.info('Initializing notification monitoring', { 
    checkIntervalMinutes: checkInterval / (60 * 1000) 
  })
  
  // Store operations reference globally for notification handlers
  if (typeof window !== 'undefined') {
    window.todoOperations = todoOperations
  }
  
  // Initial check
  const checkNotifications = async () => {
    try {
      const todos = getTodos()
      if (Array.isArray(todos) && todos.length > 0) {
        await processNotifications(todos, todoOperations)
      }
    } catch (error) {
      filterLogger.error('Notification check failed', { 
        error: error.message 
      })
    }
  }
  
  // Run initial check after a short delay
  setTimeout(checkNotifications, 5000)
  
  // Set up periodic checks
  const intervalId = setInterval(checkNotifications, checkInterval)
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId)
    filterLogger.debug('Notification monitoring stopped')
  }
}