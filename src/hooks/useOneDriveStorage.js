import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import GraphService from '../services/graphService'

const STORAGE_TYPES = {
  LOCAL: 'localStorage',
  ONEDRIVE: 'oneDrive'
}

export const useOneDriveStorage = () => {
  const { isAuthenticated, getAccessToken, isInitialized } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, synced, error
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [storageType, setStorageType] = useState(() => {
    // Load storage preference from localStorage on initialization
    const saved = localStorage.getItem('preferredStorageType')
    return saved || STORAGE_TYPES.LOCAL
  })

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

  // Test OneDrive connection
  const testConnection = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const graphService = createGraphService()
      const result = await graphService.testConnection()
      
      if (result.success) {
        console.log('OneDrive connection successful:', result.user)
      }
      
      return result
    } catch (err) {
      const errorMsg = err.message || 'Connection test failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, createGraphService])

  // Load todos from OneDrive
  const loadFromOneDrive = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated')
    }

    try {
      setIsLoading(true)
      setSyncStatus('syncing')
      setError(null)

      const graphService = createGraphService()
      const todos = await graphService.readTodos()
      
      setSyncStatus('synced')
      setLastSyncTime(new Date())
      
      return Array.isArray(todos) ? todos : []
    } catch (err) {
      const errorMsg = err.message || 'Failed to load from OneDrive'
      setError(errorMsg)
      setSyncStatus('error')
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, createGraphService])

  // Save todos to OneDrive
  const saveToOneDrive = useCallback(async (todos) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated')
    }

    if (!Array.isArray(todos)) {
      throw new Error('Todos must be an array')
    }

    try {
      setIsLoading(true)
      setSyncStatus('syncing')
      setError(null)

      const graphService = createGraphService()
      await graphService.writeTodos(todos)
      
      setSyncStatus('synced')
      setLastSyncTime(new Date())
      
      console.log(`Successfully saved ${todos.length} todos to OneDrive`)
    } catch (err) {
      const errorMsg = err.message || 'Failed to save to OneDrive'
      setError(errorMsg)
      setSyncStatus('error')
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, createGraphService])

  // Get file metadata
  const getFileInfo = useCallback(async () => {
    if (!isAuthenticated) {
      return null
    }

    try {
      const graphService = createGraphService()
      return await graphService.getTodosFileInfo()
    } catch (err) {
      console.error('Failed to get file info:', err)
      return null
    }
  }, [isAuthenticated, createGraphService])

  // Migrate from localStorage to OneDrive
  const migrateToOneDrive = useCallback(async (localTodos) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated')
    }

    try {
      setIsLoading(true)
      setSyncStatus('syncing')
      setError(null)

      // First check if OneDrive already has todos
      const graphService = createGraphService()
      const existingTodos = await graphService.readTodos()
      
      let todosToSave = localTodos
      
      // If OneDrive has todos, merge them (OneDrive takes precedence for conflicts)
      if (existingTodos && existingTodos.length > 0) {
        console.log(`Found ${existingTodos.length} existing todos in OneDrive`)
        
        // Simple merge: combine todos and remove duplicates by id
        const combinedTodos = [...existingTodos]
        const existingIds = new Set(existingTodos.map(todo => todo.id))
        
        localTodos.forEach(localTodo => {
          if (!existingIds.has(localTodo.id)) {
            combinedTodos.push(localTodo)
          }
        })
        
        todosToSave = combinedTodos
        console.log(`Merged todos: ${localTodos.length} local + ${existingTodos.length} OneDrive = ${todosToSave.length} total`)
      } else {
        console.log(`Migrating ${localTodos.length} todos from localStorage to OneDrive`)
      }

      await graphService.writeTodos(todosToSave)
      
      setStorageType(STORAGE_TYPES.ONEDRIVE)
      setSyncStatus('synced')
      setLastSyncTime(new Date())
      
      return todosToSave
    } catch (err) {
      const errorMsg = err.message || 'Migration failed'
      setError(errorMsg)
      setSyncStatus('error')
      throw new Error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, createGraphService])

  // Switch storage type
  const switchStorageType = useCallback((type) => {
    if (Object.values(STORAGE_TYPES).includes(type)) {
      setStorageType(type)
      setSyncStatus('idle')
      setError(null)
      // Persist storage preference
      localStorage.setItem('preferredStorageType', type)
    }
  }, [])

  return {
    // State
    isLoading,
    error,
    syncStatus,
    lastSyncTime,
    storageType,
    isOneDriveMode: storageType === STORAGE_TYPES.ONEDRIVE && isAuthenticated && isInitialized,
    
    // Actions
    testConnection,
    loadFromOneDrive,
    saveToOneDrive,
    getFileInfo,
    migrateToOneDrive,
    switchStorageType,
    
    // Constants
    STORAGE_TYPES,
  }
}