import styled, { createGlobalStyle } from 'styled-components'

// Microsoft Copilot Design System
const lightTheme = {
  colors: {
    primary: '#0078D4',
    primaryHover: '#106EBE',
    success: '#107C10',
    error: '#D13438',
    warning: '#F7630C',
    background: '#FFFFFF',
    surface: '#F3F2F1',
    card: '#FFFFFF',
    text: {
      primary: '#323130',
      secondary: '#605E5C',
      tertiary: '#8A8886'
    },
    border: '#E1DFDD',
    borderFocus: '#0078D4'
  },
  typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px (body)
      base: '1rem',     // 16px (headings)
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '2rem',    // 32px (title)
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px  (base unit)
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  }
}

const darkTheme = {
  colors: {
    primary: '#4FC3F7',
    primaryHover: '#29B6F6',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    background: '#1E1E1E',
    surface: '#2D2D30',
    card: '#252526',
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      tertiary: '#969696'
    },
    border: '#3F3F46',
    borderFocus: '#4FC3F7'
  },
  typography: lightTheme.typography,
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius
}

export const getTheme = (isDark) => isDark ? darkTheme : lightTheme

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: ${props => props.theme.typography.fontFamily};
    font-size: ${props => props.theme.typography.fontSize.sm};
    font-weight: ${props => props.theme.typography.fontWeight.normal};
    line-height: ${props => props.theme.typography.lineHeight.normal};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  #root {
    min-height: 100vh;
  }
`

export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  min-height: 100vh;
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.xl};
  }
  
  @media (min-width: 1024px) {
    padding: ${props => props.theme.spacing['2xl']};
  }
`

export const ContentArea = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  
  /* Add conditional padding to prevent content from being obscured by sticky header */
  padding-top: ${props => props.headerIsSticky ? props.theme.spacing.xl : '0'};
  transition: padding-top 0.3s ease;
  
  @media (min-width: 768px) {
    margin-top: ${props => props.theme.spacing.xl};
    /* Desktop sticky header is much shorter */
    padding-top: ${props => props.headerIsSticky ? props.theme.spacing.lg : '0'};
  }
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.md} 0;
  
  @media (min-width: 768px) {
    margin-bottom: ${props => props.theme.spacing['2xl']};
  }
`

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`

export const TodoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryHover} 100%);
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  
  @media (min-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
`

export const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  line-height: ${props => props.theme.typography.lineHeight.tight};
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize['2xl']};
  }
`

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`

export const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.theme.colors.text.secondary};
  
  &:hover {
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text.primary};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  @media (min-width: 768px) {
    width: 36px;
    height: 36px;
  }
`

export const Form = styled.form`
  display: flex;
  flex-direction: row;
  gap: ${props => props.theme.spacing.md};
  align-items: flex-start;
  
  @media (min-width: 768px) {
    gap: ${props => props.theme.spacing.lg};
  }
`

export const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  flex: 1;
  position: relative;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.lg};
  }
`

export const InputContainer = styled.div`
  position: relative;
  flex: 1;
`

export const FloatingLabel = styled.label`
  position: absolute;
  left: ${props => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  pointer-events: none;
  transition: all 0.2s ease;
  background: ${props => props.theme.colors.card};
  padding: 0 ${props => props.theme.spacing.xs};
  
  ${props => props.isActive && `
    top: -8px;
    transform: translateY(0);
    font-size: ${props => props.theme.typography.fontSize.xs};
    color: ${props => props.theme.colors.primary};
    font-weight: ${props => props.theme.typography.fontWeight.medium};
  `}
`

export const SearchIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.md} 0;
  background: linear-gradient(145deg, ${props => props.theme.colors.surface} 0%, ${props => props.theme.colors.card} 100%);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

export const Select = styled.select`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  background-color: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.borderFocus};
  }
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSize.base};
    min-width: 150px;
  }
`

export const EditRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  
  @media (min-width: 768px) {
    gap: ${props => props.theme.spacing.md};
  }
`

