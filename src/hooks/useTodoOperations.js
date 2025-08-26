import { useCallback } from 'react'
import { createTodo, isValidTodo, normalizeTodo } from '../utils/todoValidation'
import { useTodoTextParser } from './useTodoTextParser'

/**
 * Hook for todo CRUD operations
 */
export const useTodoOperations = (todos, setTodos, onUserChange) => {
  const { extractTagsAndText } = useTodoTextParser()

  /**
   * Add a new todo
   */
  const addTodo = useCallback((inputText) => {
    const { text, tags, priority } = extractTagsAndText(inputText)
    const newTodo = createTodo(text, { 
      tags, 
      priority, 
      order: 0 // New todos start at top of their priority group
    })
    setTodos([newTodo, ...todos])
    onUserChange()
  }, [extractTagsAndText, setTodos, todos, onUserChange])

  /**
   * Toggle todo completion status
   */
  const toggleComplete = useCallback((id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
    onUserChange()
  }, [todos, setTodos, onUserChange])

  /**
   * Edit a todo's text, tags, and priority
   */
  const editTodo = useCallback((id, newText) => {
    const { text, tags, priority } = extractTagsAndText(newText)
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text, tags, priority } : todo
    ))
    onUserChange()
  }, [extractTagsAndText, todos, setTodos, onUserChange])

  /**
   * Delete a todo
   */
  const deleteTodo = useCallback((id) => {
    setTodos(todos.filter(todo => todo.id !== id))
    onUserChange()
  }, [todos, setTodos, onUserChange])

  /**
   * Remove a specific tag from a todo
   */
  const removeTagFromTodo = useCallback((todoId, tagToRemove) => {
    setTodos(todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, tags: todo.tags.filter(tag => tag !== tagToRemove) }
        : todo
    ))
    onUserChange()
  }, [todos, setTodos, onUserChange])

  /**
   * Reorder todos (drag and drop)
   */
  const reorderTodos = useCallback((draggedId, newIndex, sortedTodos) => {
    const draggedTodo = sortedTodos.find(todo => todo.id === draggedId)
    const targetTodo = sortedTodos[newIndex]
    
    // Check if reorder is allowed (same priority)
    if (!draggedTodo || !targetTodo || draggedTodo.priority !== targetTodo.priority) {
      return false // Invalid reorder
    }

    // Get all todos with the same priority as the dragged item
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

    // Update the order property for all todos in this priority group
    const updatedTodos = todos.map(todo => {
      const indexInGroup = reorderedGroup.findIndex(t => t.id === todo.id)
      if (indexInGroup !== -1) {
        return { ...todo, order: indexInGroup }
      }
      return todo
    })

    setTodos(updatedTodos)
    onUserChange()
    return true // Successful reorder
  }, [todos, setTodos, onUserChange])

  /**
   * Import todos from external data
   */
  const importTodos = useCallback((importedTodos) => {
    try {
      // Validate and normalize imported todos using shared utility
      const validTodos = importedTodos
        .filter(isValidTodo)
        .map(normalizeTodo)

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
        onUserChange()
      }

      return newTodos.length
    } catch (error) {
      console.error('Import failed:', error)
      throw error
    }
  }, [todos, setTodos, onUserChange])

  /**
   * Replace all todos (used for conflict resolution, migration, etc.)
   */
  const replaceTodos = useCallback((newTodos) => {
    setTodos(newTodos)
    onUserChange()
  }, [setTodos, onUserChange])

  return {
    addTodo,
    toggleComplete,
    editTodo,
    deleteTodo,
    removeTagFromTodo,
    reorderTodos,
    importTodos,
    replaceTodos
  }
}