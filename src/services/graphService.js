// Microsoft Graph API service for OneDrive operations

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'
const TODO_FILE_NAME = 'todos.json'

class GraphService {
  constructor(getAccessToken) {
    this.getAccessToken = getAccessToken
  }

  async makeGraphRequest(url, options = {}) {
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
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Graph API request failed:', error)
      throw error
    }
  }

  // Get the app folder (creates it if it doesn't exist)
  async getAppFolder() {
    try {
      // Try to get the existing app folder
      const response = await this.makeGraphRequest('/me/drive/special/approot')
      return response
    } catch (error) {
      if (error.message.includes('404')) {
        // App folder doesn't exist yet - it will be created when we first write a file
        console.log('App folder will be created on first file write')
        return null
      }
      throw error
    }
  }

  // Read todos from OneDrive
  async readTodos() {
    try {
      // First get file metadata to get lastModifiedDateTime
      const metadata = await this.makeGraphRequest(`/me/drive/special/approot:/${TODO_FILE_NAME}`)
      
      // Then get file content
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/${TODO_FILE_NAME}:/content`)
      
      let todos = []
      if (response && typeof response === 'object') {
        todos = response
      } else if (typeof response === 'string') {
        try {
          todos = JSON.parse(response)
        } catch (parseError) {
          console.error('Failed to parse todos JSON:', parseError)
          todos = []
        }
      }
      
      // Return both todos and metadata
      return {
        todos: todos || [],
        lastModified: metadata?.lastModifiedDateTime ? new Date(metadata.lastModifiedDateTime).getTime() : Date.now()
      }
    } catch (error) {
      if (error.message.includes('404')) {
        // File doesn't exist yet
        console.log('Todos file not found, returning empty array')
        return { todos: [], lastModified: null }
      }
      console.error('Error reading todos from OneDrive:', error)
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
      
      console.log('Todos saved to OneDrive:', response)
      return response
    } catch (error) {
      console.error('Error writing todos to OneDrive:', error)
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
      console.log('Todos file deleted from OneDrive')
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('Todos file not found, nothing to delete')
        return
      }
      throw error
    }
  }

  // Upload photo to OneDrive
  async uploadPhoto(photoBlob, fileName) {
    try {
      console.log(`Uploading photo: ${fileName} (${photoBlob.size} bytes)`)
      
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/photos/${fileName}:/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: photoBlob,
      })
      
      console.log('Photo uploaded successfully:', response)
      return response
    } catch (error) {
      console.error('Error uploading photo to OneDrive:', error)
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
        console.log(`Photo not found: ${fileName}`)
        return null
      }
      console.error('Error getting photo URL:', error)
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
      console.log(`Photo deleted: ${fileName}`)
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`Photo not found for deletion: ${fileName}`)
        return
      }
      console.error('Error deleting photo:', error)
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
        console.log('Photos folder not found, returning empty list')
        return []
      }
      console.error('Error listing photos:', error)
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
}

export default GraphService