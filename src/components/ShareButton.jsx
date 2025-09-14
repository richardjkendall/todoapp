import { useState } from 'react'
import styled from 'styled-components'
import { ShareIcon } from './Icons'
import { validateTodoForSharing } from '../utils/todoSharing'
import { BaseIconButton } from '../styles/TodoStyles'
import ShareModal from './ShareModal'
import { shouldUseNativeShare } from '../utils/deviceDetection'
import { shareToDoNatively } from '../utils/nativeShare'
import { useAuth } from '../context/AuthContext'
import { shareLogger } from '../utils/logger'

const ShareButtonStyled = styled(BaseIconButton)`
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.text.primary};
  color: ${props => props.theme.colors.card};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  margin-bottom: ${props => props.theme.spacing.xs};
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: ${props => props.theme.colors.text.primary};
  }
`

const ShareButton = ({ todo, className }) => {
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const handleShare = async () => {
    // Validate todo can be shared
    const validation = validateTodoForSharing(todo)
    if (!validation.valid) {
      setError(validation.error)
      setTimeout(() => setError(''), 3000)
      return
    }

    // Use native share on touch devices if available
    if (shouldUseNativeShare()) {
      setIsSharing(true)
      try {
        // Get user name for share context if authenticated
        const shareOptions = {}
        if (isAuthenticated && user && user.name) {
          shareOptions.userName = user.name
        }
        
        const success = await shareToDoNatively(todo, shareOptions)
        if (success) {
          // Share completed successfully, no need to show modal
          return
        }
        // If share was cancelled by user, also don't show error or modal
        
      } catch (shareError) {
        // Native share failed, fall back to modal
        shareLogger.warn('Native share failed, showing modal', { error: shareError.message })
        setError(`Native share failed: ${shareError.message}`)
        setTimeout(() => setError(''), 3000)
        setShowModal(true)
      } finally {
        setIsSharing(false)
      }
    } else {
      // Desktop or no native share - show modal
      setShowModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const showTooltip = !!error

  return (
    <>
      <TooltipContainer className={className}>
        <ShareButtonStyled
          onClick={handleShare}
          disabled={isSharing}
          title="Share todo"
          aria-label="Share todo"
        >
          <ShareIcon />
        </ShareButtonStyled>
        <Tooltip show={showTooltip}>
          {error}
        </Tooltip>
      </TooltipContainer>
      
      {showModal && (
        <ShareModal
          todo={todo}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

export default ShareButton