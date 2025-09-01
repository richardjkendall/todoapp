import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { msalInstance, graphScopes } from '../config/msalConfig'
import { authLogger } from '../utils/logger'

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
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false)


  // Initialize MSAL and check authentication status on mount
  useEffect(() => {
    const initializeAndCheck = async () => {
      try {
        // Wait for MSAL initialization to complete
        await msalInstance.initialize()
        
        // Handle any pending redirects
        const response = await msalInstance.handleRedirectPromise()
        if (response) {
          authLogger.info('Redirect authentication successful', {
            accountId: response.account?.homeAccountId,
            tenantId: response.account?.tenantId,
            username: response.account?.username
          })
        }
        
        setIsInitialized(true)
        
        // Check if user manually logged out
        const userLoggedOut = localStorage.getItem('userLoggedOut') === 'true'
        
        // Now check for existing accounts only if user didn't manually log out
        const accounts = msalInstance.getAllAccounts()
        if (accounts.length > 0 && !userLoggedOut) {
          setIsAuthenticated(true)
          setUser(accounts[0])
          // Profile photo will be fetched via useEffect when isAuthenticated/user changes
        }
      } catch (error) {
        authLogger.error('Error initializing MSAL or checking auth status', {
          error: error.message,
          name: error.name
        })
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAndCheck()
  }, [])

  // Fetch profile photo when user becomes authenticated
  useEffect(() => {
    const fetchPhoto = async () => {
      if (!isAuthenticated || !user || !isInitialized) {
        authLogger.debug('Skipping photo fetch - authentication not ready', {
          isAuthenticated,
          hasUser: !!user,
          isInitialized
        })
        return
      }

      try {
        authLogger.debug('Starting profile photo fetch')
        setIsLoadingPhoto(true)
        
        // Get access token
        const silentRequest = {
          scopes: ['User.Read'],
          account: user,
        }
        const response = await msalInstance.acquireTokenSilent(silentRequest)
        const token = response.accessToken
        authLogger.debug('Access token acquired for photo fetch')
        
        // Fetch profile photo
        const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        authLogger.debug('Profile photo fetch response', { status: photoResponse.status })

        if (photoResponse.ok) {
          authLogger.debug('Photo fetch successful, creating blob URL')
          const blob = await photoResponse.blob()
          const photoUrl = URL.createObjectURL(blob)
          setProfilePhoto(photoUrl)
          authLogger.info('Profile photo loaded successfully')
        } else if (photoResponse.status === 404) {
          authLogger.debug('User has no profile photo')
          setProfilePhoto(null)
        } else {
          throw new Error(`Failed to fetch profile photo: ${photoResponse.status}`)
        }
      } catch (error) {
        authLogger.error('Error fetching profile photo', {
          error: error.message,
          name: error.name
        })
        setProfilePhoto(null)
      } finally {
        setIsLoadingPhoto(false)
      }
    }

    fetchPhoto()
  }, [isAuthenticated, user, isInitialized])

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
        // Clear the logout flag since user is logging in again
        localStorage.removeItem('userLoggedOut')
        
        setIsAuthenticated(true)
        setUser(response.account)
        
        // Profile photo will be fetched via useEffect when isAuthenticated/user changes
        
        return response
      }
    } catch (error) {
      authLogger.error('Login error', {
        error: error.message,
        name: error.name
      })
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

      // Clear any cached tokens for this app without signing out of Microsoft
      // Note: We don't need to clear the MSAL cache since we're using localStorage flag
      // to control authentication state
      
      // Set a flag in localStorage to indicate the user manually logged out
      localStorage.setItem('userLoggedOut', 'true')
      
      // Clear local authentication state
      setIsAuthenticated(false)
      setUser(null)
      
      // Clear profile photo and revoke object URL to prevent memory leaks
      if (profilePhoto) {
        URL.revokeObjectURL(profilePhoto)
      }
      setProfilePhoto(null)
    } catch (error) {
      authLogger.error('Logout error', {
        error: error.message,
        name: error.name
      })
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
      authLogger.warn('Silent token acquisition failed', {
        error: error.message
      })
      
      // If silent request fails, try interactive
      if (error.name === 'InteractionRequiredAuthError') {
        try {
          const response = await msalInstance.acquireTokenPopup({
            scopes: scopes,
            account: user,
          })
          return response.accessToken
        } catch (interactiveError) {
          authLogger.error('Interactive token acquisition failed', {
            error: interactiveError.message,
            name: interactiveError.name
          })
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
    profilePhoto,
    isLoadingPhoto,
    login,
    logout,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}