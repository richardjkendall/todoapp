/**
 * Device detection utilities for optimizing user experience
 */

/**
 * Detects if the current device is touch-capable
 * @returns {boolean} True if device supports touch
 */
export function isTouchDevice() {
  // Check multiple indicators for touch support
  const hasTouch = (
    // Modern touch points API
    'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0
  ) || (
    // Legacy touch API
    'msMaxTouchPoints' in navigator && navigator.msMaxTouchPoints > 0
  ) || (
    // Touch events support
    'ontouchstart' in window || 
    'ontouchstart' in document.documentElement
  ) || (
    // CSS media query support
    window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  )

  return hasTouch
}

/**
 * Detects if the device is likely a mobile device
 * Combines touch detection with screen size heuristics
 * @returns {boolean} True if device appears to be mobile
 */
export function isMobileDevice() {
  const hasSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768
  const isTouch = isTouchDevice()
  
  // Mobile if both touch and small screen, or obvious mobile user agent
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  return (hasSmallScreen && isTouch) || mobileUA
}

/**
 * Detects if device has native sharing capabilities
 * @returns {boolean} True if Web Share API is available
 */
export function hasNativeShare() {
  return typeof navigator !== 'undefined' && 
         'share' in navigator &&
         typeof navigator.share === 'function'
}

/**
 * Comprehensive check for devices that should use native sharing
 * @returns {boolean} True if device should prefer native sharing
 */
export function shouldUseNativeShare() {
  return isTouchDevice() && hasNativeShare()
}

/**
 * Detects the primary input method of the device
 * @returns {string} 'touch', 'mouse', or 'unknown'
 */
export function getPrimaryInputMethod() {
  // Check for CSS pointer media queries (most reliable)
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    return 'touch'
  }
  
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    return 'mouse'
  }
  
  // Fallback to touch point detection
  if (isTouchDevice()) {
    return 'touch'
  }
  
  return 'mouse'
}

/**
 * Gets device type for analytics or feature detection
 * @returns {string} 'mobile', 'tablet', 'desktop'
 */
export function getDeviceType() {
  if (isMobileDevice()) {
    // Distinguish between phone and tablet by screen size
    const isTabletSize = (
      (window.innerWidth >= 600 && window.innerWidth <= 1024) ||
      (window.innerHeight >= 600 && window.innerHeight <= 1024)
    )
    
    return isTabletSize ? 'tablet' : 'mobile'
  }
  
  return 'desktop'
}