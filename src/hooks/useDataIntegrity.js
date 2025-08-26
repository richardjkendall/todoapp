import { useState, useEffect, useCallback } from 'react'
import { useToastContext } from '../context/ToastContext'
import { validateTodos, cleanupTodos } from '../utils/todoValidation'

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

  // Validate data integrity using shared utility
  const validateTodosWrapper = useCallback((todosToValidate) => {
    return validateTodos(todosToValidate)
  }, [])

  // Auto-cleanup corrupted data using shared utility
  const cleanupTodosWrapper = useCallback((todosToClean) => {
    const { cleaned, removedCount } = cleanupTodos(todosToClean)
    
    if (removedCount > 0) {
      showWarning(`Removed ${removedCount} corrupted todo(s) during cleanup`)
    }

    return cleaned
  }, [showWarning])

  return {
    syncHealthScore,
    lastBackupCheck,
    validateTodos: validateTodosWrapper,
    cleanupTodos: cleanupTodosWrapper
  }
}