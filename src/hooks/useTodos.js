import { useState, useEffect } from 'react'
import { DEFAULT_PRIORITY } from '../utils/priority'

const useTodos = () => {
  const [todos, setTodos] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTodos, setFilteredTodos] = useState([])

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

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos)
        setTodos(parsedTodos)
      } catch (error) {
        console.error('Error parsing todos from localStorage:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save todos to localStorage whenever todos change (but not on initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('todos', JSON.stringify(todos))
    }
  }, [todos, isLoaded])

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
  }

  const toggleComplete = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const editTodo = (id, newText) => {
    const { text, tags, priority } = extractTagsAndText(newText)
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text, tags, priority } : todo
    ))
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
    return true // Successful reorder
  }

  const removeTag = (todoId, tagToRemove) => {
    setTodos(todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, tags: todo.tags.filter(tag => tag !== tagToRemove) }
        : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
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
    searchActive: !!searchQuery
  }
}

export default useTodos