/**
 * Shared todo validation and cleanup utilities
 */

export const DEFAULT_PRIORITY = 3

/**
 * Validates a single todo item
 * @param {Object} todo - The todo item to validate
 * @param {number} index - The index for error reporting
 * @returns {Array} Array of validation issues
 */
export const validateSingleTodo = (todo, index = 0) => {
  const issues = []
  
  if (!todo || typeof todo !== 'object') {
    issues.push(`Todo at index ${index} is not a valid object`)
    return issues
  }
  
  if (!todo.id) {
    issues.push(`Todo at index ${index} is missing an ID`)
  }
  
  if (!todo.text || typeof todo.text !== 'string' || todo.text.trim() === '') {
    issues.push(`Todo at index ${index} has empty or invalid text`)
  }
  
  if (todo.timestamp && isNaN(new Date(todo.timestamp))) {
    issues.push(`Todo at index ${index} has invalid timestamp`)
  }
  
  if (todo.priority !== undefined && (typeof todo.priority !== 'number' || todo.priority < 1 || todo.priority > 5)) {
    issues.push(`Todo at index ${index} has invalid priority: ${todo.priority}`)
  }
  
  if (todo.tags !== undefined && !Array.isArray(todo.tags)) {
    issues.push(`Todo at index ${index} has invalid tags array`)
  }
  
  if (todo.completed !== undefined && typeof todo.completed !== 'boolean') {
    issues.push(`Todo at index ${index} has invalid completed status`)
  }
  
  return issues
}

/**
 * Validates an array of todos
 * @param {Array} todos - Array of todos to validate
 * @returns {Object} Validation result with isValid, issues, and score
 */
export const validateTodos = (todos) => {
  if (!Array.isArray(todos)) {
    return {
      isValid: false,
      issues: ['Todos must be an array'],
      score: 0
    }
  }
  
  const allIssues = []
  todos.forEach((todo, index) => {
    const issues = validateSingleTodo(todo, index)
    allIssues.push(...issues)
  })
  
  return {
    isValid: allIssues.length === 0,
    issues: allIssues,
    score: Math.max(0, 100 - (allIssues.length * 10))
  }
}

/**
 * Checks if a todo item is valid for basic operations
 * @param {Object} todo - The todo item to check
 * @returns {boolean} Whether the todo is valid
 */
export const isValidTodo = (todo) => {
  return todo &&
         typeof todo === 'object' &&
         todo.id &&
         todo.text &&
         typeof todo.text === 'string' &&
         todo.text.trim().length > 0
}

/**
 * Normalizes and cleans a single todo item
 * @param {Object} todo - The todo item to normalize
 * @returns {Object} Normalized todo item
 */
export const normalizeTodo = (todo) => {
  if (!todo || typeof todo !== 'object') {
    return null
  }
  
  return {
    id: todo.id || Date.now() + Math.random(),
    text: typeof todo.text === 'string' ? todo.text.trim() : String(todo.text || ''),
    completed: Boolean(todo.completed),
    timestamp: todo.timestamp || Date.now(),
    tags: Array.isArray(todo.tags) ? todo.tags : [],
    priority: (typeof todo.priority === 'number' && todo.priority >= 1 && todo.priority <= 5) 
      ? todo.priority : DEFAULT_PRIORITY,
    order: typeof todo.order === 'number' ? todo.order : 0
  }
}

/**
 * Cleans and normalizes an array of todos, removing invalid items
 * @param {Array} todos - Array of todos to clean
 * @returns {Object} Result with cleaned todos and removed count
 */
export const cleanupTodos = (todos) => {
  if (!Array.isArray(todos)) {
    return { cleaned: [], removedCount: 0 }
  }
  
  const cleaned = []
  let removedCount = 0
  
  todos.forEach(todo => {
    if (isValidTodo(todo)) {
      cleaned.push(normalizeTodo(todo))
    } else {
      removedCount++
    }
  })
  
  return { cleaned, removedCount }
}

/**
 * Generates a unique todo identifier
 * @returns {string} Unique ID
 */
export const generateTodoId = () => {
  return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Creates a new todo item with default values
 * @param {string} text - The todo text
 * @param {Object} options - Additional options (tags, priority, etc.)
 * @returns {Object} New todo item
 */
export const createTodo = (text, options = {}) => {
  return normalizeTodo({
    id: generateTodoId(),
    text: text || '',
    completed: false,
    timestamp: Date.now(),
    tags: options.tags || [],
    priority: options.priority || DEFAULT_PRIORITY,
    order: options.order || 0
  })
}