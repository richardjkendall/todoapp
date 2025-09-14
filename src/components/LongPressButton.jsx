/**
 * LongPressButton Component
 * Shows context menu on long press with photo and other actions
 * Only shows on mobile devices
 */

import { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { CameraIcon, PlusIcon, SearchIcon } from './Icons'
import { Button } from '../styles/TodoStyles'
import { isMobileDevice, hasCameraSupport } from '../utils/deviceUtils'
import { usePhotoService } from '../hooks/usePhotoService'
import { useToastContext } from '../context/ToastContext'
import { appLogger } from '../utils/logger'

const ButtonContainer = styled.div`
  position: relative;
  display: inline-block;
`

const ContextMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.xs};
  min-width: 120px;
  opacity: ${props => props.show ? 1 : 0};
  transform: ${props => props.show ? 'scale(1)' : 'scale(0.9)'};
  pointer-events: ${props => props.show ? 'auto' : 'none'};
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
  z-index: ${props => props.show ? 10001 : -1}; /* Only use high z-index when actually shown */
  display: ${props => props.show ? 'block' : 'none'}; /* Completely hide when not shown */
  
  /* Ensure all child elements are clickable only when shown */
  * {
    pointer-events: ${props => props.show ? 'auto' : 'none'};
  }
  
  /* Arrow pointing up */
  &::after {
    content: '';
    position: absolute;
    bottom: 100%;
    right: 16px;
    border: 6px solid transparent;
    border-bottom-color: ${props => props.theme.colors.card};
    filter: drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.1));
    pointer-events: none;
  }
`

const ContextMenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background: none;
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
  pointer-events: auto;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  &:hover {
    background: ${props => props.theme.colors.background};
  }
  
  &:active {
    background: ${props => props.theme.colors.border};
  }
  
  &:disabled {
    color: ${props => props.theme.colors.text.tertiary};
    cursor: not-allowed;
  }
  
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    pointer-events: none; /* Prevent SVG from intercepting clicks */
  }
`

const PressButton = styled(Button)`
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  
  &.long-pressing {
    transform: scale(0.95);
    background: ${props => props.theme.colors.border};
  }
`

const LongPressButton = ({ 
  onPhotoAdded, 
  onShowCamera, 
  isSearchMode, 
  disabled = false 
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isLongPressing, setIsLongPressing] = useState(false)
  
  const buttonRef = useRef(null)
  const longPressTimer = useRef(null)
  const photoService = usePhotoService()
  const { showWarning, showError } = useToastContext()
  
  // Check if camera is available
  const cameraAvailable = isMobileDevice() && hasCameraSupport() && photoService

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // More specific checks to avoid interfering with other UI elements
      if (buttonRef.current && 
          !buttonRef.current.contains(event.target) &&
          !event.target.closest('[data-context-menu]') &&
          !event.target.closest('[data-testid*="filter-"]') && // Avoid filter buttons
          !event.target.closest('.filter-chip') && // Avoid filter chips
          !event.target.closest('button[data-testid]')) { // Avoid other test buttons
        setShowMenu(false)
      }
    }

    if (showMenu) {
      // Use capture phase and add a small delay to avoid conflicts
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside, true)
      }, 100)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [showMenu])

  // Set up long press listeners
  useEffect(() => {
    const button = buttonRef.current
    if (!button || !isMobileDevice()) return

    const handleTouchStart = () => {
      if (disabled) return
      
      // Don't prevent default - allow regular clicks to work
      // Only prevent selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      }
      
      setIsLongPressing(true)
      
      longPressTimer.current = setTimeout(() => {
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
        
        setShowMenu(true)
        setIsLongPressing(false)
      }, 500) // 500ms for long press
    }

    const handleTouchEnd = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      
      setIsLongPressing(false)
    }

    const handleTouchMove = () => {
      // Cancel long press if finger moves (this allows scrolling to work)
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
        setIsLongPressing(false)
      }
      
      // Clear any selection that might occur during movement
      if (window.getSelection) {
        window.getSelection().removeAllRanges()
      }
    }

    button.addEventListener('touchstart', handleTouchStart, { passive: true })
    button.addEventListener('touchend', handleTouchEnd, { passive: true })
    button.addEventListener('touchmove', handleTouchMove, { passive: true })
    
    // Always disable context menu on this button
    const handleContextMenu = (e) => e.preventDefault()
    button.addEventListener('contextmenu', handleContextMenu, { passive: false })

    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
      button.removeEventListener('touchstart', handleTouchStart)
      button.removeEventListener('touchend', handleTouchEnd)
      button.removeEventListener('touchmove', handleTouchMove)
      button.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [disabled])

  const handleRegularClick = (e) => {
    e.preventDefault()
    
    // If menu is showing, close it
    if (showMenu) {
      setShowMenu(false)
      return
    }
    
    // Regular button behavior - submit form
    if (isSearchMode) {
      const form = e.target.closest('form')
      if (form) {
        form.requestSubmit()
      }
    } else {
      const form = e.target.closest('form')
      if (form) {
        form.requestSubmit()
      }
    }
  }

  const handlePhotoAction = async () => {
    setShowMenu(false)
    
    if (!photoService) {
      showWarning('Please sign in to OneDrive to use photo features.')
      return
    }

    if (onShowCamera) {
      const handlePhotoCapture = async (photoBlob) => {
        try {
          appLogger.debug('Starting photo upload from long press menu', { 
            size: photoBlob.size,
            type: photoBlob.type 
          })

          // Validate photo before upload
          const validation = photoService.validatePhotoBlob(photoBlob)
          if (!validation.valid) {
            showError(`Invalid photo: ${validation.errors.join(', ')}`)
            return
          }

          // Upload photo to OneDrive
          const result = await photoService.uploadPhoto(photoBlob, 'Todo Photo')
          
          // Pass markdown reference to parent
          onPhotoAdded(result.markdown)
          
        } catch (error) {
          appLogger.error('Photo upload failed from long press menu', { error: error.message })
          showError(`Failed to upload photo: ${error.message}`)
        }
      }
      
      onShowCamera(handlePhotoCapture)
    }
  }

  // Don't render on desktop
  if (!isMobileDevice()) {
    return null
  }

  return (
    <ButtonContainer ref={buttonRef}>
      <PressButton
        type="button"
        onClick={handleRegularClick}
        disabled={disabled}
        title={isSearchMode ? 'Search' : 'Add Todo (Long press for more options)'}
        className={isLongPressing ? 'long-pressing' : ''}
      >
        {isSearchMode ? <SearchIcon /> : <PlusIcon />}
      </PressButton>

      <ContextMenu show={showMenu} data-context-menu>
        {cameraAvailable && !isSearchMode && (
          <ContextMenuItem 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handlePhotoAction()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handlePhotoAction()
            }}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          >
            <CameraIcon />
            Take Photo
          </ContextMenuItem>
        )}
        
        <ContextMenuItem 
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(false)
            // Future: Add more actions here
          }}
          onMouseDown={(e) => e.preventDefault()}
          disabled
        >
          <PlusIcon />
          Quick Add (Coming Soon)
        </ContextMenuItem>
      </ContextMenu>
    </ButtonContainer>
  )
}

export default LongPressButton