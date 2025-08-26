import { useState, useEffect, useCallback } from 'react'
import { useToastContext } from '../context/ToastContext'

const BACKUP_REMINDER_KEY = 'lastBackupReminder'
const BACKUP_REMINDER_INTERVAL = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export const useDataIntegrity = (todos, isOneDriveMode) => {
  const { showInfo, showWarning } = useToastContext()
  const [lastBackupCheck, setLastBackupCheck] = useState(null)

  // Check if backup reminder is needed
  useEffect(() => {
    const checkBackupReminder = () => {
      if (isOneDriveMode || todos.length === 0) return // No reminder needed if syncing to OneDrive or no todos

      const lastReminder = localStorage.getItem(BACKUP_REMINDER_KEY)
      const now = Date.now()
      
      if (!lastReminder || (now - parseInt(lastReminder)) > BACKUP_REMINDER_INTERVAL) {
        // Show backup reminder
        setTimeout(() => {
          showInfo(
            `💾 Consider backing up your ${todos.length} todos. Export them from the menu above.`, 
            8000
          )
        }, 2000) // Delay to avoid overwhelming user on app start
        
        localStorage.setItem(BACKUP_REMINDER_KEY, now.toString())
        setLastBackupCheck(now)
      }
    }

    // Only check after todos have loaded and user has been active for a bit
    const timeoutId = setTimeout(checkBackupReminder, 5000)
    return () => clearTimeout(timeoutId)
  }, [todos.length, isOneDriveMode, showInfo])

  // Monitor sync health
  const [syncHealthScore, setSyncHealthScore] = useState(100)
  
  useEffect(() => {
    if (!isOneDriveMode) {
      setSyncHealthScore(100)
      return
    }

    const checkSyncHealth = () => {
      const lastSyncTime = localStorage.getItem('lastOneDriveSyncTime')
      const now = Date.now()
      
      if (!lastSyncTime) {
        setSyncHealthScore(50) // Never synced
        return
      }

      const timeSinceSync = now - new Date(lastSyncTime).getTime()
      const hoursAgo = timeSinceSync / (1000 * 60 * 60)
      
      if (hoursAgo < 1) {
        setSyncHealthScore(100) // Excellent
      } else if (hoursAgo < 24) {
        setSyncHealthScore(80) // Good
      } else if (hoursAgo < 24 * 7) {
        setSyncHealthScore(60) // Fair
      } else {
        setSyncHealthScore(30) // Poor
        showWarning('Your todos haven\'t synced to OneDrive in over a week')
      }
    }

    checkSyncHealth()
    const intervalId = setInterval(checkSyncHealth, 60000) // Check every minute
    return () => clearInterval(intervalId)
  }, [isOneDriveMode, showWarning])

  // Validate data integrity
  const validateTodos = useCallback((todosToValidate) => {
    const issues = []
    
    todosToValidate.forEach((todo, index) => {
      if (!todo.id) {
        issues.push(`Todo at index ${index} is missing an ID`)
      }
      if (!todo.text || todo.text.trim() === '') {
        issues.push(`Todo at index ${index} has empty text`)
      }
      if (todo.timestamp && isNaN(new Date(todo.timestamp))) {
        issues.push(`Todo at index ${index} has invalid timestamp`)
      }
      if (todo.priority && (todo.priority < 1 || todo.priority > 5)) {
        issues.push(`Todo at index ${index} has invalid priority: ${todo.priority}`)
      }
    })

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 10))
    }
  }, [])

  // Auto-cleanup corrupted data
  const cleanupTodos = useCallback((todosToClean) => {
    const cleaned = todosToClean.filter(todo => {
      if (!todo || typeof todo !== 'object') return false
      if (!todo.id || !todo.text || todo.text.trim() === '') return false
      return true
    }).map(todo => ({
      ...todo,
      id: todo.id || Date.now() + Math.random(),
      text: typeof todo.text === 'string' ? todo.text.trim() : String(todo.text || ''),
      completed: Boolean(todo.completed),
      timestamp: todo.timestamp || Date.now(),
      tags: Array.isArray(todo.tags) ? todo.tags : [],
      priority: (typeof todo.priority === 'number' && todo.priority >= 1 && todo.priority <= 5) 
        ? todo.priority : 3,
      order: typeof todo.order === 'number' ? todo.order : 0
    }))

    const removedCount = todosToClean.length - cleaned.length
    if (removedCount > 0) {
      showWarning(`Removed ${removedCount} corrupted todo(s) during cleanup`)
    }

    return cleaned
  }, [showWarning])

  return {
    syncHealthScore,
    lastBackupCheck,
    validateTodos,
    cleanupTodos
  }
}