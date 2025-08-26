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
      
      const response = await fetch(`${GRAPH_API_BASE}${url}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
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
      const response = await this.makeGraphRequest(`/me/drive/special/approot:/${TODO_FILE_NAME}:/content`)
      
      if (response && typeof response === 'object') {
        return response
      }
      
      // If response is a string, try to parse as JSON
      if (typeof response === 'string') {
        try {
          return JSON.parse(response)
        } catch (parseError) {
          console.error('Failed to parse todos JSON:', parseError)
          return []
        }
      }
      
      return []
    } catch (error) {
      if (error.message.includes('404')) {
        // File doesn't exist yet
        console.log('Todos file not found, returning empty array')
        return []
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