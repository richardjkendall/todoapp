/**
 * PhotoButton Component
 * Camera button for adding photos to todos
 * Shows only on mobile devices with camera support
 */

import React, { useState, useEffect } from 'react'
import CameraCapture from './CameraCapture'
import { usePhotoService } from '../hooks/usePhotoService'
import { useToastContext } from '../context/ToastContext'
import { isMobileDevice, hasCameraSupport, testCameraAccess } from '../utils/deviceUtils'
import { CameraIcon } from './Icons'
import { Button } from '../styles/TodoStyles'


const PhotoButton = ({ onPhotoAdded, disabled = false, onShowCamera }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [cameraSupported, setCameraSupported] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  
  const photoService = usePhotoService()
  const { showSuccess, showError, showWarning } = useToastContext()

  // Check basic camera support on mount (without accessing camera)
  useEffect(() => {
    checkBasicCameraSupport()
  }, [])

  const checkBasicCameraSupport = () => {
    // Only check basic requirements without accessing camera
    const isMobile = isMobileDevice()
    const hasCamera = hasCameraSupport()
    
    if (!isMobile) {
      setCameraSupported(false)
      setCameraError('Camera feature is available only on mobile devices')
      return
    }
    
    if (!hasCamera) {
      setCameraSupported(false)
      setCameraError('Camera not supported on this device')
      return
    }

    // If basic checks pass, assume camera will work
    // We'll handle any actual camera errors when user tries to use it
    setCameraSupported(true)
    setCameraError(null)
  }

  const handlePhotoCapture = async (photoBlob) => {
    if (!photoService) {
      showError('Photo service not available. Please sign in to OneDrive.')
      return
    }
    setIsUploading(true)

    try {
      console.log('Starting photo upload...', { 
        size: photoBlob.size,
        type: photoBlob.type 
      })

      // Validate photo before upload
      const validation = photoService.validatePhotoBlob(photoBlob)
      if (!validation.valid) {
        showError(`Invalid photo: ${validation.errors.join(', ')}`)
        setIsUploading(false)
        return
      }

      // Upload photo to OneDrive
      const result = await photoService.uploadPhoto(photoBlob, 'Todo Photo')
      
      console.log('Photo upload successful:', result)
      
      // Pass markdown reference to parent
      onPhotoAdded(result.markdown)
      
      showSuccess('Photo added successfully!')
      
    } catch (error) {
      console.error('Photo upload failed:', error)
      showError(`Failed to upload photo: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = async () => {
    if (!photoService) {
      showWarning('Please sign in to OneDrive to use photo features.')
      return
    }

    if (!cameraSupported) {
      if (cameraError) {
        showError(cameraError)
      } else {
        showError('Camera not available on this device.')
      }
      return
    }

    // Use the parent's camera modal - actual camera access happens there
    if (onShowCamera) {
      onShowCamera(handlePhotoCapture)
    }
  }


  // Don't render if not mobile or no camera support at all
  if (!isMobileDevice() || !hasCameraSupport()) {
    return null
  }

  // Don't render if photo service is not available
  if (!photoService) {
    return null
  }

  const isDisabled = disabled || isUploading || !cameraSupported

  return (
    <>
      <Button
        type="button"
        onClick={handleButtonClick}
        disabled={isDisabled}
        title={
          isUploading ? 'Uploading photo...' :
          !cameraSupported ? (cameraError || 'Camera not available') :
          'Add photo'
        }
        style={{
          // Hide on desktop by default
          display: !isMobileDevice() || !hasCameraSupport() ? 'none' : 'flex'
        }}
      >
        <CameraIcon />
      </Button>

    </>
  )
}

export default PhotoButton