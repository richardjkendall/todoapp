// Microsoft Graph API service for OneDrive operations

import { syncLogger } from '../utils/logger'

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'
const TODO_FILE_NAME = 'todos.json'

// Module-level singleton and cache to ensure persistence across instances
let graphServiceInstance = null

// Module-level cache that persists even if instances are recreated
const moduleCache = new Map()
const CACHE_TIMEOUT = 15000 // 15 seconds

class GraphService {
  constructor(getAccessToken) {
    this.getAccessToken = getAccessToken
    // Use module-level cache instead of instance cache
    this.readCache = moduleCache
    this.cacheTimeout = CACHE_TIMEOUT
    this.instanceId = Math.random().toString(36).substr(2, 9) // Debug instance tracking
    syncLogger.debug('GraphService instance created', { instanceId: this.instanceId, sharedCacheSize: moduleCache.size })
  }

  // Performance monitoring helper
  logPerformance(url, startTime, status) {
    const duration = Math.round(performance.now() - startTime)
    syncLogger.debug('Graph API request completed', { url, status, duration })
  }

  async makeGraphRequest(url, options = {}) {
    const startTime = performance.now()
    try {
      const token = await this.getAccessToken()
      
      // Set default headers, but allow override (important for binary uploads)
      const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
      
      // Only set Content-Type to JSON if not explicitly provided
      if (!options.headers || !options.headers['Content-Type']) {
        defaultHeaders['Content-Type'] = 'application/json'
      }
      
      const response = await fetch(`${GRAPH_API_BASE}${url}`, {
        ...options,
        headers: defaultHeaders,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        this.logPerformance(url, startTime, 'No Content')
        return null
      }

      const result = await response.json()
      this.logPerformance(url, startTime, 'Success')
      return result
    } catch (error) {
      this.logPerformance(url, startTime, 'Error')
      syncLogger.error('Graph API request failed', { url, error: error.message })
      throw error
    }
  }

  // Get the app folder (creates it if it doesn't exist)
  async getAppFolder() {
    try {
      const response = await this.makeGraphRequest('/me/drive/special/approot')
      return response
    } catch (error) {
      if (error.message.includes('404')) {
        syncLogger.debug('App folder will be created on first file write')
        return null
      }
      throw error
    }
  }

  // Read todos from OneDrive
  async readTodos() {
    const cacheKey = `todos-${TODO_FILE_NAME}`
    const cached = this.readCache.get(cacheKey)
    
    try {
      // Get file metadata for lastModifiedDateTime
      const metadataUrl = `/me/drive/special/approot:/${TODO_FILE_NAME}`
      syncLogger.debug('About to fetch metadata', { 
        cacheKey, 
        hasCached: !!cached,
        instanceId: this.instanceId,
        cacheSize: this.readCache.size
      })
      const metadata = await this.makeGraphRequest(metadataUrl)
      syncLogger.debug('Received metadata', { 
        hasMetadata: !!metadata, 
        lastModifiedDateTime: metadata?.lastModifiedDateTime 
      })
      
      // Check if file has changed using lastModifiedDateTime
      if (metadata && cached) {
        const remoteLastModified = metadata.lastModifiedDateTime
        const cachedLastModified = cached.data?.lastModified
        
        syncLogger.debug('Timestamp comparison check', {
          hasRemoteTimestamp: !!remoteLastModified,
          hasCachedTimestamp: !!cachedLastModified,
          remoteLastModified,
          cachedLastModified
        })
        
        if (remoteLastModified && cachedLastModified) {
          const remoteTimestamp = new Date(remoteLastModified).getTime()
          const cachedTimestamp = typeof cachedLastModified === 'string' ? new Date(cachedLastModified).getTime() : cachedLastModified
          
          if (remoteTimestamp === cachedTimestamp) {
            syncLogger.info('✅ File unchanged on OneDrive (timestamp match) - no download needed, using cached data')
            // Refresh cache timestamp since we verified it's still valid
            this.readCache.set(cacheKey, {
              data: cached.data,
              timestamp: Date.now()
            })
            return cached.data
          } else {
            syncLogger.info('📝 File changed on OneDrive (timestamp changed) - downloading new content', { 
              oldTime: new Date(cachedTimestamp).toISOString(), 
              newTime: new Date(remoteTimestamp).toISOString(),
              timeDifferenceMs: remoteTimestamp - cachedTimestamp
            })
          }
        } else {
          syncLogger.debug('Cannot compare timestamps - missing data', {
            remoteLastModified,
            cachedLastModified
          })
        }
      } else {
        syncLogger.debug('Timestamp comparison skipped', {
          hasMetadata: !!metadata,
          hasCached: !!cached
        })
      }
      
      // Use session cache if available and recent (as fallback)
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        syncLogger.debug('Using session cache for todos')
        return cached.data
      }
      
      // Fetch file content
      const contentUrl = `/me/drive/special/approot:/${TODO_FILE_NAME}:/content`
      const response = await this.makeGraphRequest(contentUrl)
      
      let todos = []
      if (response && typeof response === 'object') {
        todos = response
      } else if (typeof response === 'string') {
        try {
          todos = JSON.parse(response)
        } catch (parseError) {
          syncLogger.error('Failed to parse todos JSON', { error: parseError.message })
          todos = []
        }
      }
      
      // Return both todos and metadata
      const result = {
        todos: todos || [],
        lastModified: metadata?.lastModifiedDateTime ? new Date(metadata.lastModifiedDateTime).getTime() : Date.now()
      }
      
      // Cache the result
      this.readCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })
      
