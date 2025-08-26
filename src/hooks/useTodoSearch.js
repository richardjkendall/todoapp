import { useState, useCallback, useMemo } from 'react'
import { DEFAULT_PRIORITY } from '../utils/todoValidation'

/**
 * Hook for todo search and filtering functionality
 */
export const useTodoSearch = (todos) => {
  const [searchQuery, setSearchQuery] = useState('')
  
  /**
   * Parse search query into different term types
   */
  const parseSearchQuery = useCallback((query) => {
    const terms = {
      text: [],
      tags: [],
      priorities: [],
      completed: null
    }

    if (!query) return terms

    // Split by spaces but keep quoted strings together
    const parts = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []
    
    parts.forEach(part => {
      const trimmed = part.replace(/"/g, '').toLowerCase()
      
      if (trimmed.startsWith('#')) {
        // Tag search
        const tag = trimmed.substring(1)
        if (tag.length > 0) {
          terms.tags.push(tag)
        }
      } else if (trimmed.startsWith('!')) {
        // Priority search
        const priority = parseInt(trimmed.substring(1))
        if (priority >= 1 && priority <= 5) {
          terms.priorities.push(priority)
        }
      } else if (trimmed.startsWith('completed:')) {
        // Completed status search with completed:true/false syntax
        const value = trimmed.split(':')[1]
        terms.completed = value === 'true'
      } else if (trimmed === 'completed' || trimmed === 'done') {
        // Completed status search
        terms.completed = true
      } else if (trimmed === 'pending' || trimmed === 'todo' || trimmed === 'incomplete') {
        // Pending status search
        terms.completed = false
      } else if (part.trim()) {
        // Text search
        terms.text.push(trimmed)
      }
    })

    return terms
  }, [])

  /**
   * Filter todos based on search query
   */
  const filterTodos = useCallback((query) => {
    if (!query.trim()) {
      return todos
    }

    const terms = parseSearchQuery(query)
    
    return todos.filter(todo => {
      // Text search - all text terms must be found in todo text
      if (terms.text.length > 0) {
        const todoText = todo.text.toLowerCase()
        const hasAllTextTerms = terms.text.every(term => todoText.includes(term))
        if (!hasAllTextTerms) return false
      }

      // Tag search - all specified tags must be present
      if (terms.tags.length > 0) {
        const todoTags = (todo.tags || []).map(tag => tag.toLowerCase())
        const hasAllTags = terms.tags.every(tag => todoTags.includes(tag))
        if (!hasAllTags) return false
      }

      // Priority search - todo priority must match one of specified priorities
      if (terms.priorities.length > 0) {
        const todoPriority = todo.priority || DEFAULT_PRIORITY
        if (!terms.priorities.includes(todoPriority)) return false
      }

      // Completed status search
      if (terms.completed !== null) {
        if (todo.completed !== terms.completed) return false
      }

      return true
    })
  }, [todos, parseSearchQuery])

  /**
   * Get filtered todos based on current search query
   */
  const filteredTodos = useMemo(() => {
    return filterTodos(searchQuery)
  }, [filterTodos, searchQuery])

  /**
   * Clear search query
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  /**
   * Check if search is currently active
   */
  const isSearchActive = Boolean(searchQuery.trim())

  /**
   * Get search statistics
   */
  const searchStats = useMemo(() => {
    if (!isSearchActive) {
      return {
        total: todos.length,
        filtered: todos.length,
        hidden: 0
      }
    }

    return {
      total: todos.length,
      filtered: filteredTodos.length,
      hidden: todos.length - filteredTodos.length
    }
  }, [todos.length, filteredTodos.length, isSearchActive])

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filterTodos,
    filteredTodos,
    isSearchActive,
    searchStats,
    parseSearchQuery
  }
}