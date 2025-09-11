/**
 * TodoImage Component
 * Displays photos from OneDrive with loading states and error handling
 */

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { usePhotoService } from '../hooks/usePhotoService'

const ImageContainer = styled.div`
  position: relative;
  display: inline-block;
  margin: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  overflow: hidden;
  background: ${props => props.theme.colors.background.secondary};
  max-width: 100%;
  vertical-align: middle;
  
  /* Prevent image from breaking layout */
  line-height: 0;
  
  /* Better inline integration on desktop */
  @media (min-width: 768px) {
    margin: 0 ${props => props.theme.spacing.xs} 0 0;
  }
`

const TodoImg = styled.img`
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  /* Mobile optimizations */
  @media (max-width: 767px) {
    max-width: 280px;
    max-height: 280px;
    object-fit: cover;
  }
  
  /* Desktop optimizations */
  @media (min-width: 768px) {
    max-width: 200px;
    max-height: 200px;
    object-fit: cover;
    cursor: pointer;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  }
`

const LoadingPlaceholder = styled.div`
  width: 200px;
  height: 150px;
  background: ${props => props.theme.colors.background.secondary};
  border: 2px dashed ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  gap: ${props => props.theme.spacing.xs};
  
  @media (max-width: 767px) {
    width: 150px;
    height: 100px;
    font-size: ${props => props.theme.typography.fontSize.xs};
  }
`

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.theme.colors.text.tertiary};
  border-top: 2px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 767px) {
    width: 16px;
    height: 16px;
  }
`

const ErrorPlaceholder = styled(LoadingPlaceholder)`
  border-color: ${props => props.theme.colors.error || '#ff6b6b'};
  color: ${props => props.theme.colors.error || '#ff6b6b'};
  background: ${props => (props.theme.colors.error || '#ff6b6b') + '10'};
`

const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* Only show modal on desktop */
  @media (max-width: 767px) {
    display: none;
  }
`

const ModalImage = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: ${props => props.theme.borderRadius.md};
`

const TodoImage = ({ 
  src, 
  alt = 'Todo Photo', 
  completed = false,
  ...props 
}) => {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  const photoService = usePhotoService()

  useEffect(() => {
    loadImage()
  }, [src, photoService])

  const loadImage = async () => {
    if (!src || !photoService) {
      setError('Photo service not available')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Extract filename from OneDrive reference
      const filename = extractFilename(src)
      if (!filename) {
        throw new Error('Invalid photo reference')
      }

      console.log('Loading photo:', filename)
      
      // Get photo URL from OneDrive
      const url = await photoService.getPhotoUrl(filename)
      setImageUrl(url)
      
    } catch (err) {
      console.error('Failed to load photo:', err)
      setError(err.message || 'Failed to load photo')
    } finally {
      setLoading(false)
    }
  }

  const extractFilename = (src) => {
    // Handle onedrive:photos/filename.jpg format
    if (src.startsWith('onedrive:photos/')) {
      return src.replace('onedrive:photos/', '')
    }
    // Handle direct filename
    if (src.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return src
    }
    return null
  }

  const handleImageClick = (e) => {
    e.stopPropagation()
    // Only show modal on desktop
    if (window.innerWidth > 767) {
      setShowModal(true)
    }
  }

  const handleModalClick = (e) => {
    e.stopPropagation()
    setShowModal(false)
  }

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', src)
  }

  const handleImageError = () => {
    console.error('Image failed to load:', src)
    setError('Failed to display photo')
  }

  if (loading) {
    return (
      <ImageContainer {...props}>
        <LoadingPlaceholder>
          <LoadingSpinner />
          Loading photo...
        </LoadingPlaceholder>
      </ImageContainer>
    )
  }

  if (error || !imageUrl) {
    return (
      <ImageContainer {...props}>
        <ErrorPlaceholder>
          <span>⚠️</span>
          {error || 'Photo not found'}
        </ErrorPlaceholder>
      </ImageContainer>
    )
  }

  return (
    <>
      <ImageContainer {...props}>
        <TodoImg
          src={imageUrl}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleImageClick}
          style={{ 
            opacity: completed ? 0.6 : 1,
            filter: completed ? 'grayscale(50%)' : 'none'
          }}
        />
      </ImageContainer>

      {/* Full-size modal for desktop - rendered at document body level */}
      {showModal && createPortal(
        <ImageModal onClick={handleModalClick}>
          <ModalImage 
            src={imageUrl} 
            alt={alt}
            onClick={(e) => e.stopPropagation()}
          />
        </ImageModal>,
        document.body
      )}
    </>
  )
}

export default TodoImage