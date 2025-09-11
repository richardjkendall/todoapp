import styled from 'styled-components'
import { CheckIcon, CancelIcon } from './Icons'
import { getPriorityColor } from '../utils/priority'
import LinkifiedText from './LinkifiedText'

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.md};
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.lg};
    margin: ${props => props.theme.spacing.md};
  }
`

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  text-align: center;
`

const TodoPreview = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-left: 4px solid ${props => props.theme.colors.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const TodoText = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  margin-bottom: ${props => props.theme.spacing.sm};
  white-space: pre-wrap;
  word-wrap: break-word;
`

const TodoMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`

const PriorityBadge = styled.span`
  background: ${props => getPriorityColor(props.priority)};
  color: white;
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.xs};
`

const Tag = styled.span`
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
`

const ButtonContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: center;
  
  @media (max-width: 767px) {
    flex-direction: column;
  }
`

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const PrimaryButton = styled(Button)`
  background: ${props => props.theme.colors.primary};
  color: white;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryHover};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${props => props.theme.colors.text.secondary};
  border: 1px solid ${props => props.theme.colors.border};
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
  }
`

const SharedFrom = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.text.tertiary};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-bottom: ${props => props.theme.spacing.md};
`

const SharedTodoModal = ({ sharedTodo, onAccept, onDecline }) => {
  if (!sharedTodo) return null

  return (
    <ModalOverlay onClick={onDecline}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalTitle>Shared Todo Received</ModalTitle>
        
        <SharedFrom>
          {sharedTodo.metadata?.sharedBy 
            ? `${sharedTodo.metadata.sharedBy} shared a todo from ${sharedTodo.metadata?.sharedFrom || 'LongList'}` 
            : `Someone shared a todo from ${sharedTodo.metadata?.sharedFrom || 'LongList'}`
          }
        </SharedFrom>
        
        <TodoPreview>
          <TodoText><LinkifiedText>{sharedTodo.text}</LinkifiedText></TodoText>
          
          {(sharedTodo.priority || sharedTodo.tags?.length > 0) && (
            <TodoMeta>
              {sharedTodo.priority && (
                <PriorityBadge priority={sharedTodo.priority}>
                  !{sharedTodo.priority}
                </PriorityBadge>
              )}
              
              {sharedTodo.tags?.length > 0 && (
                <TagsList>
                  {sharedTodo.tags.map((tag, index) => (
                    <Tag key={index}>#{tag}</Tag>
                  ))}
                </TagsList>
              )}
            </TodoMeta>
          )}
        </TodoPreview>
        
        <ButtonContainer>
          <PrimaryButton onClick={onAccept}>
            <CheckIcon />
            Add to My List
          </PrimaryButton>
          
          <SecondaryButton onClick={onDecline}>
            <CancelIcon />
            Decline
          </SecondaryButton>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  )
}

export default SharedTodoModal