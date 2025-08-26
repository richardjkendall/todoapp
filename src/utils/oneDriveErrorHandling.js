/**
 * Shared OneDrive error handling utilities
 */

// Common OneDrive error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  QUOTA: 'QUOTA_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION: 'PERMISSION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

// Error messages for user display
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network connection failed. Please check your internet connection.',
  [ERROR_TYPES.AUTH]: 'Authentication failed. Please sign in again.',
  [ERROR_TYPES.CONFLICT]: 'Your data has been modified elsewhere. Please resolve the conflict.',
  [ERROR_TYPES.QUOTA]: 'OneDrive storage quota exceeded. Please free up space.',
  [ERROR_TYPES.FILE_NOT_FOUND]: 'Todo data not found in OneDrive. Creating new file.',
  [ERROR_TYPES.PERMISSION]: 'Permission denied. Please check your OneDrive access.',
  [ERROR_TYPES.RATE_LIMIT]: 'Too many requests. Please wait a moment before trying again.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
}

/**
 * Classifies an error into a known error type
 * @param {Error} error - The error to classify
 * @returns {string} The error type
 */
export const classifyError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN

  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || error.status

  // Network errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('connection') ||
      errorCode === 'ERR_NETWORK') {
    return ERROR_TYPES.NETWORK
  }

  // Authentication errors
  if (errorMessage.includes('unauthorized') || 
      errorMessage.includes('authentication') ||
      errorCode === 401 ||
      errorCode === 'AADB2C90077') {
    return ERROR_TYPES.AUTH
  }

  // Conflict errors
  if (errorMessage.includes('conflict') || 
      errorMessage.includes('etag') ||
      errorCode === 409) {
    return ERROR_TYPES.CONFLICT
  }

  // Quota errors
  if (errorMessage.includes('quota') || 
      errorMessage.includes('storage') ||
      errorMessage.includes('insufficient space') ||
      errorCode === 507) {
    return ERROR_TYPES.QUOTA
  }

  // File not found errors
  if (errorMessage.includes('not found') || 
      errorMessage.includes('itemnotfound') ||
      errorCode === 404) {
    return ERROR_TYPES.FILE_NOT_FOUND
  }

  // Permission errors
  if (errorMessage.includes('permission') || 
      errorMessage.includes('forbidden') ||
      errorCode === 403) {
    return ERROR_TYPES.PERMISSION
  }

  // Rate limiting errors
  if (errorMessage.includes('rate limit') || 
      errorMessage.includes('throttled') ||
      errorCode === 429) {
    return ERROR_TYPES.RATE_LIMIT
  }

  return ERROR_TYPES.UNKNOWN
}

/**
 * Gets user-friendly error message for display
 * @param {Error} error - The error to get message for
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  const errorType = classifyError(error)
  return ERROR_MESSAGES[errorType]
}

/**
 * Determines if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the error is retryable
 */
export const isRetryableError = (error) => {
  const errorType = classifyError(error)
  return [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.RATE_LIMIT,
    ERROR_TYPES.UNKNOWN
  ].includes(errorType)
}

/**
 * Gets retry delay based on error type and attempt count
 * @param {Error} error - The error that occurred
 * @param {number} attemptCount - Current attempt number (0-based)
 * @returns {number} Delay in milliseconds
 */
export const getRetryDelay = (error, attemptCount = 0) => {
  const errorType = classifyError(error)
  
  if (errorType === ERROR_TYPES.RATE_LIMIT) {
    // Exponential backoff for rate limiting: 2, 4, 8 seconds
    return Math.min(2000 * Math.pow(2, attemptCount), 8000)
  }
  
  if (errorType === ERROR_TYPES.NETWORK) {
    // Linear backoff for network errors: 1, 2, 3 seconds
    return Math.min(1000 * (attemptCount + 1), 3000)
  }
  
  // Default backoff: 1, 2, 4 seconds
  return Math.min(1000 * Math.pow(2, attemptCount), 4000)
}

/**
 * Logs error with additional context for debugging
 * @param {Error} error - The error to log
 * @param {string} operation - The operation that failed
 * @param {Object} context - Additional context
 */
export const logError = (error, operation, context = {}) => {
  const errorType = classifyError(error)
  
  console.error(`OneDrive ${operation} failed:`, {
    type: errorType,
    message: error.message,
    code: error.code || error.status,
    context,
    stack: error.stack
  })
}

/**
 * Creates a standardized error object
 * @param {string} type - Error type from ERROR_TYPES
 * @param {string} message - Error message
 * @param {Object} originalError - Original error object
 * @returns {Error} Standardized error
 */
export const createError = (type, message, originalError = null) => {
  const error = new Error(message)
  error.type = type
  error.isOneDriveError = true
  if (originalError) {
    error.originalError = originalError
    error.stack = originalError.stack
  }
  return error
}

/**
 * Wrapper for OneDrive operations with standardized error handling
 * @param {Function} operation - The async operation to execute
 * @param {string} operationName - Name of the operation for logging
 * @param {Object} options - Options object
 * @param {boolean} options.retry - Whether to retry on retryable errors
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {Function} options.onError - Custom error handler
 * @returns {Promise} Result of the operation
 */
export const withErrorHandling = async (operation, operationName, options = {}) => {
  const {
    retry = true,
    maxRetries = 3,
    onError = null
  } = options

  let lastError = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      logError(error, operationName, { attempt, maxRetries })
      
      // Call custom error handler if provided
      if (onError) {
        onError(error, attempt)
      }
      
      // Don't retry if disabled or max retries reached
      if (!retry || attempt >= maxRetries || !isRetryableError(error)) {
        break
      }
      
      // Wait before retry
      const delay = getRetryDelay(error, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // All retries failed, throw the last error
  throw lastError
}