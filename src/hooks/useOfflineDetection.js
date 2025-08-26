import { useState, useEffect } from 'react'

export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      console.log('App went online')
      setWasOffline(!isOnline) // Track if we were offline before
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('App went offline')
      setIsOnline(false)
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  // Reset the wasOffline flag after it's been acknowledged
  const acknowledgeOnlineStatus = () => {
    setWasOffline(false)
  }

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    acknowledgeOnlineStatus
  }
}