export const EditSelect = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  background-color: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text.primary};
  min-width: 140px;
  flex-shrink: 0;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primaryHover};
  }
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
    min-width: 160px;
  }
`

export const Input = styled.input`
  flex: 1;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  background-color: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.borderFocus};
  }
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

export const Textarea = styled.textarea`
  width: 100%;
  flex: 1;
  padding: 1rem ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.tight};
  resize: none;
  min-height: 3rem;
  
  @media (max-width: 767px) {
    min-height: 4.5rem; /* Taller on mobile to accommodate multi-line placeholder */
  }
  
  @media (min-width: 768px) {
    min-height: 3rem; /* Keep original height on desktop */
  }
  overflow: hidden;
  background-color: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.borderFocus};
    box-shadow: 0 2px 8px rgba(0, 120, 212, 0.15);
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.secondary};
  }
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

export const Button = styled.button`
  background: none;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  height: 3rem;
  color: ${props => props.theme.colors.text.primary};
  flex-shrink: 0;
  transition: all 0.2s ease;
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    opacity: 0.7;
    background: ${props => props.theme.colors.surface};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (min-width: 768px) {
    padding: 1rem;
    font-size: 1.2rem;
    min-width: 3rem;
    height: 3rem;
  }
`

export const TodoList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  
  @media (min-width: 768px) {
    gap: ${props => props.theme.spacing.md};
  }
`

export const SwipeContainer = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
`

export const SwipeContent = styled.div.attrs(props => ({
  style: {
    transform: `translateX(${props.offset}px)`,
    transition: props.isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none'
  }
}))`
  position: relative;
  z-index: 2;
  will-change: transform;
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
  background: linear-gradient(145deg, ${props => props.theme.colors.card} 0%, ${props => props.theme.colors.surface} 100%);
  cursor: ${props => props.draggable ? 'grab' : 'default'};
  
  &:active {
    cursor: ${props => props.draggable ? 'grabbing' : 'default'};
  }
  
  @media (max-width: 767px) {
    gap: ${props => props.theme.spacing.sm};
  }
  
  @media (min-width: 768px) {
    gap: ${props => props.theme.spacing.md};
  }
`

export const SwipeAction = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: white;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${props => props.direction === 'right' && `
    left: 0;
    background: linear-gradient(90deg, 
      ${props.actionType === 'undo' 
        ? props.theme.colors.warning 
        : props.theme.colors.success} 0%, 
      ${props.actionType === 'undo' 
        ? props.theme.colors.warning + 'dd'
        : props.theme.colors.success + 'dd'} 100%);
  `}
  
  ${props => props.direction === 'left' && `
    right: 0;
    background: linear-gradient(270deg, 
      ${props.actionType === 'edit' 
        ? props.theme.colors.primary 
        : props.actionType === 'delete' 
        ? props.theme.colors.error 
        : props.theme.colors.error} 0%, 
      ${props.actionType === 'edit' 
        ? props.theme.colors.primary + 'dd'
        : props.actionType === 'delete' 
        ? props.theme.colors.error + 'dd'
        : props.theme.colors.error + 'dd'} 100%);
  `}
  
  ${props => props.revealed && `
    opacity: 1;
    
    svg {
      animation: swipeReveal 0.2s ease-out;
    }
  `}
  
  @keyframes swipeReveal {
    0% { 
      transform: scale(0.5);
      opacity: 0;
    }
    100% { 
      transform: scale(1);
      opacity: 1;
    }
  }
`

export const TodoItem = styled.li`
  background: ${props => props.theme.colors.card};
  background: linear-gradient(145deg, ${props => props.theme.colors.card} 0%, ${props => props.theme.colors.surface} 100%);
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 4px solid ${props => props.priorityColor || props.theme.colors.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  cursor: default;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: ${props => props.isDragging ? 'rotate(2deg)' : 'none'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  
  &:hover {
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
    border-color: ${props => props.priorityColor || props.theme.colors.primary};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.showDropIndicator ? props.theme.colors.primary : 'transparent'};
    transition: background-color 0.2s;
    border-radius: ${props => props.theme.borderRadius.sm};
  }
  
  &.drag-over-invalid {
    background: ${props => props.theme.colors.surface};
    border-color: ${props => props.theme.colors.error};
    cursor: not-allowed;
    box-shadow: 0 0 0 2px rgba(209, 52, 56, 0.2);
  }
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.lg};
    font-size: ${props => props.theme.typography.fontSize.base};
    gap: ${props => props.theme.spacing.lg};
  }
`

