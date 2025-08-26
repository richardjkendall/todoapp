import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOfflineDetection } from './useOfflineDetection'
import { useSyncQueue } from './useSyncQueue'
import { useToastContext } from '../context/ToastContext'
import GraphService from '../services/graphService'

const STORAGE_TYPES = {
  LOCAL: 'localStorage',
  ONEDRIVE: 'oneDrive'
}

const OPERATION_TYPES = {
  SAVE_TODOS: 'SAVE_TODOS',
  LOAD_TODOS: 'LOAD_TODOS'
}

export const useEnhancedOneDriveStorage = () => {
  const { isAuthenticated, getAccessToken, isInitialized } = useAuth()
  const { isOnline, wasOffline, acknowledgeOnlineStatus } = useOfflineDetection()
  const { queueOperation, processQueue, queueStatus, clearQueue } = useSyncQueue()
  const { showSuccess, showError, showWarning, showInfo } = useToastContext()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [conflictInfo, setConflictInfo] = useState(null)
  const [storageType, setStorageType] = useState(() => {
    const saved = localStorage.getItem('preferredStorageType')
    return saved || STORAGE_TYPES.ONEDRIVE
  })

  // Refs for optimistic updates
  const optimisticDataRef = useRef(null)
  const lastSavedDataRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  const isOneDriveMode = storageType === STORAGE_TYPES.ONEDRIVE && isAuthenticated && isInitialized

  // Create GraphService instance
  const createGraphService = useCallback(() => {
    if (!isInitialized) {
      throw new Error('MSAL not initialized yet')
    }
    if (!isAuthenticated) {
      throw new Error('User not authenticated')
    }
    return new GraphService(getAccessToken)
  }, [isInitialized, isAuthenticated, getAccessToken])

  // Debounced save function
  const debouncedSave = useCallback((todos, showToast = false) => {
    if (!isOneDriveMode) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      if (isOnline) {
        // Inline the immediate save logic to avoid circular dependency
        try {
          setSyncStatus('syncing')
          setError(null)

          const graphService = createGraphService()
          
          // Check for conflicts before saving
          const currentFileInfo = await graphService.getTodosFileInfo()
          const lastSyncedTime = localStorage.getItem('lastOneDriveSyncTime')
          
          // Only check for conflicts if we have sync history and the file was modified significantly after our last sync
          if (currentFileInfo && lastSyncedTime) {
            const fileModified = new Date(currentFileInfo.lastModified).getTime()
            const lastSync = new Date(lastSyncedTime).getTime()
            const timeDifference = fileModified - lastSync
            
            // Only consider it a conflict if the file was modified more than 5 seconds after our last sync
            // This prevents false conflicts from small timing differences
            if (timeDifference > 5000) {
              // Conflict detected - load remote data for comparison
              const remoteTodos = await graphService.readTodos()
              setConflictInfo({
                local: todos,
                remote: remoteTodos,
                remoteModified: currentFileInfo.lastModified
              })
              
              setSyncStatus('conflict')
              showWarning('Sync conflict detected - please resolve')
              return
            }
          }

          await graphService.writeTodos(todos)
          
          // Update sync tracking
          const now = new Date().toISOString()
          localStorage.setItem('lastOneDriveSyncTime', now)
          setLastSyncTime(new Date())
          setSyncStatus('synced')
          lastSavedDataRef.current = todos

          // Show success toast only for meaningful syncs
          if (showToast) {
            showSuccess('Synced to OneDrive', 2000)
          }
        } catch (err) {
          console.error('Error saving to OneDrive:', err)
          setError(err.message)
          setSyncStatus('error')
          
          // Queue for retry if it was a network error
          if (err.message.includes('fetch') || err.message.includes('network')) {
            queueOperation({
              type: OPERATION_TYPES.SAVE_TODOS,
              data: todos
            })
            showWarning('Sync queued - will retry when online')
          } else {
            showError('Sync failed: ' + err.message)
          }
        }
      } else {
        // Queue for when we come back online
        queueOperation({
          type: OPERATION_TYPES.SAVE_TODOS,
          data: todos
        })
      }
    }, 1000) // 1 second debounce
  }, [isOneDriveMode, isOnline, createGraphService, queueOperation, showSuccess, showError, showWarning])

  // Simple immediate save function (used by conflict resolution)
  const saveToOneDriveImmediate = useCallback(async (todos, showToast = false) => {
    if (!isOneDriveMode || !isOnline) return false

    try {
      setSyncStatus('syncing')
      setError(null)

      const graphService = createGraphService()
      await graphService.writeTodos(todos)
      
      // Update sync tracking
      const now = new Date().toISOString()
      localStorage.setItem('lastOneDriveSyncTime', now)
      setLastSyncTime(new Date())
      setSyncStatus('synced')
      lastSavedDataRef.current = todos

      // Show success toast if requested
      if (showToast) {
        showSuccess('Synced to OneDrive', 2000)
      }

      return true
    } catch (err) {
      console.error('Error saving to OneDrive:', err)
      setError(err.message)
      setSyncStatus('error')
      showError('Sync failed: ' + err.message)
      return false
    }
  }, [isOneDriveMode, isOnline, createGraphService, showSuccess, showError])

  // Optimistic save - update UI immediately, sync in background
  const saveToOneDrive = useCallback((todos, showToast = true) => {
    if (!isOneDriveMode) return

    // Store optimistic data
    optimisticDataRef.current = todos
    
    // Check if data actually changed since last save
    const hasChanged = !lastSavedDataRef.current || 
      JSON.stringify(todos) !== JSON.stringify(lastSavedDataRef.current)
    
    // Trigger debounced save, only show toast if data changed and showToast is true
    debouncedSave(todos, hasChanged && showToast)
  }, [isOneDriveMode, debouncedSave])

  // Load from OneDrive
  const loadFromOneDrive = useCallback(async () => {
    if (!isOneDriveMode) return []

    try {
      setIsLoading(true)
      setSyncStatus('syncing')
      setError(null)

      const graphService = createGraphService()
      const todos = await graphService.readTodos()
      
      // Update sync tracking
      const now = new Date().toISOString()
      localStorage.setItem('lastOneDriveSyncTime', now)
      setLastSyncTime(new Date())
      setSyncStatus('synced')
      lastSavedDataRef.current = todos

      return Array.isArray(todos) ? todos : []
    } catch (err) {
      console.error('Error loading from OneDrive:', err)
      setError(err.message)
      setSyncStatus('error')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [isOneDriveMode, createGraphService])

  // Resolve conflicts
  const resolveConflict = useCallback(async (resolution, selectedTodos) => {
    if (!conflictInfo) return

    try {
      setSyncStatus('syncing')
      setError(null)

      let todosToSave = selectedTodos

      if (resolution === 'merge') {
        // Smart merge: combine both versions, prefer local for conflicts
        const mergedTodos = [...conflictInfo.remote]
        const remoteIds = new Set(conflictInfo.remote.map(t => t.id))
        
        conflictInfo.local.forEach(localTodo => {
          if (remoteIds.has(localTodo.id)) {
            // Replace remote version with local (local wins)
            const index = mergedTodos.findIndex(t => t.id === localTodo.id)
            if (index >= 0) {
              mergedTodos[index] = localTodo
            }
          } else {
            // Add new local todo
            mergedTodos.push(localTodo)
          }
        })
        
        todosToSave = mergedTodos
      }

      const success = await saveToOneDriveImmediate(todosToSave)
      
      if (success) {
        setConflictInfo(null)
        // Force update sync time to prevent immediate re-conflict
        const now = new Date().toISOString()
        localStorage.setItem('lastOneDriveSyncTime', now)
        setLastSyncTime(new Date())
        showSuccess('Conflict resolved and synced')
        return todosToSave
      }
    } catch (err) {
      setError(err.message)
      setSyncStatus('error')
    }
    
    return null
  }, [conflictInfo, saveToOneDriveImmediate])

  // Process queued operations when coming back online
  useEffect(() => {
    if (wasOffline && isOnline && queueStatus.count > 0) {
      console.log(`Processing ${queueStatus.count} queued operations...`)
      
      processQueue(async (operation) => {
        switch (operation.type) {
          case OPERATION_TYPES.SAVE_TODOS:
            await saveToOneDriveImmediate(operation.data)
            break
          default:
            console.warn('Unknown operation type:', operation.type)
        }
      }).then((result) => {
        console.log(`Queue processing completed: ${result.processed} processed, ${result.failed} failed`)
        if (result.success) {
          acknowledgeOnlineStatus()
          if (result.processed > 0) {
            showSuccess(`Synced ${result.processed} queued changes`)
          }
        } else if (result.failed > 0) {
          showError(`Failed to sync ${result.failed} changes`)
        }
      })
    }
  }, [wasOffline, isOnline, queueStatus.count, processQueue, saveToOneDriveImmediate, acknowledgeOnlineStatus])

  // Migration with better conflict handling
  const migrateToOneDrive = useCallback(async (localTodos) => {
    if (!isOneDriveMode) {
      throw new Error('Cannot migrate: not in OneDrive mode')
    }

    try {
      setIsLoading(true)
      setSyncStatus('syncing')
      setError(null)

      const graphService = createGraphService()
      
      // Check if OneDrive already has todos
      const existingTodos = await graphService.readTodos()
      
      let todosToSave = localTodos
      
      if (existingTodos && existingTodos.length > 0) {
        console.log(`Found ${existingTodos.length} existing todos in OneDrive`)
        
        // Smart merge by ID
        const mergedTodos = [...existingTodos]
        const existingIds = new Set(existingTodos.map(todo => todo.id))
        
        localTodos.forEach(localTodo => {
          if (!existingIds.has(localTodo.id)) {
            mergedTodos.push(localTodo)
          }
          // If ID exists, keep OneDrive version (assume it's more recent)
        })
        
        todosToSave = mergedTodos
        console.log(`Merged migration: ${localTodos.length} local + ${existingTodos.length} OneDrive = ${todosToSave.length} total`)
      }

      const success = await saveToOneDriveImmediate(todosToSave)
      
      if (success) {
        return todosToSave
      } else {
        throw new Error('Migration save failed')
      }
    } catch (err) {
      const errorMsg = err.message || 'Migration failed'
      setError(errorMsg)
      setSyncStatus('error')
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [isOneDriveMode, createGraphService, saveToOneDriveImmediate])

  // Switch storage type
  const switchStorageType = useCallback((type) => {
    if (Object.values(STORAGE_TYPES).includes(type)) {
      setStorageType(type)
      setSyncStatus('idle')
      setError(null)
      setConflictInfo(null)
      localStorage.setItem('preferredStorageType', type)
      
      // Clear any pending operations when switching away from OneDrive
      if (type === STORAGE_TYPES.LOCAL) {
        clearQueue()
      }
    }
  }, [clearQueue])

  // Rollback optimistic changes if sync fails
  const rollbackOptimisticChanges = useCallback(() => {
    if (lastSavedDataRef.current && optimisticDataRef.current) {
      console.log('Rolling back optimistic changes due to sync failure')
      return lastSavedDataRef.current
    }
    return null
  }, [])

  return {
    // State
    isLoading,
    error,
    syncStatus,
    lastSyncTime,
    storageType,
    isOneDriveMode,
    conflictInfo,
    
    // Network state
    isOnline,
    isOffline: !isOnline,
    queueStatus,
    
    // Actions
    loadFromOneDrive,
    saveToOneDrive,
    migrateToOneDrive,
    switchStorageType,
    resolveConflict,
    rollbackOptimisticChanges,
    acknowledgeOnlineStatus,
    
    // Constants
    STORAGE_TYPES,
  }
}