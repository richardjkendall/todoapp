/**
 * Production-grade logging utility
 * Supports log levels, data sanitization, and environment configuration
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

// Production shows INFO and above, Development shows all levels
const PRODUCTION_LOG_LEVEL = LOG_LEVELS.INFO
const DEVELOPMENT_LOG_LEVEL = LOG_LEVELS.DEBUG

class Logger {
  constructor(context = 'App') {
    this.context = context
    this.logLevel = import.meta.env.PROD ? PRODUCTION_LOG_LEVEL : DEVELOPMENT_LOG_LEVEL
    this.enabledInProduction = !import.meta.env.PROD || import.meta.env.VITE_ENABLE_LOGGING !== 'false'
  }

  /**
   * Sanitize sensitive data before logging
   * Removes tokens, passwords, and limits data size
   */
  sanitize(data) {
    if (!data) return data
    
    // Handle primitive types
    if (typeof data !== 'object') return data
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.slice(0, 10).map(item => this.sanitize(item)) // Limit array size
    }

    const sanitized = {}
    
    // Remove/mask sensitive fields
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'accessToken', 
      'refreshToken', 'idToken', 'clientSecret', 'authorization'
    ]
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      
      // Check for sensitive keys
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      }
      // Limit todo text length
      else if (key === 'text' && typeof value === 'string' && value.length > 150) {
        sanitized[key] = value.substring(0, 150) + '...'
      }
      // Recursively sanitize nested objects
      else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value)
      }
      // Keep safe values
      else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Core logging method
   */
  log(level, message, data = {}) {
    // Skip if logging is disabled or level is below threshold
    if (!this.enabledInProduction || level < this.logLevel) return

    const timestamp = new Date().toISOString()
    const levelName = Object.keys(LOG_LEVELS)[level]
    const sanitizedData = this.sanitize(data)
    
    // Create structured log entry
    const logEntry = {
      timestamp,
      level: levelName,
      context: this.context,
      message
    }

    // Add data if present
    if (sanitizedData && Object.keys(sanitizedData).length > 0) {
      logEntry.data = sanitizedData
    }

    // Use appropriate console method with styling
    const consoleMethod = level >= LOG_LEVELS.ERROR ? console.error :
                         level >= LOG_LEVELS.WARN ? console.warn : console.log

    // Format message with context
    const formattedMessage = `[${levelName}] ${this.context}: ${message}`
    
    if (Object.keys(sanitizedData).length > 0) {
      consoleMethod(formattedMessage, sanitizedData)
    } else {
      consoleMethod(formattedMessage)
    }
  }

  /**
   * Log level convenience methods
   */
  debug(message, data) { 
    this.log(LOG_LEVELS.DEBUG, message, data) 
  }

  info(message, data) { 
    this.log(LOG_LEVELS.INFO, message, data) 
  }

  warn(message, data) { 
    this.log(LOG_LEVELS.WARN, message, data) 
  }

  error(message, data) { 
    this.log(LOG_LEVELS.ERROR, message, data) 
  }

  /**
   * Time-based logging for performance tracking
   */
  time(label) {
    this.startTimes = this.startTimes || {}
    this.startTimes[label] = Date.now()
  }

  timeEnd(label, message) {
    if (!this.startTimes || !this.startTimes[label]) {
      this.warn(`Timer '${label}' was not started`)
      return
    }
    
    const duration = Date.now() - this.startTimes[label]
    delete this.startTimes[label]
    
    this.info(message || `${label} completed`, { 
      duration: `${duration}ms`,
      label 
    })
  }
}

/**
 * Create context-specific loggers for different parts of the application
 */
export const createLogger = (context) => new Logger(context)

// Pre-configured loggers for common contexts
export const appLogger = new Logger('App')
export const authLogger = new Logger('Auth') 
export const syncLogger = new Logger('Sync')
export const shareLogger = new Logger('Share')
export const storageLogger = new Logger('Storage')
export const conflictLogger = new Logger('Conflict')

// Default export
export default Logger