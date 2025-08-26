import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

const HelperContainer = styled.div`
  position: fixed;
  z-index: 9999;
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  padding: ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  opacity: ${props => props.show ? 1 : 0};
  transform: translateY(0);
  transition: opacity 0.2s ease;
  pointer-events: ${props => props.show ? 'auto' : 'none'};
  min-width: 300px;
  max-width: 500px;
  
  @media (max-width: 767px) {
    display: none; /* Hide helper on mobile to prevent interference with add button */
  }
  
  @media (max-width: 480px) {
    min-width: 280px;
    max-width: calc(100vw - 2rem);
  }
`

const HelperTitle = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`

const HelperList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`

const HelperItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  line-height: ${props => props.theme.typography.lineHeight.tight};
`

const HelperCode = styled.code`
  background: ${props => props.theme.colors.surface};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8em;
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  min-width: 80px;
  text-align: center;
`

const InputHelper = ({ show, isSearchMode, inputRef }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const [isPositioned, setIsPositioned] = useState(false)
  const helperRef = useRef(null)

  const addModeHelp = [
    { code: '#work', description: 'Add tags to categorize todos' },
    { code: '!1 to !5', description: 'Set priority (1=highest, 5=lowest)' },
    { code: 'Enter', description: 'Add new line' },
    { code: 'Ctrl+Enter', description: 'Save todo' },
    { code: '/', description: 'Switch to search mode' }
  ]

  const searchModeHelp = [
    { code: '/text', description: 'Search by todo text content' },
    { code: '#tag', description: 'Filter by specific tags' },
    { code: '!3', description: 'Filter by priority level' },
    { code: 'completed:true', description: 'Show only completed todos' },
    { code: 'completed:false', description: 'Show only incomplete todos' },
    { code: 'Escape', description: 'Exit search mode' }
  ]

  const helpItems = isSearchMode ? searchModeHelp : addModeHelp

  useEffect(() => {
    if (show && inputRef?.current) {
      const updatePosition = () => {
        const rect = inputRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        })
        setIsPositioned(true)
      }

      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(updatePosition, 10)
      
      const handleScroll = () => updatePosition()
      const handleResize = () => updatePosition()
      
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleResize)
      
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    } else {
      setIsPositioned(false)
    }
  }, [show, inputRef])

  if (!show || !isPositioned) return null

  const helperContent = (
    <HelperContainer 
      ref={helperRef}
      show={show && isPositioned}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${Math.max(position.width, 300)}px`
      }}
    >
      <HelperTitle>
        {isSearchMode ? 'Search Commands' : 'Todo Formatting'}
      </HelperTitle>
      <HelperList>
        {helpItems.map((item, index) => (
          <HelperItem key={index}>
            <HelperCode>{item.code}</HelperCode>
            <span>{item.description}</span>
          </HelperItem>
        ))}
      </HelperList>
    </HelperContainer>
  )

  return createPortal(helperContent, document.body)
}

export default InputHelper