export const TodoNumber = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  font-size: ${props => props.theme.typography.fontSize.xs};
  min-width: ${props => props.theme.spacing.lg};
  padding-top: ${props => props.theme.spacing.xs};
  text-align: center;
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.sm};
    min-width: ${props => props.theme.spacing.xl};
  }
`

export const TodoLeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: ${props => props.theme.spacing.lg};
  
  @media (min-width: 768px) {
    min-width: ${props => props.theme.spacing.xl};
  }
`

export const TodoContent = styled.div`
  flex: 1;
`

export const TodoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
`

export const TodoTimestamp = styled.span`
  color: ${props => {
    switch(props.highlightLevel) {
      case 'urgent':
        return props.theme.colors.error;
      case 'warning':
        return props.theme.colors.warning;
      default:
        return props.theme.colors.text.secondary;
    }
  }};
  
  ${props => props.highlightLevel === 'urgent' && `
    background-color: ${props.theme.colors.error}20;
    padding: 2px 6px;
    border-radius: ${props.theme.borderRadius.sm};
    font-weight: ${props.theme.typography.fontWeight.medium};
    animation: pulse 2s ease-in-out infinite;
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `}
  
  ${props => props.highlightLevel === 'warning' && `
    background-color: ${props.theme.colors.warning}15;
    padding: 1px 4px;
    border-radius: ${props.theme.borderRadius.sm};
    font-weight: ${props.theme.typography.fontWeight.medium};
  `}
  
  transition: all 0.2s ease;
`

export const PriorityIndicator = styled.div`
  background: linear-gradient(135deg, ${props => props.priorityColor || props.theme.colors.primary} 0%, ${props => props.priorityColor || props.theme.colors.primaryHover} 100%);
  color: white;
  font-family: ${props => props.theme.typography.fontFamily};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-top: ${props => props.theme.spacing.xs};
  text-align: center;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  min-width: 20px;
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.xs};
    min-width: 24px;
  }
`

export const TodoText = styled.div`
  margin-bottom: ${props => props.hasTags ? props.theme.spacing.sm : '0'};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  color: ${props => props.completed ? props.theme.colors.text.secondary : props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  white-space: pre-wrap;
  word-wrap: break-word;
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

export const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`

export const Tag = styled.span`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryHover} 100%);
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  box-shadow: 
    0 1px 3px rgba(0, 120, 212, 0.3),
    0 1px 2px rgba(0, 120, 212, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 2px 6px rgba(0, 120, 212, 0.4),
      0 1px 3px rgba(0, 120, 212, 0.3);
  }
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.sm};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  }
`

export const TagDeleteButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.8;
  }
`

// Base icon button component with variants
export const BaseIconButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  color: ${props => props.theme.colors.text.primary};
  flex-shrink: ${props => props.variant === 'complete' ? '0' : 'initial'};
  
  &:hover {
    opacity: 0.7;
  }
  
  @media (min-width: 768px) {
    padding: 0.625rem;
    font-size: 1.2rem;
    min-width: 3rem;
    height: 3rem;
  }
`

// Variant aliases for backward compatibility
export const CompleteButton = styled(BaseIconButton)``

export const EditInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  background-color: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primaryHover};
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`

export const EditTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  min-height: auto;
  overflow: hidden;
  line-height: 1.25;
  background-color: ${props => props.theme.colors.card};
  color: ${props => props.theme.colors.text.primary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primaryHover};
  }
  
  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`

export const TodoActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: ${props => props.theme.spacing.xs};
`

export const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-shrink: 0;
`

export const EditButton = styled(BaseIconButton)``
export const CancelButton = styled(BaseIconButton)``
export const DeleteButton = styled(BaseIconButton)``