import styled, { keyframes } from 'styled-components'

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`

const ToastContainer = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  max-width: 400px;
  
  @media (max-width: 767px) {
    display: none; /* Hide toast notifications on mobile */
  }
`

const ToastItem = styled.div`
  background: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success
      case 'error': return props.theme.colors.error
      case 'warning': return props.theme.colors.warning
      default: return props.theme.colors.primary
    }
  }};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  animation: ${slideIn} 0.3s ease-out;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateX(-2px);
  }
  
  &.removing {
    animation: ${slideOut} 0.3s ease-in forwards;
  }
`

const ToastMessage = styled.div`
  flex: 1;
  line-height: 1.4;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
`

const ToastIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`

const Toast = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) return null

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✓'
      case 'error': return '✕'
      case 'warning': return '⚠'
      default: return 'ℹ'
    }
  }

  return (
    <ToastContainer>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          type={toast.type}
          onClick={() => onRemoveToast(toast.id)}
        >
          <ToastIcon>{getIcon(toast.type)}</ToastIcon>
          <ToastMessage>{toast.message}</ToastMessage>
          <CloseButton onClick={(e) => {
            e.stopPropagation()
            onRemoveToast(toast.id)
          }}>
            ×
          </CloseButton>
        </ToastItem>
      ))}
    </ToastContainer>
  )
}

export default Toast