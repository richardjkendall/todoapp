import { useEffect, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import useScrollSpy from '../hooks/useScrollSpy'

const StickyContainer = styled.div`
  position: relative;
`

const StickyContent = styled.div`
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-bottom 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              backdrop-filter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              background 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 100;
  
  @media (max-width: 800px) {
    transition: background 0.15s ease,
                transform 0.2s ease;
  }
  
  ${props => props.isSticky && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100vw;
    padding: ${props.theme.spacing.sm} ${props.theme.spacing.md};
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-bottom: 1px solid ${props.theme.colors.border};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(30, 30, 30, 0.95);
    will-change: transform;
    
    @media (min-width: 768px) {
      padding: ${props.theme.spacing.sm} ${props.theme.spacing.xl};
    }
    
    @media (min-width: 1024px) {
      padding: ${props.theme.spacing.sm} max(${props.theme.spacing['2xl']}, calc((100vw - 1200px) / 2 + ${props.theme.spacing['2xl']}));
    }
    
    @media (max-width: 800px) {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      background: rgba(30, 30, 30, 0.98);
      padding-right: calc(${props.theme.spacing.md} + env(scrollbar-width, 15px));
    }
  `}
  
  ${props => !props.isSticky && `
    padding: 0;
    background: transparent;
  `}
`

const StickyPlaceholder = styled.div`
  height: ${props => props.height}px;
  transition: height 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  overflow: hidden;
  
  @media (max-width: 800px) {
    transition: height 0.15s ease;
  }
`

const CompactHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  min-height: fit-content;
  flex-wrap: wrap;
  transition: gap 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  ${props => !props.isSticky && `
    justify-content: space-between;
  `}
  
  ${props => props.isSticky && `
    gap: ${props.theme.spacing.lg};
    flex-wrap: nowrap;
  `}
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.sm};
    
    ${props => props.isSticky && `
      gap: ${props => props.theme.spacing.xs};
      padding: ${props.theme.spacing.xs} 0;
      align-items: stretch;
      width: 100%;
    `}
  }
  
  @media (min-width: 768px) and (max-width: 900px) {
    ${props => props.isSticky && `
      gap: ${props.theme.spacing.md};
      align-items: center;
    `}
  }
  
  @media (max-width: 800px) {
    transition: gap 0.2s ease;
  }
`

const CompactTitle = styled.h1`
  color: white;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize['2xl']};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  flex-shrink: 0;
  order: 1;
  
  @media (max-width: 800px) {
    transition: font-size 0.2s ease, color 0.15s ease;
  }
  
  ${props => !props.isSticky && `
    color: ${props.theme.colors.text.primary};
    
    @media (min-width: 768px) {
      font-size: ${props.theme.typography.fontSize['3xl']};
    }
  `}
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize['2xl']};
  }
  
  @media (max-width: 767px) {
    text-align: center;
    order: 1;
    font-size: ${props => props.theme.typography.fontSize.xl};
    
    ${props => props.isSticky && `
      font-size: ${props.theme.typography.fontSize.lg};
    `}
  }
  
  @media (min-width: 768px) and (max-width: 900px) {
    ${props => props.isSticky && `
      font-size: ${props.theme.typography.fontSize.xl};
    `}
  }
`

const FormContainer = styled.div`
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              margin 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 800px) {
    transition: transform 0.2s ease, margin 0.2s ease;
  }
  
  ${props => props.isSticky && `
    transform: scale(0.95);
    order: 2;
    align-self: center;
    
    button {
      color: white !important;
      align-self: center;
      height: 2.5rem;
      padding: 0.5rem;
    }
    
    textarea {
      min-height: 40px;
      transition: height 0.1s ease;
    }
  `}
  
  ${props => !props.isSticky && `
    transform: scale(1);
    order: 3;
    width: 100%;
    flex-basis: 100%;
    margin-bottom: ${props.theme.spacing.xl};
    
    @media (min-width: 768px) {
      margin-bottom: ${props.theme.spacing['2xl']};
    }
  `}
  
  @media (max-width: 767px) {
    order: 3;
    width: 100%;
    
    ${props => props.isSticky && `
      transform: scale(1);
      margin: 0;
      flex: 1;
      
      textarea {
        width: 100%;
        box-sizing: border-box;
      }
      
      button {
        width: 100%;
        max-width: none;
      }
    `}
  }
  
  @media (min-width: 768px) and (max-width: 900px) {
    ${props => props.isSticky && `
      transform: scale(0.95);
      order: 2;
      flex: 1;
      margin: 0;
    `}
  }
`

const ActionsContainer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  
  @media (max-width: 800px) {
    transition: all 0.2s ease;
  }
  
  ${props => props.isSticky && `
    order: 3;
    align-self: center;
    * {
      color: white !important;
    }
  `}
  
  ${props => !props.isSticky && `
    order: 2;
    align-self: center;
  `}
  
  @media (max-width: 767px) {
    order: 2;
    align-self: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: ${props => props.theme.spacing.xs};
  }
  
  @media (min-width: 768px) and (max-width: 900px) {
    ${props => props.isSticky && `
      order: 3;
      align-self: center;
    `}
  }
`

const StickyHeader = ({ children, actions, forceSticky = false }) => {
  const { isScrolled } = useScrollSpy(60)
  const [hasBeenSticky, setHasBeenSticky] = useState(false)
  
  // Once sticky due to scroll, stay sticky if search is active
  const shouldBeSticky = isScrolled || (hasBeenSticky && forceSticky)
  
  useEffect(() => {
    if (isScrolled) {
      setHasBeenSticky(true)
    } else if (!forceSticky) {
      setHasBeenSticky(false)
    }
  }, [isScrolled, forceSticky])
  const contentRef = useRef(null)
  const placeholderRef = useRef(null)
  const theme = useTheme()

  useEffect(() => {
    if (contentRef.current && placeholderRef.current) {
      const height = contentRef.current.offsetHeight
      if (shouldBeSticky) {
        placeholderRef.current.style.height = `${height}px`
      } else {
        placeholderRef.current.style.height = '0px'
      }
    }
  }, [shouldBeSticky])

  return (
    <StickyContainer>
      <StickyPlaceholder ref={placeholderRef} />
      <StickyContent ref={contentRef} isSticky={shouldBeSticky} theme={{...theme, isDark: theme.colors.background === '#1E1E1E'}}>
<CompactHeader isSticky={shouldBeSticky}>
          <CompactTitle isSticky={shouldBeSticky}>Todo List</CompactTitle>
          <ActionsContainer isSticky={shouldBeSticky}>
            {actions}
          </ActionsContainer>
          <FormContainer isSticky={shouldBeSticky}>
            {children}
          </FormContainer>
        </CompactHeader>
      </StickyContent>
    </StickyContainer>
  )
}

export default StickyHeader