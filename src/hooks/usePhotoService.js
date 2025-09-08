/**
 * Custom hook for PhotoService
 * Provides access to photo upload, management, and OneDrive integration
 */

import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import GraphService from '../services/graphService'
import PhotoService from '../services/photoService'

export const usePhotoService = () => {
  const { getAccessToken, isAuthenticated } = useAuth()
  
  // Create PhotoService instance with GraphService
  const photoService = useMemo(() => {
    if (!isAuthenticated) {
      return null
    }
    
    const graphService = new GraphService(getAccessToken)
    return new PhotoService(graphService)
  }, [getAccessToken, isAuthenticated])
  
  return photoService
}