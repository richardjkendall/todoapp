import { useState } from 'react'
import styled from 'styled-components'

const ConflictModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: ${props => props.theme.spacing.md};
`

const ConflictContent = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid ${props => props.theme.colors.border};
`

const ConflictHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const ConflictTitle = styled.h2`
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`

const ConflictDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin: 0;
`

const VersionComparison = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const VersionPanel = styled.div`
  border: 2px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.selected ? 
    `${props.theme.colors.primary}10` : 
    props.theme.colors.surface};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`

const VersionTitle = styled.h3`
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`

const VersionInfo = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.md};
`

const TodoList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
`

const TodoItem = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  padding: ${props => props.theme.spacing.xs} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.completed && `
    text-decoration: line-through;
    opacity: 0.6;
  `}
`

const ResolutionOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const ResolutionOption = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  
  &:hover {
    background: ${props => props.theme.colors.surface};
  }
`

const RadioInput = styled.input`
  margin: 0;
  cursor: pointer;
`

const OptionText = styled.div`
  flex: 1;
`

const OptionTitle = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const OptionDescription = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
`

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
`

const ActionButton = styled.button`
  background: ${props => props.primary ? props.theme.colors.primary : props.theme.colors.surface};
  border: 1px solid ${props => props.primary ? props.theme.colors.primary : props.theme.colors.border};
  color: ${props => props.primary ? 'white' : props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.primary ? props.theme.colors.primaryHover : props.theme.colors.card};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ConflictResolution = ({ conflictInfo, onResolve, isLoading }) => {
  const [selectedResolution, setSelectedResolution] = useState('merge')
  const [selectedVersion, setSelectedVersion] = useState(null)

  if (!conflictInfo) return null

  const { local, remote, localModified, remoteModified } = conflictInfo

  const handleResolve = () => {
    let selectedTodos
    
    switch (selectedResolution) {
      case 'local':
        selectedTodos = local
        break
      case 'remote':
        selectedTodos = remote
        break
      case 'merge':
        selectedTodos = null // Will be handled in the hook
        break
      default:
        return
    }
    
    onResolve(selectedResolution, selectedTodos)
  }

  return (
    <ConflictModal>
      <ConflictContent>
        <ConflictHeader>
          <ConflictTitle>Sync Conflict Detected</ConflictTitle>
          <ConflictDescription>
            Your todos were modified in OneDrive by another device or session. 
            Please choose how to resolve this conflict.
          </ConflictDescription>
        </ConflictHeader>

        <VersionComparison>
          <VersionPanel 
            selected={selectedVersion === 'local'}
            onClick={() => setSelectedVersion('local')}
          >
            <VersionTitle>Your Local Version</VersionTitle>
            <VersionInfo>
              {local.length} todos • Modified {localModified ? new Date(localModified).toLocaleString() : 'recently'}
            </VersionInfo>
            <TodoList>
              {local.slice(0, 10).map((todo, index) => (
                <TodoItem key={todo.id || index} completed={todo.completed}>
                  {todo.text}
                </TodoItem>
              ))}
              {local.length > 10 && <TodoItem>... and {local.length - 10} more</TodoItem>}
            </TodoList>
          </VersionPanel>

          <VersionPanel 
            selected={selectedVersion === 'remote'}
            onClick={() => setSelectedVersion('remote')}
          >
            <VersionTitle>OneDrive Version</VersionTitle>
            <VersionInfo>
              {remote.length} todos • Modified {remoteModified ? new Date(remoteModified).toLocaleString() : 'recently'}
            </VersionInfo>
            <TodoList>
              {remote.slice(0, 10).map((todo, index) => (
                <TodoItem key={todo.id || index} completed={todo.completed}>
                  {todo.text}
                </TodoItem>
              ))}
              {remote.length > 10 && <TodoItem>... and {remote.length - 10} more</TodoItem>}
            </TodoList>
          </VersionPanel>
        </VersionComparison>

        <ResolutionOptions>
          <ResolutionOption>
            <RadioInput
              type="radio"
              name="resolution"
              value="merge"
              checked={selectedResolution === 'merge'}
              onChange={(e) => setSelectedResolution(e.target.value)}
            />
            <OptionText>
              <OptionTitle>Smart Merge (Recommended)</OptionTitle>
              <OptionDescription>
                Combine both versions, keeping your local changes for any conflicts
              </OptionDescription>
            </OptionText>
          </ResolutionOption>

          <ResolutionOption>
            <RadioInput
              type="radio"
              name="resolution"
              value="local"
              checked={selectedResolution === 'local'}
              onChange={(e) => setSelectedResolution(e.target.value)}
            />
            <OptionText>
              <OptionTitle>Use Local Version</OptionTitle>
              <OptionDescription>
                Replace OneDrive with your current local todos
              </OptionDescription>
            </OptionText>
          </ResolutionOption>

          <ResolutionOption>
            <RadioInput
              type="radio"
              name="resolution"
              value="remote"
              checked={selectedResolution === 'remote'}
              onChange={(e) => setSelectedResolution(e.target.value)}
            />
            <OptionText>
              <OptionTitle>Use OneDrive Version</OptionTitle>
              <OptionDescription>
                Replace your local todos with the OneDrive version
              </OptionDescription>
            </OptionText>
          </ResolutionOption>
        </ResolutionOptions>

        <ActionButtons>
          <ActionButton onClick={handleResolve} primary disabled={isLoading}>
            {isLoading ? 'Resolving...' : 'Resolve Conflict'}
          </ActionButton>
        </ActionButtons>
      </ConflictContent>
    </ConflictModal>
  )
}

export default ConflictResolution