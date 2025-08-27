import { useState, useRef, useCallback } from 'react'

const useSwipeGesture = (onSwipeLeft, onSwipeRight, options = {}) => {
  const {
    threshold = 100,        // Minimum distance for swipe
    velocityThreshold = 0.3, // Minimum velocity for swipe
    preventDefaultThreshold = 10, // Prevent scroll when moving this much
    restoreSpeed = 300,     // Animation speed for restore
    maxVerticalMovement = 50 // Cancel swipe if too much vertical movement
  } = options

  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [actionRevealed, setActionRevealed] = useState(null) // 'left' | 'right' | null

  const touchStartRef = useRef(null)
  const touchMoveRef = useRef(null)
  const isDraggingRef = useRef(false)
  const hasPreventedDefaultRef = useRef(false)

  const resetSwipe = useCallback(() => {
    setIsAnimating(true)
    setSwipeOffset(0)
    setActionRevealed(null)
    setTimeout(() => setIsAnimating(false), restoreSpeed)
  }, [restoreSpeed])

  const executeAction = useCallback((direction) => {
    setIsAnimating(true)
    
    // Animate to full swipe
    const fullSwipe = direction === 'right' ? 200 : -200
    setSwipeOffset(fullSwipe)
    
    setTimeout(() => {
      if (direction === 'right' && onSwipeRight) {
        onSwipeRight()
      } else if (direction === 'left' && onSwipeLeft) {
        onSwipeLeft()
      }
      
      // Reset after action
      setTimeout(() => {
        setSwipeOffset(0)
        setActionRevealed(null)
        setIsAnimating(false)
      }, 150)
    }, 200)
  }, [onSwipeLeft, onSwipeRight])

  const handleTouchStart = useCallback((e) => {
    // Don't interfere with existing drag operations or if animating
    if (isAnimating) return

    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    touchMoveRef.current = null
    isDraggingRef.current = false
    hasPreventedDefaultRef.current = false
  }, [isAnimating])

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current || isAnimating) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    
    touchMoveRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      deltaX,
      deltaY,
      time: Date.now()
    }

    // Cancel if too much vertical movement
    if (Math.abs(deltaY) > maxVerticalMovement) {
      resetSwipe()
      return
    }

    // Prevent default scroll if horizontal movement is significant
    if (Math.abs(deltaX) > preventDefaultThreshold && !hasPreventedDefaultRef.current) {
      e.preventDefault()
      hasPreventedDefaultRef.current = true
    }

    // Only allow swipe if movement is primarily horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isDraggingRef.current = true
      
      // Limit swipe distance with resistance
      let limitedDelta = deltaX
      const maxSwipe = 120
      if (Math.abs(deltaX) > maxSwipe) {
        const excess = Math.abs(deltaX) - maxSwipe
        const resistance = 1 - Math.min(excess / 100, 0.8)
        limitedDelta = Math.sign(deltaX) * (maxSwipe + excess * resistance)
      }
      
      setSwipeOffset(limitedDelta)
      
      // Show action preview based on direction and threshold
      if (Math.abs(limitedDelta) > threshold * 0.5) {
        const direction = limitedDelta > 0 ? 'right' : 'left'
        setActionRevealed(direction)
      } else {
        setActionRevealed(null)
      }
    }
  }, [isAnimating, threshold, preventDefaultThreshold, maxVerticalMovement, resetSwipe])

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current || !isDraggingRef.current || isAnimating) {
      resetSwipe()
      return
    }

    const touchMove = touchMoveRef.current
    if (!touchMove) {
      resetSwipe()
      return
    }

    const { deltaX, deltaY, time } = touchMove
    const duration = time - touchStartRef.current.time
    const velocity = Math.abs(deltaX) / duration

    // Cancel if too much vertical movement
    if (Math.abs(deltaY) > maxVerticalMovement) {
      resetSwipe()
      return
    }

    // Determine if swipe should execute
    const shouldExecute = Math.abs(deltaX) > threshold || velocity > velocityThreshold
    
    if (shouldExecute) {
      const direction = deltaX > 0 ? 'right' : 'left'
      executeAction(direction)
    } else {
      resetSwipe()
    }

    // Clean up
    touchStartRef.current = null
    touchMoveRef.current = null
    isDraggingRef.current = false
    hasPreventedDefaultRef.current = false
  }, [isAnimating, threshold, velocityThreshold, maxVerticalMovement, executeAction, resetSwipe])

  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: resetSwipe
  }

  return {
    swipeOffset,
    actionRevealed,
    isAnimating,
    isDragging: isDraggingRef.current,
    touchHandlers,
    resetSwipe
  }
}

export default useSwipeGesture