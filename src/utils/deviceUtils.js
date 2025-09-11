/**
 * Device Detection Utilities
 * Detect mobile devices, camera support, and device capabilities
 */

/**
 * Check if device is primarily a mobile/touch device
 * @returns {boolean} True if mobile device
 */
export const isMobileDevice = () => {
  // Check user agent for mobile patterns
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // Check for touch as primary input
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
  
  // Check screen size (mobile-like)
  const isSmallScreen = window.matchMedia('(max-width: 1024px)').matches
  
  // Check for coarse pointer (touch)
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  
  // Primary mobile if: mobile UA OR (small screen AND touch) OR coarse pointer only
  return isMobileUA || (isSmallScreen && hasTouch) || hasCoarsePointer
}

/**
 * Check if device supports camera access
 * @returns {boolean} True if camera is supported
 */
export const hasCameraSupport = () => {
  return 'mediaDevices' in navigator && 
         'getUserMedia' in navigator.mediaDevices &&
         window.isSecureContext // HTTPS required for camera
}

/**
 * Check if device is likely to have a rear camera
 * @returns {boolean} True if likely has rear camera
 */
export const hasRearCamera = () => {
  // Mobile devices typically have rear cameras
  const isMobile = isMobileDevice()
  
  // Check if not desktop (which typically only has front cameras)
  const isDesktop = window.matchMedia('(min-width: 1025px)').matches && 
                   window.matchMedia('(pointer: fine)').matches
  
  return isMobile && !isDesktop
}

/**
 * Get optimal camera constraints for device
 * @returns {Object} MediaStreamConstraints for getUserMedia
 */
export const getCameraConstraints = () => {
  const constraints = {
    video: {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      frameRate: { ideal: 30, max: 30 }
    },
    audio: false
  }

  // Prefer rear camera on mobile devices
  if (hasRearCamera()) {
    constraints.video.facingMode = { ideal: 'environment' }
  }

  // Lower resolution for older/slower devices
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2
  if (isLowEndDevice) {
    constraints.video.width = { ideal: 1280, max: 1280 }
    constraints.video.height = { ideal: 720, max: 720 }
  }

  return constraints
}

/**
 * Check if device supports specific camera features
 * @returns {Promise<Object>} Camera capabilities
 */
export const getCameraCapabilities = async () => {
  if (!hasCameraSupport()) {
    return {
      supported: false,
      error: 'Camera not supported'
    }
  }

  try {
    // Try to get basic camera access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    })
    
    const videoTrack = stream.getVideoTracks()[0]
    const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}
    
    // Clean up stream
    stream.getTracks().forEach(track => track.stop())
    
    return {
      supported: true,
      facingModes: capabilities.facingMode || ['user'],
      hasRearCamera: capabilities.facingMode?.includes('environment'),
      hasFrontCamera: capabilities.facingMode?.includes('user'),
      resolutions: {
        maxWidth: capabilities.width?.max,
        maxHeight: capabilities.height?.max,
        minWidth: capabilities.width?.min,
        minHeight: capabilities.height?.min
      },
      hasFlash: capabilities.torch || false
    }
  } catch (error) {
    return {
      supported: false,
      error: error.message,
      permissionDenied: error.name === 'NotAllowedError'
    }
  }
}

/**
 * Check if current context allows camera access
 * @returns {Object} Context information
 */
export const getCameraContext = () => {
  return {
    isSecure: window.isSecureContext,
    protocol: window.location.protocol,
    isLocalhost: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1',
    hasPermissionAPI: 'permissions' in navigator,
    hasMediaDevices: 'mediaDevices' in navigator,
    hasGetUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices
  }
}

/**
 * Get user-friendly error message for camera issues
 * @param {Error} error - Camera error
 * @returns {string} User-friendly error message
 */
export const getCameraErrorMessage = (error) => {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Camera permission denied. Please allow camera access and try again.'
    case 'NotFoundError':
      return 'No camera found on this device.'
    case 'NotSupportedError':
      return 'Camera not supported on this device.'
    case 'NotReadableError':
      return 'Camera is already in use by another application.'
    case 'OverconstrainedError':
      return 'Camera settings not supported. Trying with basic settings.'
    case 'SecurityError':
      return 'Camera access blocked for security reasons. Make sure you\'re using HTTPS.'
    case 'AbortError':
      return 'Camera access was interrupted.'
    default:
      return `Camera error: ${error.message || 'Unknown error'}`
  }
}

/**
 * Test camera access without starting stream
 * @returns {Promise<Object>} Test result
 */
export const testCameraAccess = async () => {
  const context = getCameraContext()
  
  if (!context.isSecure && !context.isLocalhost) {
    return {
      success: false,
      error: 'Camera requires HTTPS or localhost',
      suggestion: 'Please use HTTPS to access camera features'
    }
  }

  if (!context.hasGetUserMedia) {
    return {
      success: false,
      error: 'getUserMedia not supported',
      suggestion: 'Please use a modern browser that supports camera access'
    }
  }

  try {
    const capabilities = await getCameraCapabilities()
    return {
      success: capabilities.supported,
      error: capabilities.error,
      capabilities,
      context
    }
  } catch (error) {
    return {
      success: false,
      error: getCameraErrorMessage(error),
      context
    }
  }
}