/**
 * Todo Sharing Utilities
 * 
 * Handles encoding/decoding todos for URL-based sharing
 * Uses Base64URL encoding with LZ-string compression
 */

import LZString from 'lz-string'
import { shareLogger } from './logger'

// LZ-string compression for better URL handling
// Using compressToEncodedURIComponent for better URL safety
const compress = (str) => {
  return LZString.compressToEncodedURIComponent(str)
}

const decompress = (str) => {
  return LZString.decompressFromEncodedURIComponent(str)
}

// Since LZ-string provides URL-safe compression, we can use it directly
// But we'll keep these for backward compatibility with v1 format
const base64UrlEncode = (str) => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const base64UrlDecode = (str) => {
  // Add padding back
  str += '='.repeat((4 - str.length % 4) % 4)
  // Convert back to regular base64
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    throw new Error('Invalid base64 encoding')
  }
}

/**
 * Encodes a todo item for URL sharing
 * @param {Object} todo - The todo item to encode
 * @param {Object} options - Sharing options
 * @param {string} options.userName - Name of the user sharing (if authenticated)
 * @returns {string} Encoded share data
 */
export const encodeTodoForSharing = (todo, options = {}) => {
  shareLogger.debug('Starting todo encoding for sharing')
  
  try {
    // Validate todo object
    if (!todo || typeof todo.text !== 'string') {
      throw new Error('Invalid todo object')
    }

    // Sanitize user name - only include if it's a valid non-empty string
    const userName = (options.userName && typeof options.userName === 'string' && options.userName.trim()) 
      ? options.userName.trim().substring(0, 100) // Limit name length
      : null

    shareLogger.debug('Todo encoding validation complete', {
      todoId: todo.id,
      hasUserName: !!userName,
      hasTags: Array.isArray(todo.tags) && todo.tags.length > 0,
      priority: todo.priority
    })

    // Create a clean shared todo object
    const sharedTodo = {
      text: todo.text || '',
      tags: Array.isArray(todo.tags) ? todo.tags : [],
      priority: todo.priority || null,
      completed: Boolean(todo.completed),
      metadata: {
        sharedFrom: "LongList",
        timestamp: Date.now(),
        version: "v2",
        sharedBy: userName
      }
    }
    
    // Convert to JSON and compress with LZ-string
    const json = JSON.stringify(sharedTodo)
    const compressed = compress(json)
    
    if (!compressed) {
      throw new Error('Compression failed')
    }
    
    const result = `v2:${compressed}`
    
    shareLogger.info('Todo encoded successfully for sharing', {
      originalLength: json.length,
      compressedLength: compressed.length,
      compressionRatio: Math.round((1 - compressed.length / json.length) * 100) + '%'
    })
    
    return result
  } catch (error) {
    shareLogger.error('Failed to encode todo for sharing', {
      error: error.message,
      todoId: todo?.id
    })
    throw new Error('Failed to create share link')
  }
}

/**
 * Decodes a shared todo from URL share data
 * @param {string} shareData - The encoded share data
 * @returns {Object|null} Decoded todo or null if invalid
 */
export const decodeTodoFromShare = (shareData) => {
  shareLogger.debug('Starting todo decoding from share data')
  
  try {
    // Parse version
    const colonIndex = shareData.indexOf(':')
    if (colonIndex === -1) {
      throw new Error('Invalid share format - missing version')
    }
    
    const version = shareData.substring(0, colonIndex)
    const encoded = shareData.substring(colonIndex + 1)
    
    shareLogger.debug('Share data parsed', {
      version,
      encodedLength: encoded.length
    })
    
    let json
    
    if (version === 'v1') {
      // Legacy format with base64URL encoding (no compression)
      shareLogger.debug('Decoding legacy v1 format')
      json = base64UrlDecode(encoded)
    } else if (version === 'v2') {
      // New format with LZ-string compression
      shareLogger.debug('Decompressing v2 format')
      json = decompress(encoded)
      
      if (!json) {
        // Try fallback decompression method
        shareLogger.warn('Primary decompression failed, trying fallback method')
        try {
          json = LZString.decompressFromBase64(encoded)
          shareLogger.debug('Fallback decompression succeeded')
        } catch (fallbackError) {
          shareLogger.error('Fallback decompression failed', { error: fallbackError.message })
        }
        
        if (!json) {
          throw new Error('LZ-string decompression failed - invalid data')
        }
      }
    } else {
      throw new Error(`Unsupported version: ${version}`)
    }
    
    const todo = JSON.parse(json)
    
    // Validate required fields
    if (!todo || typeof todo.text !== 'string') {
      throw new Error('Invalid todo data - missing text')
    }
    
    // Sanitize and validate
    const result = {
      text: todo.text.substring(0, 1000), // Limit text length
      tags: Array.isArray(todo.tags) ? todo.tags.slice(0, 10) : [], // Limit tags
      priority: typeof todo.priority === 'number' && todo.priority >= 1 && todo.priority <= 5 ? todo.priority : null,
      completed: Boolean(todo.completed),
      metadata: todo.metadata || {}
    }
    
    shareLogger.info('Todo decoded successfully from share data', {
      version,
      hasSharedBy: !!result.metadata?.sharedBy,
      textLength: result.text.length,
      tagCount: result.tags.length,
      priority: result.priority
    })
    
    return result
    
  } catch (error) {
    shareLogger.error('Failed to decode shared todo', {
      error: error.message,
      shareDataLength: shareData?.length
    })
    return null
  }
}

/**
 * Generates a share URL for a todo
 * @param {Object} todo - The todo to share
 * @param {Object} options - Sharing options (e.g., userName)
 * @returns {string} Complete share URL
 */
export const generateShareUrl = (todo, options = {}) => {
  const encoded = encodeTodoForSharing(todo, options)
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}#share=${encoded}`
}

/**
 * Validates if a todo can be shared (size limits, etc.)
 * @param {Object} todo - The todo to validate
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export const validateTodoForSharing = (todo) => {
  if (!todo || !todo.text) {
    return { valid: false, error: 'Todo text is required' }
  }
  
  if (todo.text.length > 1000) {
    return { valid: false, error: 'Todo text is too long (max 1000 characters)' }
  }
  
  // Test encoding to check URL length
  try {
    const shareUrl = generateShareUrl(todo)
    if (shareUrl.length > 2000) {
      return { valid: false, error: 'Todo is too complex to share via URL' }
    }
  } catch {
    return { valid: false, error: 'Failed to create share link' }
  }
  
  return { valid: true }
}