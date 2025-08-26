import { useState, useEffect } from 'react'
import { DEFAULT_PRIORITY } from '../utils/priority'
import { useEnhancedOneDriveStorage } from './useEnhancedOneDriveStorage'
import { useDataIntegrity } from './useDataIntegrity'
import { useAuth } from '../context/AuthContext'

const useTodos = () => {
  const [todos, setTodos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTodos, setFilteredTodos] = useState([])
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false)
  
  // Enhanced OneDrive integration
  const { isAuthenticated } = useAuth()
  const {
    isOneDriveMode,
    storageType,
    syncStatus,
    loadFromOneDrive,
    saveToOneDrive,
    conflictInfo,
    resolveConflict,
    rollbackOptimisticChanges,
    isOnline,
    queueStatus,
    migrateToOneDrive,
    switchStorageType,
    STORAGE_TYPES
  } = useEnhancedOneDriveStorage()

  // Data integrity monitoring
  const { syncHealthScore, validateTodos, cleanupTodos } = useDataIntegrity(todos, isOneDriveMode)

  // Utility functions
  const extractTagsAndText = (text) => {
    const tagRegex = /#\w+/g
    const priorityRegex = /!([1-5])/g
    
    const tags = (text.match(tagRegex) || []).map(tag => tag.substring(1))
    
    // Extract priority (take the last one if multiple)
    const priorityMatches = text.match(priorityRegex)
    const priority = priorityMatches ? parseInt(priorityMatches[priorityMatches.length - 1].substring(1)) : DEFAULT_PRIORITY
    
    // Remove tags and priority from text
    const cleanText = text.replace(tagRegex, '').replace(priorityRegex, '').trim().replace(/\s+/g, ' ')
    
    return { text: cleanText, tags, priority }
  }

  const reconstructTextWithTags = (text, tags, priority) => {
    const tagString = tags.length > 0 ? ' ' + tags.map(tag => `#${tag}`).join(' ') : ''
    const priorityString = priority && priority !== DEFAULT_PRIORITY ? ` !${priority}` : ''
    return text + tagString + priorityString
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Search and filter functionality
  const parseSearchQuery = (query) => {
    const terms = {
      text: [],
      tags: [],
      priorities: [],
      completed: null
    }

    const parts = query.split(/\s+/)
    
    parts.forEach(part => {
      if (part.startsWith('#')) {
        terms.tags.push(part.substring(1).toLowerCase())
      } else if (part.startsWith('!') && /^!\d$/.test(part)) {
        terms.priorities.push(parseInt(part.substring(1)))
      } else if (part.startsWith('completed:')) {
        const value = part.split(':')[1]
        terms.completed = value === 'true'
      } else if (part.trim()) {
        terms.text.push(part.toLowerCase())
      }
    })

    return terms
  }

  const filterTodos = (query) => {
    if (!query.trim()) {
      setFilteredTodos([])
      setSearchQuery('')
      return
    }

    const terms = parseSearchQuery(query)
    setSearchQuery(query)

    const filtered = todos.filter(todo => {
      // Text search
      if (terms.text.length > 0) {
        const todoText = todo.text.toLowerCase()
        const hasAllTextTerms = terms.text.every(term => todoText.includes(term))
        if (!hasAllTextTerms) return false
      }

      // Tag filter
      if (terms.tags.length > 0) {
        const todoTags = (todo.tags || []).map(tag => tag.toLowerCase())
        const hasAllTags = terms.tags.every(tag => todoTags.includes(tag))
        if (!hasAllTags) return false
      }

      // Priority filter
      if (terms.priorities.length > 0) {
        const todoPriority = todo.priority || DEFAULT_PRIORITY
        if (!terms.priorities.includes(todoPriority)) return false
      }

      // Completed filter
      if (terms.completed !== null) {
        if (todo.completed !== terms.completed) return false
      }

      return true
    })

    setFilteredTodos(filtered)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setFilteredTodos([])
  }

  // Always load from localStorage first for immediate display
  useEffect(() => {
    const loadTodos = () => {
      try {
        const savedTodos = localStorage.getItem('todos')
        if (savedTodos) {
          try {
            const parsedTodos = JSON.parse(savedTodos)
            // Basic cleanup of corrupted data during load
            const cleanedTodos = parsedTodos.filter(todo => {
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
                ? todo.priority : DEFAULT_PRIORITY,
              order: typeof todo.order === 'number' ? todo.order : 0
            }))
            
            setTodos(cleanedTodos)
            
            // If we cleaned up data, save the cleaned version
            if (cleanedTodos.length !== parsedTodos.length) {
              localStorage.setItem('todos', JSON.stringify(cleanedTodos))
              console.log(`Cleaned up ${parsedTodos.length - cleanedTodos.length} corrupted todos`)
            }
          } catch (error) {
            console.error('Error parsing todos from localStorage:', error)
            setTodos([])
          }
        }
      } catch (error) {
        console.error('Error loading todos from localStorage:', error)
        setTodos([])
      } finally {
        setIsLoaded(true)
      }
    }

    loadTodos()
  }, [])

  // Always save to localStorage immediately, then sync to OneDrive in background if enabled
  useEffect(() => {
    const saveTodos = async () => {
      if (!isLoaded) return

      try {
        // Always save to localStorage first for immediate persistence
        localStorage.setItem('todos', JSON.stringify(todos))
        
        // If OneDrive mode is enabled, sync in background
        if (isOneDriveMode) {
          // Only show toast for user-initiated changes, not initial sync
          saveToOneDrive(todos, hasUserMadeChanges)
        }
      } catch (error) {
        console.error('Error saving todos:', error)
        
        // If OneDrive sync fails, localStorage is still updated
        // OneDrive will retry in background or show sync status
      }
    }

    saveTodos()
  }, [todos, isLoaded, isOneDriveMode, saveToOneDrive])

  // Background sync: when first switching to OneDrive mode, check for conflicts
  useEffect(() => {
    const syncOnModeChange = async () => {
      if (isOneDriveMode && isLoaded) {
        try {
          // Load from OneDrive to check for any existing data
          const oneDriveTodos = await loadFromOneDrive()
          
          // If OneDrive has data, compare with localStorage
          if (oneDriveTodos.length > 0) {
            const localDataString = JSON.stringify(todos)
            const oneDriveDataString = JSON.stringify(oneDriveTodos)
            
            if (localDataString !== oneDriveDataString) {
              if (todos.length === 0) {
                // localStorage is empty, use OneDrive data
                console.log('OneDrive has data, updating localStorage...')
                setTodos(oneDriveTodos)
                localStorage.setItem('todos', JSON.stringify(oneDriveTodos))
              }
              // If both have data but different, let the normal conflict resolution handle it
              // Don't force a sync here that would create unnecessary conflicts
            }
          } else if (todos.length > 0) {
            // OneDrive is empty but localStorage has data - sync it once
            console.log('Initial sync to OneDrive...')
            saveToOneDrive(todos, false) // Don't show toast for initial sync
          }
        } catch (error) {
          console.error('Background sync failed:', error)
          // Continue with localStorage data, OneDrive sync will retry
        }
      }
    }

    // Only run when OneDrive mode changes, not on every todo change
    const timeoutId = setTimeout(syncOnModeChange, 1000)
    return () => clearTimeout(timeoutId)
  }, [isOneDriveMode, isLoaded, loadFromOneDrive, saveToOneDrive]) // Removed todos dependency to prevent loops

  // Todo operations
  const addTodo = (inputText) => {
    const { text, tags, priority } = extractTagsAndText(inputText)
    const newTodo = {
      id: Date.now(),
      text,
      tags,
      completed: false,
      timestamp: Date.now(),
      priority,
      order: 0 // New todos start at top of their priority group
    }
    setTodos([newTodo, ...todos])
    setHasUserMadeChanges(true)
  }

  const toggleComplete = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
    setHasUserMadeChanges(true)
  }

  const editTodo = (id, newText) => {
    const { text, tags, priority } = extractTagsAndText(newText)
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text, tags, priority } : todo
    ))
    setHasUserMadeChanges(true)
  }

  const reorderTodos = (draggedId, newIndex, sortedTodos) => {
    const draggedTodo = sortedTodos.find(todo => todo.id === draggedId)
    const targetTodo = sortedTodos[newIndex]
    
    // Check if reorder is allowed (same priority)
    if (!draggedTodo || !targetTodo || draggedTodo.priority !== targetTodo.priority) {
      return false // Invalid reorder
    }

    // Create new order values for the priority group
    const samePriorityTodos = sortedTodos.filter(todo => 
      todo.priority === draggedTodo.priority && !todo.completed
    )
    
    // Remove dragged todo and insert at new position
    const filteredTodos = samePriorityTodos.filter(todo => todo.id !== draggedId)
    const targetIndexInGroup = filteredTodos.findIndex(todo => todo.id === targetTodo.id)
    const reorderedGroup = [
      ...filteredTodos.slice(0, targetIndexInGroup),
      draggedTodo,
      ...filteredTodos.slice(targetIndexInGroup)
    ]

    // Update order values
    const updatedTodos = todos.map(todo => {
      const indexInGroup = reorderedGroup.findIndex(t => t.id === todo.id)
      if (indexInGroup !== -1) {
        return { ...todo, order: indexInGroup }
      }
      return todo
    })

    setTodos(updatedTodos)
    setHasUserMadeChanges(true)
    return true // Successful reorder
  }

  const removeTag = (todoId, tagToRemove) => {
    setTodos(todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, tags: todo.tags.filter(tag => tag !== tagToRemove) }
        : todo
    ))
    setHasUserMadeChanges(true)
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
    setHasUserMadeChanges(true)
  }

  const importTodos = (importedTodos) => {
    try {
      // Validate imported todos
      const validTodos = importedTodos.filter(todo => 
        todo && 
        typeof todo.text === 'string' && 
        todo.text.trim().length > 0
      ).map(todo => ({
        ...todo,
        id: todo.id || Date.now() + Math.random(),
        tags: Array.isArray(todo.tags) ? todo.tags : [],
        priority: typeof todo.priority === 'number' && todo.priority >= 1 && todo.priority <= 5 ? todo.priority : DEFAULT_PRIORITY,
        completed: Boolean(todo.completed),
        timestamp: todo.timestamp || Date.now(),
        order: todo.order || 0
      }))

      if (validTodos.length === 0) {
        throw new Error('No valid todos found in import data')
      }

      // Merge with existing todos, avoiding duplicates based on text and timestamp
      const existingTexts = new Set(todos.map(todo => `${todo.text}-${todo.timestamp}`))
      const newTodos = validTodos.filter(todo => 
        !existingTexts.has(`${todo.text}-${todo.timestamp}`)
      )

      if (newTodos.length > 0) {
        setTodos([...newTodos, ...todos])
        setHasUserMadeChanges(true)
      }

      return newTodos.length
    } catch (error) {
      console.error('Import failed:', error)
      throw error
    }
  }

  // Enhanced migration function
  const handleMigration = async (localTodos) => {
    try {
      const migratedTodos = await migrateToOneDrive(localTodos)
      setTodos(migratedTodos)
      // Update localStorage with migrated data
      localStorage.setItem('todos', JSON.stringify(migratedTodos))
      return migratedTodos
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  // Conflict resolution function
  const handleConflictResolution = async (resolution, selectedTodos) => {
    try {
      const resolvedTodos = await resolveConflict(resolution, selectedTodos)
      if (resolvedTodos) {
        setTodos(resolvedTodos)
        // Update localStorage immediately with resolved data
        localStorage.setItem('todos', JSON.stringify(resolvedTodos))
        return resolvedTodos
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error)
      throw error
    }
  }

  // Get todos to display (filtered or all)
  const displayTodos = searchQuery ? filteredTodos : todos

  return {
    todos: displayTodos,
    allTodos: todos,
    addTodo,
    toggleComplete,
    editTodo,
    removeTag,
    deleteTodo,
    reorderTodos,
    extractTagsAndText,
    reconstructTextWithTags,
    formatTimestamp,
    searchQuery,
    searchTodos: filterTodos,
    clearSearch,
    searchActive: !!searchQuery,
    importTodos,
    handleMigration,
    handleConflictResolution,
    // Enhanced storage-related exports
    storageType,
    syncStatus,
    isOneDriveMode,
    conflictInfo,
    isOnline,
    queueStatus,
    switchStorageType,
    // Data integrity exports
    syncHealthScore,
    validateTodos
  }
}

export default useTodos