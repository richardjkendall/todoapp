import { useState, useEffect } from 'react'

const useScrollSpy = (threshold = 100) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let ticking = false
    let lastScrollY = 0
    
    // Reduce threshold on mobile for better performance
    const isMobile = window.innerWidth <= 800
    const effectiveThreshold = isMobile ? Math.min(threshold, 30) : threshold

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          // Only update if there's a meaningful change (reduces state updates)
          if (Math.abs(currentScrollY - lastScrollY) > 5) {
            setScrollY(currentScrollY)
            const shouldBeScrolled = currentScrollY > effectiveThreshold
            setIsScrolled(prev => prev !== shouldBeScrolled ? shouldBeScrolled : prev)
            lastScrollY = currentScrollY
          }
          
          ticking = false
        })
        ticking = true
      }
    }

    // Set initial state
    const currentScrollY = window.scrollY
    setScrollY(currentScrollY)
    setIsScrolled(currentScrollY > effectiveThreshold)
    lastScrollY = currentScrollY

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return { isScrolled, scrollY }
}

export default useScrollSpy