import { createContext, useContext, useState, useEffect } from 'react'
import { msalInstance, graphScopes } from '../config/msalConfig'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize MSAL and check authentication status on mount
  useEffect(() => {
    const initializeAndCheck = async () => {
      try {
        // Wait for MSAL initialization to complete
        await msalInstance.initialize()
        
        // Handle any pending redirects
        const response = await msalInstance.handleRedirectPromise()
        if (response) {
          console.log('Redirect authentication successful:', response)
        }
        
        setIsInitialized(true)
        
        // Now check for existing accounts
        const accounts = msalInstance.getAllAccounts()
        if (accounts.length > 0) {
          setIsAuthenticated(true)
          setUser(accounts[0])
        }
      } catch (error) {
        console.error('Error initializing MSAL or checking auth status:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAndCheck()
  }, [])

  const login = async () => {
    if (!isInitialized) {
      throw new Error('MSAL not initialized yet')
    }
    
    try {
      setIsLoading(true)
      setError(null)

      const loginRequest = {
        scopes: graphScopes.all,
        prompt: 'select_account'
      }

      const response = await msalInstance.loginPopup(loginRequest)
      
      if (response) {
        setIsAuthenticated(true)
        setUser(response.account)
        return response
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    if (!isInitialized) {
      throw new Error('MSAL not initialized yet')
    }
    
    try {
      setIsLoading(true)
      setError(null)

      await msalInstance.logoutPopup()
      
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getAccessToken = async (scopes = graphScopes.all) => {
    if (!isInitialized) {
      throw new Error('MSAL not initialized yet')
    }
    
    try {
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated')
      }

      const silentRequest = {
        scopes: scopes,
        account: user,
      }

      const response = await msalInstance.acquireTokenSilent(silentRequest)
      return response.accessToken
    } catch (error) {
      console.error('Token acquisition error:', error)
      
      // If silent request fails, try interactive
      if (error.name === 'InteractionRequiredAuthError') {
        try {
          const response = await msalInstance.acquireTokenPopup({
            scopes: scopes,
            account: user,
          })
          return response.accessToken
        } catch (interactiveError) {
          console.error('Interactive token acquisition error:', interactiveError)
          throw interactiveError
        }
      }
      throw error
    }
  }

  const value = {
    isAuthenticated,
    user,
    isLoading,
    error,
    isInitialized,
    login,
    logout,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}