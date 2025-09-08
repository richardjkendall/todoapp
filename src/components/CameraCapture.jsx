/**
 * CameraCapture Component
 * Full-screen camera interface for capturing photos on mobile devices
 */

import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { CancelIcon, CheckIcon } from './Icons'
import { getCameraConstraints, getCameraErrorMessage } from '../utils/deviceUtils'

const CameraModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: ${props => props.theme.spacing.lg};
  gap: ${props => props.theme.spacing.lg};
  animation: fadeIn 0.2s ease;
  cursor: pointer;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.md};
  }
`

const CameraVideo = styled.video`
  width: 500px;
  height: 400px;
  object-fit: cover;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: #000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: default;
  
  @media (max-width: 767px) {
    width: 90vw;
    height: 60vh;
    max-width: 400px;
    max-height: 300px;
    border-radius: ${props => props.theme.borderRadius.md};
  }
`

const CameraControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.md};
  background: rgba(0, 0, 0, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: default;
  
  @media (max-width: 767px) {
    gap: ${props => props.theme.spacing.lg};
    padding: ${props => props.theme.spacing.sm};
  }
`

const ControlButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: white;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CaptureButton = styled(ControlButton)`
  width: 80px;
  height: 80px;
  font-size: 32px;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.8);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: white;
  }
  
  &::after {
    content: '';
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    position: absolute;
  }
`

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: center;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.base};
  max-width: 80%;
`

const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  &::before {
    content: '';
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const CameraCapture = ({ onPhotoCapture, onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stream, setStream] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    
    // Cleanup on unmount
    return () => {
      cleanup()
    }
  }, [])

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      // Small delay to allow for orientation change to complete
      setTimeout(() => {
        if (videoRef.current) {
          // Force video to recalculate dimensions
          videoRef.current.style.height = '100vh'
          videoRef.current.style.width = '100vw'
        }
      }, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    return () => window.removeEventListener('orientationchange', handleOrientationChange)
  }, [])

  // Cleanup when component unmounts or closes
  useEffect(() => {
    return () => {
      // Ensure cleanup happens when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => {
          if (track.readyState !== 'ended') {
            track.stop()
            console.log('Unmount cleanup - stopped camera track:', track.kind)
          }
        })
      }
    }
  }, [stream])

  const startCamera = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('Starting camera...')
      const constraints = getCameraConstraints()
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
          console.log('Camera started successfully')
        }
      }
      
    } catch (err) {
      console.error('Camera error:', err)
      const errorMessage = getCameraErrorMessage(err)
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas not available')
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      console.log('Capturing photo:', { 
        width: canvas.width, 
        height: canvas.height 
      })
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to blob
      const photoBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create photo blob'))
          }
        }, 'image/jpeg', 0.8) // 80% quality
      })
      
      console.log('Photo captured:', { 
        size: photoBlob.size,
        type: photoBlob.type 
      })
      
      // Pass photo to parent component and cleanup immediately
      onPhotoCapture(photoBlob)
      
      // Cleanup camera immediately after capture
      setTimeout(() => {
        cleanup()
      }, 100) // Small delay to ensure photo capture completes
      
    } catch (error) {
      console.error('Photo capture failed:', error)
      setError(`Failed to capture photo: ${error.message}`)
    }
  }

  const cleanup = () => {
    console.log('Cleaning up camera...')
    
    // Stop video stream immediately
    if (stream) {
      stream.getTracks().forEach(track => {
        if (track.readyState !== 'ended') {
          track.stop()
          console.log('Stopped camera track:', track.kind, track.readyState)
        }
      })
      setStream(null)
    }
    
    // Clear video source immediately
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load() // Force video element to release resources
    }
  }

  const handleClose = () => {
    cleanup()
    onClose()
  }

  const handleBackgroundClick = (e) => {
    // Only close if clicking the background (not video or controls)
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleContentClick = (e) => {
    // Prevent clicks on video and controls from propagating to background
    e.stopPropagation()
  }

  const handleRetry = () => {
    cleanup()
    startCamera()
  }

  return (
    <CameraModal onClick={handleBackgroundClick}>
      {/* Video element (hidden canvas for capture) */}
      <CameraVideo 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        onClick={handleContentClick}
        style={{ display: isLoading || error ? 'none' : 'block' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Loading state */}
      {isLoading && !error && (
        <LoadingSpinner onClick={handleContentClick}>
          Starting camera...
        </LoadingSpinner>
      )}
      
      {/* Error state */}
      {error && (
        <ErrorMessage onClick={handleContentClick}>
          <div style={{ marginBottom: '16px' }}>⚠️ Camera Error</div>
          <div style={{ marginBottom: '16px', fontSize: '14px' }}>{error}</div>
          <ControlButton onClick={handleRetry}>
            Retry
          </ControlButton>
        </ErrorMessage>
      )}
      
      {/* Camera controls - positioned below video */}
      {!isLoading && !error && (
        <CameraControls onClick={handleContentClick}>
          <CaptureButton onClick={capturePhoto} title="Take Photo">
            {/* Circle button styling handled by CSS */}
          </CaptureButton>
        </CameraControls>
      )}
    </CameraModal>
  )
}

export default CameraCapture