import { useState, useEffect, useCallback, useRef } from 'react'
import { useEnhancedOneDriveStorage } from './useEnhancedOneDriveStorage'
import { useDataIntegrity } from './useDataIntegrity'
import { useAuth } from '../context/AuthContext'
import { useTodoOperations } from './useTodoOperations'
import { useTodoSearch } from './useTodoSearch'
import { useTodoTextParser } from './useTodoTextParser'
import { smartMergeTodos, createConflictInfo } from '../utils/conflictDetection'

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
  
  // OneDrive storage (always enabled since we simplified storage choice)
  const oneDriveStorage = useEnhancedOneDriveStorage()
  const {
    saveToOneDrive,
    saveImmediately,
    loadFromOneDrive,
    resolveConflict,
    migrateToOneDrive,
    rollbackOptimisticChanges,
    markAsDeleted,
    clearDeletedTracking,
    createGraphService,
    syncStatus,
    lastSyncTime,
    isLoading,
    error,
    conflictInfo,
    isOnline,
    queueStatus
  } = oneDriveStorage

  // Simple callback for user changes - no complex tracking needed
  const onTodoModified = useCallback((todoId) => {
    onUserChange()
  }, [onUserChange])

  // Callback for when todo is deleted
  const onTodoDeleted = useCallback((todoId) => {
    if (markAsDeleted) {
      markAsDeleted(todoId)
    }
    onUserChange()
  }, [markAsDeleted, onUserChange])
  
  // Initialize focused sub-hooks  
  const operations = useTodoOperations(todos, setTodos, onTodoModified, onTodoDeleted)
  const search = useTodoSearch(todos)
  const textParser = useTodoTextParser()

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
          // Filter out tombstones from localStorage - they should never be in the UI
          const activeTodos = cleaned.filter(todo => !todo.deleted)
          setTodos(activeTodos)
          // Re-save localStorage without tombstones to clean it up
          if (activeTodos.length !== cleaned.length) {
            localStorage.setItem('todos', JSON.stringify(activeTodos))
            console.log(`🧹 Cleaned up ${cleaned.length - activeTodos.length} tombstones from localStorage`)
          }
          return activeTodos
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
      const oneDriveActiveTodos = oneDriveResult?.todos || oneDriveResult || []
      const oneDriveLastModified = oneDriveResult?.lastModified || null
      
      // Also load complete OneDrive data (including tombstones) for smart sync
      const graphService = createGraphService ? createGraphService() : null
      let oneDriveCompleteTodos = []
      if (graphService) {
        try {
          const completeResult = await graphService.readTodos()
          oneDriveCompleteTodos = completeResult?.todos || completeResult || []
          console.log(`📊 OneDrive complete data: ${oneDriveCompleteTodos.length} total (${oneDriveActiveTodos.length} active)`)
        } catch (error) {
          console.error('Failed to load complete OneDrive data:', error)
          oneDriveCompleteTodos = oneDriveActiveTodos // Fallback to active todos only
        }
      } else {
        oneDriveCompleteTodos = oneDriveActiveTodos // Fallback if no graph service
      }
      
      const currentLocalTodos = todos // Use current todos state, not loadTodos()
      
      console.log('OneDrive todos:', oneDriveActiveTodos?.length || 0, 'Local todos:', currentLocalTodos?.length || 0)
      
      if (oneDriveActiveTodos && oneDriveActiveTodos.length > 0) {
        // OneDrive has data - use smart merge to detect real conflicts
        if (currentLocalTodos.length === 0) {
          // Local is empty, use OneDrive data
          console.log('Local empty, loading OneDrive data')
          setIsSyncing(true)
          setTodos(oneDriveActiveTodos)
          localStorage.setItem('todos', JSON.stringify(oneDriveActiveTodos))
          setIsSyncing(false)
        } else {
          // Both have data - perform smart sync
          console.log('Performing smart sync of local and OneDrive data')
          const { smartSyncResolve, createSmartConflictInfo } = await import('../utils/smartSyncConflictDetection')
          const syncResult = smartSyncResolve(currentLocalTodos, oneDriveCompleteTodos)
          
          console.log('Smart sync result:', syncResult.summary)
          
          if (syncResult.hasConflicts) {
            // True simultaneous conflicts - show resolution UI
            console.log('Simultaneous edit conflicts detected:', syncResult.conflicts.length)
            
            setLocalConflictInfo(createSmartConflictInfo(
              syncResult.conflicts,
              currentLocalTodos,
              oneDriveCompleteTodos
            ))
            return
          } else {
            // No conflicts - apply smart sync result
            console.log(`Smart sync successful: ${syncResult.autoResolved} auto-resolved`)
            setIsSyncing(true)
            
            // Filter out tombstones before setting to UI state
            const { filterActiveTodos } = await import('../utils/smartSyncConflictDetection')
            const activeTodos = filterActiveTodos(syncResult.resolved)
            
            setTodos(activeTodos)
            localStorage.setItem('todos', JSON.stringify(activeTodos))
            
            // Save smart sync result back to OneDrive to ensure consistency (includes tombstones)
            saveToOneDrive(syncResult.resolved, false)
            setIsSyncing(false)
          }
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
   * Handle conflict resolution for new simplified system
   */
  const handleConflictResolution = useCallback(async (resolution, selectedTodos) => {
    try {
      // Handle conflicts from new smart sync system
      if (localConflictInfo && localConflictInfo.type === 'smart-sync-conflict') {
        console.log('🧠 Resolving smart sync conflicts:', resolution)
        
        // Start with the resolved todos from the conflict detection
        let finalTodos = [...(localConflictInfo.local || todos)]
        const conflictIds = new Set()
        
        // Process each conflict based on resolution choice
        for (const conflict of localConflictInfo.conflicts) {
          conflictIds.add(conflict.id)
          
          let resolvedTodo
          switch (resolution) {
            case 'local':
            case 'use_local':
              resolvedTodo = conflict.local
              console.log(`Using local version for todo ${conflict.id}: "${conflict.local.text}"`)
              break
            case 'remote':
            case 'use_remote':
              resolvedTodo = conflict.remote
              console.log(`Using remote version for todo ${conflict.id}: "${conflict.remote.text}"`)
              break
            case 'merge':
            case 'field-based':
              // For simplified system, selectedTodos should contain resolved todos
              resolvedTodo = selectedTodos?.find(t => t.id === conflict.id) || conflict.local
              console.log(`Using merged version for todo ${conflict.id}: "${resolvedTodo.text}"`)
              break
            default:
              throw new Error(`Invalid conflict resolution option: ${resolution}`)
          }
          
          // Replace the todo in finalTodos
          finalTodos = finalTodos.map(todo => 
            todo.id === conflict.id ? resolvedTodo : todo
          )
        }
        
        // Update state first
        setIsSyncing(true)
        setTodos(finalTodos)
        localStorage.setItem('todos', JSON.stringify(finalTodos))
        
        // Save resolved todos directly - smart sync won't re-conflict since we resolved them
        try {
          await saveImmediately(finalTodos, false) // Use immediate save to bypass smart sync checks
          console.log('✅ Smart sync conflict resolution saved successfully')
        } catch (error) {
          console.error('❌ Failed to save smart sync resolution:', error)
          throw error
        }
        
        setLocalConflictInfo(null) // Clear conflict state
        setIsSyncing(false)
        
        return finalTodos
      }
      
      // Handle conflicts from OneDrive operations
      if (resolveConflict) {
        const resolvedTodos = await resolveConflict(resolution, selectedTodos)
        if (resolvedTodos) {
          // Filter out tombstones from conflict resolution result
          const activeTodos = resolvedTodos.filter(todo => !todo.deleted)
          setTodos(activeTodos)
          localStorage.setItem('todos', JSON.stringify(activeTodos))
          return activeTodos
        }
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error)
      throw error
    }
  }, [resolveConflict, localConflictInfo, saveImmediately, todos])

  /**
   * Enhanced migration function
   */
  const handleMigration = useCallback(async (localTodos) => {
    try {
      const migratedTodos = await migrateToOneDrive(localTodos)
      // Filter out any tombstones that might have been included
      const activeTodos = migratedTodos.filter(todo => !todo.deleted)
      setTodos(activeTodos)
      localStorage.setItem('todos', JSON.stringify(activeTodos))
      return activeTodos
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

  // PWA visibility change sync - trigger sync when app becomes visible after being hidden
  useEffect(() => {
    let lastSyncCheck = Date.now()
    
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && isLoaded) {
        const timeSinceLastCheck = Date.now() - lastSyncCheck
        // Only sync if app was hidden for more than 30 seconds to avoid excessive syncing
        if (timeSinceLastCheck > 30000) {
          console.log('App became visible after', Math.round(timeSinceLastCheck / 1000), 'seconds - triggering sync')
          const timeoutId = setTimeout(syncOnModeChangeRef.current, 1000)
          // Update last sync check time
          lastSyncCheck = Date.now()
          return () => clearTimeout(timeoutId)
        } else {
          console.log('App became visible but too soon since last check (', Math.round(timeSinceLastCheck / 1000), 'seconds) - skipping sync')
        }
        lastSyncCheck = Date.now()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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