import { useEffect, useRef } from 'react'
import styled, { useTheme } from 'styled-components'
import useScrollSpy from '../hooks/useScrollSpy'

const StickyContainer = styled.div`
  position: relative;
`

const StickyContent = styled.div`
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 100;
  
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
    
    @media (min-width: 768px) {
      padding: ${props.theme.spacing.sm} ${props.theme.spacing.xl};
    }
    
    @media (min-width: 1024px) {
      padding: ${props.theme.spacing.sm} max(${props.theme.spacing['2xl']}, calc((100vw - 1200px) / 2 + ${props.theme.spacing['2xl']}));
    }
  `}
  
  ${props => !props.isSticky && `
    padding: 0;
    background: transparent;
  `}
`

const StickyPlaceholder = styled.div`
  height: ${props => props.height}px;
  transition: height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`

const CompactHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  min-height: fit-content;
  
  ${props => !props.isSticky && `
    justify-content: space-between;
  `}
  
  ${props => props.isSticky && `
    gap: ${props.theme.spacing.lg};
  `}
`

const CompactTitle = styled.h1`
  color: white;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize['2xl']};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  flex-shrink: 0;
  
  ${props => !props.isSticky && `
    color: ${props.theme.colors.text.primary};
    
    @media (min-width: 768px) {
      font-size: ${props.theme.typography.fontSize['3xl']};
    }
  `}
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize['2xl']};
  }
`

const FormContainer = styled.div`
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  
  ${props => props.isSticky && `
    transform: scale(0.98);
    
    button {
      color: white !important;
    }
    
    input, textarea {
      color: white !important;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.7) !important;
      }
    }
  `}
  
  ${props => !props.isSticky && `
    transform: scale(1);
    margin-bottom: ${props.theme.spacing.xl};
    
    @media (min-width: 768px) {
      margin-bottom: ${props.theme.spacing['2xl']};
    }
  `}
`

const ActionsContainer = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  
  ${props => props.isSticky && `
    * {
      color: white !important;
    }
  `}
`

const StickyHeader = ({ children, actions }) => {
  const { isScrolled } = useScrollSpy(60)
  const contentRef = useRef(null)
  const placeholderRef = useRef(null)
  const theme = useTheme()

  useEffect(() => {
    if (contentRef.current && placeholderRef.current) {
      const height = contentRef.current.offsetHeight
      if (isScrolled) {
        placeholderRef.current.style.height = `${height}px`
      } else {
        placeholderRef.current.style.height = '0px'
      }
    }
  }, [isScrolled])

  return (
    <StickyContainer>
      <StickyPlaceholder ref={placeholderRef} />
      <StickyContent ref={contentRef} isSticky={isScrolled} theme={{...theme, isDark: theme.colors.background === '#1E1E1E'}}>
        {isScrolled ? (
          <CompactHeader isSticky={isScrolled}>
            <CompactTitle isSticky={isScrolled}>Todo List</CompactTitle>
            <FormContainer isSticky={isScrolled}>
              {children}
            </FormContainer>
            <ActionsContainer isSticky={isScrolled}>
              {actions}
            </ActionsContainer>
          </CompactHeader>
        ) : (
          <>
            <CompactHeader isSticky={isScrolled}>
              <CompactTitle isSticky={isScrolled}>Todo List</CompactTitle>
              <ActionsContainer isSticky={isScrolled}>
                {actions}
              </ActionsContainer>
            </CompactHeader>
            <FormContainer isSticky={isScrolled}>
              {children}
            </FormContainer>
          </>
        )}
      </StickyContent>
    </StickyContainer>
  )
}

export default StickyHeader