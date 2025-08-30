/**
 * Todo Sharing Utilities
 * 
 * Handles encoding/decoding todos for URL-based sharing
 * Uses Base64URL encoding with LZ-string compression
 */

import LZString from 'lz-string'

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
  console.log('=== Starting encode process ===')
  console.log('Input todo:', todo)
  console.log('Input options:', options)
  
  try {
    // Validate todo object
    if (!todo || typeof todo.text !== 'string') {
      throw new Error('Invalid todo object')
    }

    // Sanitize user name - only include if it's a valid non-empty string
    const userName = (options.userName && typeof options.userName === 'string' && options.userName.trim()) 
      ? options.userName.trim().substring(0, 100) // Limit name length
      : null

    console.log('Sanitized userName:', userName)

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
    
    console.log('Shared todo object:', sharedTodo)
    
    // Convert to JSON and compress with LZ-string
    const json = JSON.stringify(sharedTodo)
    console.log('JSON string:', json)
    console.log('JSON length:', json.length)
    
    const compressed = compress(json)
    console.log('Compressed result:', compressed)
    console.log('Compressed length:', compressed ? compressed.length : 'null')
    
    if (!compressed) {
      throw new Error('Compression failed')
    }
    
    // LZ-string compression is already URL-safe, so we can use it directly
    const result = `v2:${compressed}`
    console.log('Final encoded result:', result)
    console.log('=== Encode successful ===')
    return result
  } catch (error) {
    console.error('=== Encode failed ===')
    console.error('Failed to encode todo for sharing:', error)
    throw new Error('Failed to create share link')
  }
}

/**
 * Decodes a shared todo from URL share data
 * @param {string} shareData - The encoded share data
 * @returns {Object|null} Decoded todo or null if invalid
 */
export const decodeTodoFromShare = (shareData) => {
  console.log('=== Starting decode process ===')
  console.log('Share data:', shareData)
  
  try {
    // Parse version
    const colonIndex = shareData.indexOf(':')
    if (colonIndex === -1) {
      throw new Error('Invalid share format - missing version')
    }
    
    const version = shareData.substring(0, colonIndex)
    const encoded = shareData.substring(colonIndex + 1)
    
    console.log('Version:', version)
    console.log('Encoded length:', encoded.length)
    console.log('Encoded (first 100 chars):', encoded.substring(0, 100))
    
    let json
    
    if (version === 'v1') {
      // Legacy format with base64URL encoding (no compression)
      console.log('Decoding v1 format...')
      json = base64UrlDecode(encoded)
      console.log('v1 decoded JSON:', json)
    } else if (version === 'v2') {
      // New format with LZ-string compression
      console.log('Decompressing v2 format...')
      json = decompress(encoded)
      console.log('v2 decompressed JSON:', json)
      
      if (!json) {
        // Try fallback decompression method
        console.log('Trying fallback decompression...')
        try {
          json = LZString.decompressFromBase64(encoded)
          console.log('Fallback decompressed JSON:', json)
        } catch (fallbackError) {
          console.error('Fallback decompression also failed:', fallbackError)
        }
        
        if (!json) {
          throw new Error('LZ-string decompression failed - invalid data')
        }
      }
    } else {
      throw new Error(`Unsupported version: ${version}`)
    }
    
    console.log('About to parse JSON:', json)
    const todo = JSON.parse(json)
    console.log('Parsed todo:', todo)
    
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
    
    console.log('Final decoded result:', result)
    console.log('=== Decode successful ===')
    return result
    
  } catch (error) {
    console.error('=== Decode failed ===')
    console.error('Error:', error)
    console.error('Share data:', shareData)
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