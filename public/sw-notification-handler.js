/**
 * Service Worker Notification Handler
 * Handles notification clicks and actions in PWA context
 */

// Import notification handler
importScripts('/src/utils/notificationService.js')

// Handle notification click events
self.addEventListener('notificationclick', async (event) => {
  console.log('Notification clicked:', event)
  
  const notification = event.notification
  const action = event.action
  const data = notification.data || {}
  
  // Close the notification
  notification.close()
  
  // Determine what action to take
  const notificationData = {
    action: action || 'view',
    type: data.type,
    todoIds: data.todoIds || [],
    singleTodo: data.singleTodo || null,
    count: data.count || 0
  }
  
  try {
    // Handle the notification click
    if (typeof handleNotificationClick === 'function') {
      await handleNotificationClick(event, notificationData)
    } else {
      // Fallback: just open/focus the app
      const urlToOpen = getUrlFromNotificationData(notificationData)
      
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      
      if (clients.length > 0) {
        // Focus existing window
        const client = clients[0]
        await client.focus()
        
        // Send message to main app
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          action: notificationData.action,
          notificationType: notificationData.type,
          filterParams: getFilterParams(notificationData),
          url: urlToOpen
        })
      } else {
        // Open new window
        await self.clients.openWindow(urlToOpen)
      }
    }
  } catch (error) {
    console.error('Error handling notification click:', error)
  }
})

// Helper function to get URL from notification data
function getUrlFromNotificationData(data) {
  const { action, type } = data
  
  switch (action) {
    case 'view_overdue':
      return '/?filter=aged'
    case 'view_priority':
      return '/?filter=high-priority'
    case 'view':
      switch (type) {
        case 'aged_items':
          return '/?filter=aged'
        case 'high_priority':
          return '/?filter=high-priority'
        default:
          return '/'
      }
    default:
      return '/'
  }
}

// Helper function to get filter params
function getFilterParams(data) {
  const { action, type } = data
  
  switch (action) {
    case 'view_overdue':
      return 'aged'
    case 'view_priority':
      return 'high-priority'
    case 'view':
      switch (type) {
        case 'aged_items':
          return 'aged'
        case 'high_priority':
          return 'high-priority'
        default:
          return null
      }
    default:
      return null
  }
}

console.log('Service Worker notification handler loaded')