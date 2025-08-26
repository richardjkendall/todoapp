import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const STORAGE_TYPES = {
  LOCAL: 'localStorage',
  ONEDRIVE: 'oneDrive'
}

/**
 * Storage type management hook - handles switching between local and OneDrive storage
 */
export const useStorageManager = () => {
  const { isAuthenticated } = useAuth()
  
  const [storageType, setStorageType] = useState(() => {
    const saved = localStorage.getItem('preferredStorageType')
    return saved || STORAGE_TYPES.ONEDRIVE // Default to OneDrive since we simplified the app
  })

  /**
   * Switch storage type
   */
  const switchStorageType = useCallback((type) => {
    if (type === STORAGE_TYPES.ONEDRIVE && !isAuthenticated) {
      console.warn('Cannot switch to OneDrive storage when not authenticated')
      return false
    }
    
    setStorageType(type)
    localStorage.setItem('preferredStorageType', type)
    return true
  }, [isAuthenticated])

  /**
   * Auto-switch to OneDrive when authenticated and no preference is saved
   */
  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('preferredStorageType')) {
      console.log('Auto-switching to OneDrive mode for authenticated user')
      setStorageType(STORAGE_TYPES.ONEDRIVE)
      localStorage.setItem('preferredStorageType', STORAGE_TYPES.ONEDRIVE)
    }
  }, [isAuthenticated])

  /**
   * Check if OneDrive mode is active
   */
  const isOneDriveMode = storageType === STORAGE_TYPES.ONEDRIVE && isAuthenticated

  return {
    storageType,
    switchStorageType,
    isOneDriveMode,
    STORAGE_TYPES
  }
}