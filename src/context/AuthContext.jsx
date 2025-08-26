import { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
          console.log('Redirect authentication successful:', response)
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
        console.error('Error initializing MSAL or checking auth status:', error)
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
        console.log('Skipping photo fetch - not ready:', { isAuthenticated, user: !!user, isInitialized })
        return
      }

      try {
        console.log('Starting profile photo fetch...')
        setIsLoadingPhoto(true)
        
        // Get access token
        const silentRequest = {
          scopes: ['User.Read'],
          account: user,
        }
        const response = await msalInstance.acquireTokenSilent(silentRequest)
        const token = response.accessToken
        console.log('Got access token for photo fetch')
        
        // Fetch profile photo
        const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        console.log('Photo fetch response status:', photoResponse.status)

        if (photoResponse.ok) {
          console.log('Photo fetch successful, creating blob URL')
          const blob = await photoResponse.blob()
          const photoUrl = URL.createObjectURL(blob)
          setProfilePhoto(photoUrl)
          console.log('Profile photo set:', photoUrl)
        } else if (photoResponse.status === 404) {
          console.log('User has no profile photo (404)')
          setProfilePhoto(null)
        } else {
          throw new Error(`Failed to fetch profile photo: ${photoResponse.status}`)
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error)
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
    profilePhoto,
    isLoadingPhoto,
    login,
    logout,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}