      syncLogger.debug('Successfully read todos from OneDrive and cached', { 
        todoCount: result.todos.length,
        lastModified: result.lastModified,
        cacheKey,
        cacheSize: this.readCache.size
      })
      
      return result
    } catch (error) {
      if (error.message.includes('404')) {
        syncLogger.debug('Todos file not found, returning empty array')
        return { todos: [], lastModified: null }
      }
      syncLogger.error('Error reading todos from OneDrive', { error: error.message })
      throw error
    }
  }

  // Write todos to OneDrive
  async writeTodos(todos) {
    try {
      const todosJson = JSON.stringify(todos, null, 2)
      
      // Upload to OneDrive app folder
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/${TODO_FILE_NAME}:/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: todosJson,
      })
      
      // Invalidate cache after write
      const cacheKey = `todos-${TODO_FILE_NAME}`
      const hadCache = this.readCache.has(cacheKey)
      this.readCache.delete(cacheKey)
      syncLogger.debug('Cache invalidated after write', { cacheKey, hadCache, cacheSize: this.readCache.size })
      
      syncLogger.debug('Successfully saved todos to OneDrive', { todoCount: todos.length })
      return response
    } catch (error) {
      syncLogger.error('Error writing todos to OneDrive', { 
        error: error.message,
        todoCount: todos.length 
      })
      throw error
    }
  }

  // Get file metadata
  async getTodosFileInfo() {
    try {
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/${TODO_FILE_NAME}`)
      return {
        lastModified: response.lastModifiedDateTime,
        size: response.size,
        id: response.id,
      }
    } catch (error) {
      if (error.message.includes('404')) {
        return null // File doesn't exist
      }
      throw error
    }
  }

  // Delete todos file (useful for testing)
  async deleteTodos() {
    try {
      await this.makeGraphRequest(`/me/drive/special/approot:/${TODO_FILE_NAME}`, {
        method: 'DELETE',
      })
      syncLogger.debug('Todos file deleted from OneDrive')
    } catch (error) {
      if (error.message.includes('404')) {
        syncLogger.debug('Todos file not found, nothing to delete')
        return
      }
      throw error
    }
  }

  // Upload photo to OneDrive
  async uploadPhoto(photoBlob, fileName) {
    try {
      syncLogger.debug('Uploading photo to OneDrive', { fileName, size: photoBlob.size })
      
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/photos/${fileName}:/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: photoBlob,
      })
      
      syncLogger.debug('Photo uploaded successfully', { fileName })
      return response
    } catch (error) {
      syncLogger.error('Error uploading photo to OneDrive', { fileName, error: error.message })
      throw error
    }
  }

  // Get photo download URL
  async getPhotoUrl(fileName) {
    try {
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/photos/${fileName}`)
      return response['@microsoft.graph.downloadUrl']
    } catch (error) {
      if (error.message.includes('404')) {
        syncLogger.debug('Photo not found', { fileName })
        return null
      }
      syncLogger.error('Error getting photo URL', { fileName, error: error.message })
      throw error
    }
  }

  // Get photo metadata
  async getPhotoInfo(fileName) {
    try {
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/photos/${fileName}`)
      return {
        fileName,
        downloadUrl: response['@microsoft.graph.downloadUrl'],
        lastModified: response.lastModifiedDateTime,
        size: response.size,
        id: response.id,
      }
    } catch (error) {
      if (error.message.includes('404')) {
        return null // Photo doesn't exist
      }
      throw error
    }
  }

  // Delete photo
  async deletePhoto(fileName) {
    try {
      await this.makeGraphRequest(`/me/drive/special/approot:/photos/${fileName}`, {
        method: 'DELETE',
      })
      syncLogger.debug('Photo deleted', { fileName })
    } catch (error) {
      if (error.message.includes('404')) {
        syncLogger.debug('Photo not found for deletion', { fileName })
        return
      }
      syncLogger.error('Error deleting photo', { fileName, error: error.message })
      throw error
    }
  }

  // List all photos in the photos folder
  async listPhotos() {
    try {
      const response = await this.makeGraphRequest('/me/drive/special/approot:/photos:/children')
      return response.value || []
    } catch (error) {
      if (error.message.includes('404')) {
        syncLogger.debug('Photos folder not found, returning empty list')
        return []
      }
      syncLogger.error('Error listing photos', { error: error.message })
      throw error
    }
  }

  // Test connection to Microsoft Graph
  async testConnection() {
    try {
      const response = await this.makeGraphRequest('/me')
      return {
        success: true,
        user: {
          name: response.displayName,
          email: response.mail || response.userPrincipalName,
          id: response.id,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  // Static method to get singleton instance
  static getInstance(getAccessToken) {
    if (!graphServiceInstance) {
      syncLogger.debug('Creating GraphService singleton instance')
      graphServiceInstance = new GraphService(getAccessToken)
    } else {
      // Update the token function on existing instance (in case it changed)
      graphServiceInstance.getAccessToken = getAccessToken
    }
    return graphServiceInstance
  }

  // Static method to clear singleton (for auth changes)
  static clearInstance() {
    syncLogger.debug('Clearing GraphService singleton instance')
    graphServiceInstance = null
  }
}

export default GraphService