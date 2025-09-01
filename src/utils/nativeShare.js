/**
 * Native sharing utilities using Web Share API
 */

import { generateShareUrl, validateTodoForSharing } from './todoSharing'
import { shareLogger } from './logger'

/**
 * Checks if native sharing is supported and available
 * @returns {boolean} True if Web Share API is available
 */
export function isNativeShareAvailable() {
  return typeof navigator !== 'undefined' && 
         'share' in navigator &&
         typeof navigator.share === 'function'
}

/**
 * Checks if specific data can be shared (if canShare is available)
 * @param {Object} shareData - Data to be shared
 * @returns {boolean} True if data can be shared
 */
export function canShareData(shareData) {
  if (!isNativeShareAvailable()) {
    return false
  }
  
  // If canShare API is available, use it
  if ('canShare' in navigator && typeof navigator.canShare === 'function') {
    try {
      return navigator.canShare(shareData)
    } catch (error) {
      shareLogger.warn('Error checking canShare', { error: error.message })
      return true // Assume it can be shared if check fails
    }
  }
  
  return true // Assume it can be shared if canShare is not available
}

/**
 * Creates share data object for a todo
 * @param {Object} todo - Todo item to share
 * @param {Object} options - Share options (e.g., userName)
 * @returns {Object} Share data formatted for Web Share API
 */
export function createTodoShareData(todo, options = {}) {
  shareLogger.debug('Creating todo share data', { todoId: todo.id })
  
  try {
    // Generate the share URL
    const shareUrl = generateShareUrl(todo, options)
    
    // Create descriptive share content
    const shareData = {
      title: 'Shared Todo from LongList',
      text: `Check out this todo: "${todo.text}"`,
      url: shareUrl
    }
    
    shareLogger.debug('Todo share data created', {
      hasTitle: !!shareData.title,
      hasText: !!shareData.text,
      hasUrl: !!shareData.url,
      urlLength: shareUrl.length
    })
    
    return shareData
  } catch (error) {
    shareLogger.error('Failed to create todo share data', { 
      error: error.message,
      todoId: todo.id 
    })
    throw new Error('Failed to create share data')
  }
}

/**
 * Attempts to share a todo using the native Web Share API
 * @param {Object} todo - Todo item to share
 * @param {Object} options - Share options (e.g., userName)
 * @returns {Promise<boolean>} True if share was successful
 */
export async function shareToDoNatively(todo, options = {}) {
  shareLogger.debug('Starting native share', { todoId: todo.id })
  
  try {
    // Validate todo can be shared
    const validation = validateTodoForSharing(todo)
    if (!validation.valid) {
      shareLogger.warn('Todo validation failed for sharing', { 
        error: validation.error,
        todoId: todo.id 
      })
      throw new Error(validation.error)
    }
    
    // Check if native sharing is available
    if (!isNativeShareAvailable()) {
      shareLogger.debug('Native sharing not available')
      throw new Error('Native sharing not supported')
    }
    
    // Create share data
    const shareData = createTodoShareData(todo, options)
    
    // Check if this data can be shared
    if (!canShareData(shareData)) {
      shareLogger.warn('Share data cannot be shared', { shareData })
      throw new Error('This content cannot be shared')
    }
    
    // Attempt to share
    shareLogger.debug('Calling navigator.share')
    await navigator.share(shareData)
    
    shareLogger.info('Native share completed successfully', { todoId: todo.id })
    return true
    
  } catch (error) {
    // Don't log AbortError as these are user cancellations
    if (error.name === 'AbortError') {
      shareLogger.debug('Share cancelled by user', { todoId: todo.id })
      return false
    }
    
    shareLogger.error('Native share failed', { 
      error: error.message,
      errorName: error.name,
      todoId: todo.id 
    })
    
    // Re-throw with user-friendly message
    throw new Error(
      error.message === 'Native sharing not supported' ? error.message :
      error.message.includes('validation') ? error.message :
      'Failed to share todo'
    )
  }
}

/**
 * Fallback sharing method that creates a shareable URL and copies to clipboard
 * @param {Object} todo - Todo item to share
 * @param {Object} options - Share options (e.g., userName)
 * @returns {Promise<boolean>} True if URL was copied successfully
 */
export async function shareToDoFallback(todo, options = {}) {
  shareLogger.debug('Using fallback share method', { todoId: todo.id })
  
  try {
    // Validate todo can be shared
    const validation = validateTodoForSharing(todo)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    // Generate share URL
    const shareUrl = generateShareUrl(todo, options)
    
    // Try to copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl)
      shareLogger.info('Share URL copied to clipboard', { todoId: todo.id })
      return true
    } else {
      // Legacy clipboard method
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (success) {
        shareLogger.info('Share URL copied to clipboard (legacy)', { todoId: todo.id })
        return true
      } else {
        throw new Error('Failed to copy to clipboard')
      }
    }
  } catch (error) {
    shareLogger.error('Fallback share failed', { 
      error: error.message,
      todoId: todo.id 
    })
    throw error
  }
}