import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToastContext } from '../context/ToastContext'
import GraphService from '../services/graphService'
import { withErrorHandling, getErrorMessage, logError } from '../utils/oneDriveErrorHandling'
import { smartSyncResolve, createSmartConflictInfo, filterActiveTodos, cleanupOldTombstones } from '../utils/smartSyncConflictDetection'

/**
 * Core OneDrive operations hook - handles save, load, and conflict resolution
 */
export const useOneDriveOperations = () => {
  const { isAuthenticated, getAccessToken, isInitialized } = useAuth()
  const { showSuccess, showError, showWarning } = useToastContext()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [conflictInfo, setConflictInfo] = useState(null)
  
  // Track last saved data for change detection
  const lastSavedDataRef = useRef(null)
  // Track todos that were explicitly deleted locally
  const deletedTodoIdsRef = useRef(new Set())

  /**
   * Mark a todo as deleted locally
   */
  const markAsDeleted = useCallback((todoId) => {
    deletedTodoIdsRef.current.add(todoId)
    console.log(`🗑️ Todo ${todoId} marked as deleted locally`)
  }, [])

  /**
   * Clear deletion tracking (after successful sync)
   */
  const clearDeletedTracking = useCallback(() => {
    deletedTodoIdsRef.current.clear()
    console.log('✅ Cleared deletion tracking after sync')
  }, [])

  /**
   * Smart conflict check using timestamps - no complex tracking needed
   */
  const checkForRemoteConflicts = useCallback(async (localTodos, graphService) => {
    try {
      console.log('🧠 Smart sync conflict check...', {
        localCount: localTodos.length
      })
      
      // Load current remote state (includes tombstones)
      const remoteResult = await graphService.readTodos()
      const allRemoteTodos = remoteResult?.todos || remoteResult || []
      
      // If no remote data exists, just use local data
      if (!allRemoteTodos || allRemoteTodos.length === 0) {
        console.log('✅ No remote data - using local todos')
        return { resolved: localTodos }
      }
      
      // Use smart sync resolution with tombstone support
      const result = smartSyncResolve(localTodos, allRemoteTodos, deletedTodoIdsRef.current)
      
      if (result.hasConflicts) {
        console.log(`⚠️ Found ${result.conflicts.length} true simultaneous conflicts`)
        return {
          conflicts: createSmartConflictInfo(result.conflicts, localTodos, allRemoteTodos)
        }
      } else {
        console.log(`✅ Smart sync complete - resolved ${result.resolved.length} todos automatically`)
        return {
          resolved: result.resolved
        }
      }
      
    } catch (error) {
      console.error('Error in smart sync check:', error)
      throw new Error(`Smart sync failed: ${error.message}`)
    }
  }, [])

  // Create graph service instance
  const createGraphService = useCallback(() => {
    if (!isAuthenticated || !isInitialized) return null
    // Pass the getAccessToken function, not the token itself
    return new GraphService(getAccessToken)
  }, [isAuthenticated, isInitialized, getAccessToken])

  /**
   * Save todos to OneDrive immediately
   */
  const saveToOneDriveImmediate = useCallback(async (todos, showToast = false) => {
    if (!isAuthenticated || !isInitialized) {
      throw new Error('Not authenticated with OneDrive')
    }

    const operation = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const graphService = createGraphService()
        if (!graphService) throw new Error('Unable to create Graph service')

        // Smart sync with timestamp-based conflict detection
        console.log('🧠 Smart sync before save...', { todosCount: todos.length })
        const syncResult = await checkForRemoteConflicts(todos, graphService)
        
        if (syncResult?.conflicts) {
          console.log('⚠️ True conflicts detected - simultaneous edits need resolution')
          setConflictInfo(syncResult.conflicts)
          return null // Don't save, let user resolve conflicts first
        }

        // Use auto-resolved todos from smart sync (includes both active todos and tombstones)
        let todosToSave = syncResult?.resolved || todos
        
        // Clean up old tombstones before saving
        todosToSave = cleanupOldTombstones(todosToSave)
        
        await graphService.writeTodos(todosToSave)
        
        // Update tracking data and clear deletion tracking after successful sync
        lastSavedDataRef.current = todosToSave
        clearDeletedTracking() // Clear deletion tracking since it's now synced
        
        if (showToast) {
          showSuccess('Synced successfully to OneDrive')
        }
        
        return todos
      } catch (err) {
        logError(err, 'save', { todosCount: todos.length })
        
        // Handle conflicts specially
        if (err.message?.includes('conflict') || err.status === 409) {
          const conflictData = await handleSyncConflict(todos)
          if (conflictData) {
            setConflictInfo(conflictData)
            return null // Caller should handle conflict resolution
          }
        }
        
        if (showToast) {
          showError(`Sync failed: ${getErrorMessage(err)}`)
        }
        throw err
      } finally {
        setIsLoading(false)
      }
    }

    return withErrorHandling(operation, 'save', {
      retry: true,
      maxRetries: 3,
      onError: (err) => setError(err)
    })
  }, [isAuthenticated, isInitialized, createGraphService, showSuccess, showError])

  /**
   * Load todos from OneDrive
   */
  const loadFromOneDrive = useCallback(async () => {
    if (!isAuthenticated || !isInitialized) {
      throw new Error('Not authenticated with OneDrive')
    }

    const operation = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const graphService = createGraphService()
        if (!graphService) throw new Error('Unable to create Graph service')

        const result = await graphService.readTodos()
        
        // Handle new return format with metadata
        const allTodos = result.todos || result || []
        const lastModified = result.lastModified || null
        
        // Separate active todos from tombstones
        const activeTodos = filterActiveTodos(allTodos)
        
        // Update tracking data with ALL todos (including tombstones for sync)
        lastSavedDataRef.current = allTodos
        
        console.log(`📥 Loaded: ${activeTodos.length} active todos, ${allTodos.length - activeTodos.length} tombstones`)
        
        // Return only active todos for the UI
        return { todos: activeTodos, lastModified }
      } catch (err) {
        logError(err, 'load')
        
        // File not found is acceptable for initial setup
        if (err.status === 404) {
          return []
        }
        
        showError(`Failed to load from OneDrive: ${getErrorMessage(err)}`)
        throw err
      } finally {
        setIsLoading(false)
      }
    }

    return withErrorHandling(operation, 'load', {
      retry: true,
      maxRetries: 2,
      onError: (err) => setError(err)
    })
  }, [isAuthenticated, isInitialized, createGraphService, showError])

  /**
   * Handle sync conflicts
   */
  const handleSyncConflict = useCallback(async (localTodos) => {
    try {
      const graphService = createGraphService()
      if (!graphService) return null

      const remoteResult = await graphService.readTodos()
      const allRemoteTodos = remoteResult?.todos || remoteResult || []
      
      // Filter out tombstones for conflict UI - we only want to show active todos in the count
      const remoteTodos = allRemoteTodos.filter(todo => !todo.deleted)
      const localActiveTodos = localTodos.filter(todo => !todo.deleted)
      
      return {
        local: localActiveTodos,
        remote: remoteTodos,
        timestamp: Date.now()
      }
    } catch (err) {
      logError(err, 'conflict-detection')
      return null
    }
  }, [createGraphService])

  /**
   * Resolve sync conflict
   */
  const resolveConflict = useCallback(async (resolution, selectedTodos) => {
    if (!conflictInfo) return null

    try {
      setIsLoading(true)
      let resolvedTodos = []

      switch (resolution) {
        case 'use_local':
          resolvedTodos = conflictInfo.local
          break
        case 'use_remote':
          resolvedTodos = conflictInfo.remote
          break
        case 'merge':
          resolvedTodos = selectedTodos || []
          break
        default:
          throw new Error('Invalid conflict resolution option')
      }

      // Save resolved todos to OneDrive
      await saveToOneDriveImmediate(resolvedTodos, false)
      
      // Clear conflict state
      setConflictInfo(null)
      
      showSuccess('Conflict resolved successfully')
      return resolvedTodos
    } catch (err) {
      logError(err, 'conflict-resolution', { resolution })
      showError(`Failed to resolve conflict: ${getErrorMessage(err)}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [conflictInfo, saveToOneDriveImmediate, showSuccess, showError])

  /**
   * Migrate local todos to OneDrive
   */
  const migrateToOneDrive = useCallback(async (localTodos) => {
    if (!Array.isArray(localTodos) || localTodos.length === 0) {
      return []
    }

    try {
      setIsLoading(true)
      
      // First try to load existing OneDrive data
      let existingTodos = []
      try {
        existingTodos = await loadFromOneDrive()
      } catch (err) {
        // Ignore load errors during migration - we'll create a new file
      }

      // Merge local and remote todos, prioritizing local
      const todoMap = new Map()
      
      // Add existing remote todos first
      existingTodos.forEach(todo => {
        if (todo.id) todoMap.set(todo.id, todo)
      })
      
      // Add local todos, overriding any duplicates
      localTodos.forEach(todo => {
        if (todo.id) todoMap.set(todo.id, todo)
      })

      const mergedTodos = Array.from(todoMap.values())
      
      // Save merged todos to OneDrive
      await saveToOneDriveImmediate(mergedTodos, false)
      
      showSuccess(`Migrated ${localTodos.length} todos to OneDrive`)
      return mergedTodos
    } catch (err) {
      logError(err, 'migration', { localCount: localTodos.length })
      showError(`Migration failed: ${getErrorMessage(err)}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [loadFromOneDrive, saveToOneDriveImmediate, showSuccess, showError])

  /**
   * Rollback optimistic changes
   */
  const rollbackOptimisticChanges = useCallback(() => {
    if (lastSavedDataRef.current) {
      optimisticDataRef.current = null
      return lastSavedDataRef.current
    }
    return null
  }, [])

  /**
   * Check if data has changed since last save
   */
  const hasDataChanged = useCallback((todos) => {
    if (!lastSavedDataRef.current) return true
    return JSON.stringify(todos) !== JSON.stringify(lastSavedDataRef.current)
  }, [])

  return {
    // Operations
    saveToOneDriveImmediate,
    loadFromOneDrive,
    resolveConflict,
    migrateToOneDrive,
    rollbackOptimisticChanges,
    
    // Deletion tracking
    markAsDeleted,
    clearDeletedTracking,
    
    // State
    isLoading,
    error,
    conflictInfo,
    
    // Utilities
    hasDataChanged,
    createGraphService
  }
}