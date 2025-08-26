import { useState, useEffect, useCallback, useRef } from 'react'
import { useEnhancedOneDriveStorage } from './useEnhancedOneDriveStorage'
import { useDataIntegrity } from './useDataIntegrity'
import { useAuth } from '../context/AuthContext'
import { useTodoOperations } from './useTodoOperations'
import { useTodoSearch } from './useTodoSearch'
import { useTodoTextParser } from './useTodoTextParser'

/**
 * Main todos hook - simplified by composing focused sub-hooks
 */
const useTodos = () => {
  const [todos, setTodos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const { isAuthenticated } = useAuth()
  const { syncHealthScore, validateTodos, cleanupTodos } = useDataIntegrity(todos, true) // Always use OneDrive mode
  
  const onUserChange = useCallback(() => {
    console.log('User made changes - will sync to OneDrive')
    setHasUserMadeChanges(true)
    // Track when local data was last modified
    localStorage.setItem('lastLocalModified', Date.now().toString())
  }, [])
  
  // Initialize focused sub-hooks
  const operations = useTodoOperations(todos, setTodos, onUserChange)
  const search = useTodoSearch(todos)
  const textParser = useTodoTextParser()
  
  // OneDrive storage (always enabled since we simplified storage choice)
  const oneDriveStorage = useEnhancedOneDriveStorage()
  const {
    saveToOneDrive,
    loadFromOneDrive,
    resolveConflict,
    migrateToOneDrive,
    rollbackOptimisticChanges,
    syncStatus,
    lastSyncTime,
    isLoading,
    error,
    conflictInfo,
    isOnline,
    queueStatus
  } = oneDriveStorage

  // Local conflict state to handle conflicts detected during comparison
  const [localConflictInfo, setLocalConflictInfo] = useState(null)

  // Log sync status changes for debugging
  useEffect(() => {
    console.log('Sync status changed to:', syncStatus)
  }, [syncStatus])

  /**
   * Load todos from storage
   */
  const loadTodos = useCallback(() => {
    try {
      const savedTodos = localStorage.getItem('todos')
      if (savedTodos) {
        const parsed = JSON.parse(savedTodos)
        if (Array.isArray(parsed)) {
          const cleaned = cleanupTodos(parsed)
          setTodos(cleaned)
          return cleaned
        }
      }
      return []
    } catch (error) {
      console.error('Failed to load todos from localStorage:', error)
      return []
    }
  }, [cleanupTodos])

  /**
   * Save todos to localStorage and sync to OneDrive if needed
   */
  const saveTodos = useCallback(async (todosToSave, fromUserAction = false) => {
    try {
      localStorage.setItem('todos', JSON.stringify(todosToSave))
      
      // Only sync to OneDrive if this was a user action and we're authenticated
      if (isAuthenticated && fromUserAction) {
        console.log('Triggering OneDrive sync for user action. Current syncStatus:', syncStatus)
        saveToOneDrive(todosToSave, true) // Show toast for user actions
      } else {
        console.log('Skipping OneDrive sync - isAuthenticated:', isAuthenticated, 'fromUserAction:', fromUserAction)
      }
    } catch (error) {
      console.error('Failed to save todos:', error)
    }
  }, [isAuthenticated, saveToOneDrive])

  /**
   * Handle authentication changes and sync - with proper conflict detection
   */
  const syncOnModeChange = useCallback(async () => {
    if (!isAuthenticated || !isLoaded) {
      console.log('Skipping sync - not ready:', { isAuthenticated, isLoaded })
      return
    }

    try {
      // Load from OneDrive to check for any existing data
      console.log('Loading from OneDrive...')
      const oneDriveResult = await loadFromOneDrive()
      const oneDriveTodos = oneDriveResult?.todos || oneDriveResult || []
      const oneDriveLastModified = oneDriveResult?.lastModified || null
      const currentLocalTodos = todos // Use current todos state, not loadTodos()
      
      console.log('OneDrive todos:', oneDriveTodos?.length || 0, 'Local todos:', currentLocalTodos?.length || 0)
      
      if (oneDriveTodos && oneDriveTodos.length > 0) {
        // OneDrive has data - compare with current local data
        const localDataString = JSON.stringify(currentLocalTodos)
        const oneDriveDataString = JSON.stringify(oneDriveTodos)
        
        if (localDataString !== oneDriveDataString) {
          if (currentLocalTodos.length === 0) {
            // Local is empty, use OneDrive data
            console.log('Local empty, loading OneDrive data')
            setIsSyncing(true)
            setTodos(oneDriveTodos)
            localStorage.setItem('todos', JSON.stringify(oneDriveTodos))
            setIsSyncing(false)
          } else {
            // Both have data but they're different - trigger conflict resolution
            console.log('Conflict detected - both local and OneDrive have different data')
            // Set conflict info to trigger the modal
            // Get last local modification time
            const lastLocalModified = localStorage.getItem('lastLocalModified')
            const localModified = lastLocalModified ? parseInt(lastLocalModified) : Date.now()
            
            setLocalConflictInfo({
              local: currentLocalTodos,
              remote: oneDriveTodos,
              localModified: localModified,
              remoteModified: oneDriveLastModified || Date.now(), // Use actual OneDrive modification time
              timestamp: Date.now()
            })
            return
          }
        } else {
          console.log('Local and OneDrive data are identical - no sync needed')
        }
      } else {
        // OneDrive is empty, migrate local data if it exists
        if (currentLocalTodos.length > 0) {
          console.log('OneDrive empty, migrating local data')
          setIsSyncing(true)
          const migratedTodos = await migrateToOneDrive(currentLocalTodos)
          if (migratedTodos && migratedTodos.length > 0) {
            setTodos(migratedTodos)
            localStorage.setItem('todos', JSON.stringify(migratedTodos))
          }
          setIsSyncing(false)
        }
      }
    } catch (error) {
      console.error('Sync on mode change failed:', error)
      // Keep current local data on error
    }
  }, [isAuthenticated, isLoaded, todos, migrateToOneDrive, loadFromOneDrive])

  /**
   * Handle conflict resolution
   */
  const handleConflictResolution = useCallback(async (resolution, selectedTodos) => {
    try {
      // Handle local conflicts detected during comparison
      if (localConflictInfo) {
        let resolvedTodos = []
        
        switch (resolution) {
          case 'local':
          case 'use_local':
            resolvedTodos = localConflictInfo.local
            break
          case 'remote':
          case 'use_remote':
            resolvedTodos = localConflictInfo.remote
            break
          case 'merge':
            resolvedTodos = selectedTodos || []
            break
          default:
            throw new Error(`Invalid conflict resolution option: ${resolution}`)
        }
        
        // Update state and save to both localStorage and OneDrive
        setIsSyncing(true)
        setTodos(resolvedTodos)
        localStorage.setItem('todos', JSON.stringify(resolvedTodos))
        await saveToOneDrive(resolvedTodos, false) // Force sync the resolved data
        setLocalConflictInfo(null) // Clear conflict
        setIsSyncing(false)
        
        return resolvedTodos
      }
      
      // Handle conflicts from OneDrive operations
      if (resolveConflict) {
        const resolvedTodos = await resolveConflict(resolution, selectedTodos)
        if (resolvedTodos) {
          setTodos(resolvedTodos)
          localStorage.setItem('todos', JSON.stringify(resolvedTodos))
          return resolvedTodos
        }
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error)
      throw error
    }
  }, [resolveConflict, localConflictInfo, saveToOneDrive])

  /**
   * Enhanced migration function
   */
  const handleMigration = useCallback(async (localTodos) => {
    try {
      const migratedTodos = await migrateToOneDrive(localTodos)
      setTodos(migratedTodos)
      localStorage.setItem('todos', JSON.stringify(migratedTodos))
      return migratedTodos
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }, [migrateToOneDrive])

  // Initial load
  useEffect(() => {
    const initialTodos = loadTodos()
    setTodos(initialTodos)
    setIsLoaded(true)
    
    // Initialize lastLocalModified if not already set and we have todos
    if (initialTodos.length > 0 && !localStorage.getItem('lastLocalModified')) {
      localStorage.setItem('lastLocalModified', Date.now().toString())
    }
  }, [loadTodos])

  // Use ref to track previous todos to avoid unnecessary saves
  const previousTodosRef = useRef(null)
  const saveTodosRef = useRef(saveTodos)
  saveTodosRef.current = saveTodos

  // Auto-save when todos actually change (only to localStorage, not OneDrive)
  useEffect(() => {
    if (isLoaded && todos.length >= 0 && !isSyncing) {
      // Only save if todos actually changed
      const todosString = JSON.stringify(todos)
      const previousTodosString = previousTodosRef.current
      
      if (previousTodosString !== todosString) {
        console.log('Todos changed - auto-save triggered. hasUserMadeChanges:', hasUserMadeChanges, 'isSyncing:', isSyncing)
        previousTodosRef.current = todosString
        
        // Capture current value of hasUserMadeChanges to avoid stale closure
        const shouldSyncToOneDrive = hasUserMadeChanges
        
        const timeoutId = setTimeout(() => {
          saveTodosRef.current(todos, shouldSyncToOneDrive)
          if (shouldSyncToOneDrive) {
            console.log('Resetting hasUserMadeChanges flag after save')
            setHasUserMadeChanges(false) // Reset flag after sync
          }
        }, 500)
        return () => clearTimeout(timeoutId)
      } else {
        console.log('Todos unchanged - skipping auto-save')
      }
    } else if (isSyncing) {
      console.log('Skipping auto-save - currently syncing')
    }
  }, [todos, isLoaded, isSyncing])

  // Track previous authentication state to only sync when it changes
  const prevAuthRef = useRef(isAuthenticated)
  const syncOnModeChangeRef = useRef(syncOnModeChange)
  syncOnModeChangeRef.current = syncOnModeChange

  // Sync when authentication changes
  useEffect(() => {
    const prevAuth = prevAuthRef.current
    prevAuthRef.current = isAuthenticated
    
    // Only sync if authentication state actually changed and we're now authenticated and loaded
    if (isLoaded && isAuthenticated && prevAuth !== isAuthenticated) {
      console.log('Authentication changed - triggering sync')
      const timeoutId = setTimeout(syncOnModeChangeRef.current, 1000)
      return () => clearTimeout(timeoutId)
    } else {
      console.log('Skipping sync - no auth change or not ready. isLoaded:', isLoaded, 'isAuth:', isAuthenticated, 'prevAuth:', prevAuth)
    }
  }, [isAuthenticated, isLoaded])

  return {
    // Core state
    todos: search.isSearchActive ? search.filteredTodos : todos,
    allTodos: todos, // Alias for backward compatibility
    setTodos,
    isLoaded,

    // Search functionality
    searchTodos: search.setSearchQuery,
    clearSearch: search.clearSearch,
    searchActive: search.isSearchActive,
    searchQuery: search.searchQuery,

    // CRUD operations
    ...operations,

    // Text parsing utilities
    ...textParser,

    // Storage and sync
    saveTodos,
    loadTodos,
    handleConflictResolution,
    handleMigration,
    rollbackOptimisticChanges,

    // Sync status
    syncStatus,
    lastSyncTime,
    isLoading,
    error,
    conflictInfo: localConflictInfo || conflictInfo, // Use local conflict if present, otherwise OneDrive conflict
    isOnline,
    queueStatus,
    syncHealthScore,

    // Data integrity
    validateTodos,
    cleanupTodos
  }
}

export default useTodos