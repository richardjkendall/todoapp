/**
 * Simple test script to verify notification functionality
 * Run this in the browser console when testing PWA notifications
 */

// Test notification service functions
import { 
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  canShowNotifications,
  showNotification
} from './src/utils/notificationService.js';

// Test todo notification logic
import {
  detectAgedItems,
  detectHighPriorityItems,
  generateDailySummary,
  processNotifications
} from './src/utils/todoNotificationLogic.js';

console.log('🔔 Testing PWA Notification System');

// Check browser support
console.log('Browser support:', {
  notificationSupported: isNotificationSupported(),
  serviceWorkerSupported: 'serviceWorker' in navigator
});

// Test with sample todos
const sampleTodos = [
  {
    id: '1',
    text: 'Old task from last month',
    completed: false,
    priority: 3,
    timestamp: Date.now() - (35 * 24 * 60 * 60 * 1000), // 35 days ago
    lastModified: Date.now() - (35 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2', 
    text: 'Urgent high priority task',
    completed: false,
    priority: 5, // Highest priority
    timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
    lastModified: Date.now() - (2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    text: 'Recent normal task',
    completed: false,
    priority: 2,
    timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
    lastModified: Date.now() - (2 * 60 * 60 * 1000)
  },
  {
    id: '4',
    text: 'Completed important task',
    completed: true,
    priority: 4,
    timestamp: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
    lastModified: Date.now() - (30 * 60 * 1000) // Completed 30 min ago
  }
];

// Test aged items detection
const agedItems = detectAgedItems(sampleTodos);
console.log('Aged items detection:', {
  old: agedItems.old.length,
  veryOld: agedItems.veryOld.length, 
  total: agedItems.all.length
});

// Test high priority detection
const highPriorityItems = detectHighPriorityItems(sampleTodos);
console.log('High priority items:', {
  count: highPriorityItems.length,
  items: highPriorityItems.map(item => ({
    text: item.text,
    priority: item.priority,
    urgencyLevel: item.urgencyLevel,
    daysOld: item.daysOld
  }))
});

// Test daily summary
const summary = generateDailySummary(sampleTodos);
console.log('Daily summary:', summary);

// Test notification processing (will check permissions first)
async function testNotificationProcessing() {
  try {
    const results = await processNotifications(sampleTodos);
    console.log('Notification processing results:', results);
  } catch (error) {
    console.error('Notification processing failed:', error);
  }
}

export {
  sampleTodos,
  testNotificationProcessing
};