/**
 * Service Worker Notification Handler
 * Handles notification clicks and actions in PWA context
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Precache and route setup
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Handle notification click events
self.addEventListener('notificationclick', async (event) => {
  console.log('Service Worker: Notification clicked', {
    action: event.action,
    tag: event.notification.tag,
    data: event.notification.data
  })
  
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
  
  console.log('Service Worker: Processing notification action', notificationData)
  
  event.waitUntil(handleNotificationAction(notificationData))
})

// Handle notification actions
async function handleNotificationAction(notificationData) {
  try {
    const urlToOpen = getUrlFromNotificationData(notificationData)
    const filterParams = getFilterParams(notificationData)
    
    console.log('Service Worker: Determining action', {
      urlToOpen,
      filterParams,
      action: notificationData.action,
      type: notificationData.type
    })
    
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    
    console.log('Service Worker: Found clients', { count: clients.length })
    
    if (clients.length > 0) {
      // Focus existing window
      const client = clients[0]
      await client.focus()
      
      const message = {
        type: 'NOTIFICATION_ACTION',
        action: notificationData.action,
        notificationType: notificationData.type,
        filterParams: filterParams,
        url: urlToOpen
      }
      
      console.log('Service Worker: Sending message to client', message)
      
      // Send message to main app
      client.postMessage(message)
    } else {
      console.log('Service Worker: No existing windows, opening new one', urlToOpen)
      // Open new window
      await self.clients.openWindow(urlToOpen)
    }
  } catch (error) {
    console.error('Service Worker: Error handling notification action:', error)
  }
}

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