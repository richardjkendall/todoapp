import { useState } from 'react'
import styled from 'styled-components'
import { ShareIcon } from './Icons'
import { validateTodoForSharing } from '../utils/todoSharing'
import { BaseIconButton } from '../styles/TodoStyles'
import ShareModal from './ShareModal'

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

  const handleShare = () => {
    // Validate todo can be shared
    const validation = validateTodoForSharing(todo)
    if (!validation.valid) {
      setError(validation.error)
      setTimeout(() => setError(''), 3000)
      return
    }

    setShowModal(true)
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