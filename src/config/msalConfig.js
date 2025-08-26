import { PublicClientApplication } from '@azure/msal-browser'

// MSAL configuration
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE', // Replace with your Azure AD app client ID
    authority: 'https://login.microsoftonline.com/common', // Multi-tenant support
    redirectUri: window.location.origin, // Will be http://localhost:5173 in dev
  },
  cache: {
    cacheLocation: 'localStorage', // Store tokens in localStorage
    storeAuthStateInCookie: false,
  },
}

// Microsoft Graph API scopes
export const graphScopes = {
  readWriteAppFolder: ['https://graph.microsoft.com/Files.ReadWrite.AppFolder'],
  userRead: ['https://graph.microsoft.com/User.Read'],
  all: [
    'https://graph.microsoft.com/Files.ReadWrite.AppFolder',
    'https://graph.microsoft.com/User.Read'
  ]
}

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig)

// Initialize MSAL
export const initializeMsal = async () => {
  try {
    await msalInstance.initialize()
    
    // Handle redirect promise if returning from redirect
    const response = await msalInstance.handleRedirectPromise()
    if (response) {
      console.log('Authentication successful:', response)
    }
  } catch (error) {
    console.error('MSAL initialization error:', error)
  }
}