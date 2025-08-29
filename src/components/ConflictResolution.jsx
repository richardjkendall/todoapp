import { useState, useEffect } from 'react'
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
  
  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.md};
    max-height: 90vh;
    margin: ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.md};
  }
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
  
  @media (max-width: 767px) {
    font-size: ${props => props.theme.typography.fontSize.lg};
    text-align: center;
  }
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
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.md};
    margin-bottom: ${props => props.theme.spacing.md};
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
  
  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.sm};
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
  
  @media (max-width: 767px) {
    max-height: 120px;
    padding: ${props => props.theme.spacing.xs};
  }
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
  
  @media (max-width: 767px) {
    margin-bottom: ${props => props.theme.spacing.md};
  }
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
  
  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    align-items: flex-start;
    gap: ${props => props.theme.spacing.xs};
  }
`

const RadioInput = styled.input`
  margin: 0;
  cursor: pointer;
  flex-shrink: 0;
  
  @media (max-width: 767px) {
    margin-top: 2px;
  }
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
  
  @media (max-width: 767px) {
    justify-content: stretch;
    gap: ${props => props.theme.spacing.sm};
  }
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
  
  @media (max-width: 767px) {
    flex: 1;
    padding: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSize.md};
    min-height: 44px; /* Touch-friendly minimum */
  }
`

const FieldConflictsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`

const FieldConflictItem = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.surface};
`

const FieldConflictHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.xs};
  }
`

const TodoTitle = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
`

const ConflictBadge = styled.div`
  background: ${props => props.theme.colors.warning};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`

const FieldComparison = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.sm};
  }
`

const FieldVersion = styled.div`
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.card};
`

const FieldLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.xs};
  text-transform: capitalize;
`

const FieldValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.primary};
  word-break: break-word;
  
  ${props => props.field === 'completed' && `
    color: ${props.value ? props.theme.colors.success : props.theme.colors.text.secondary};
    font-weight: ${props.theme.typography.fontWeight.medium};
  `}
  
  ${props => props.field === 'tags' && `
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  `}
  
  ${props => props.field === 'priority' && `
    font-weight: ${props.theme.typography.fontWeight.medium};
    color: ${props.theme.colors.warning};
  `}
  
  ${props => props.field === 'order' && `
    font-weight: ${props.theme.typography.fontWeight.medium};
    color: ${props.theme.colors.text.secondary};
  `}
`

const TagChip = styled.span`
  background: ${props => props.theme.colors.primary}20;
  color: ${props => props.theme.colors.primary};
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
`

const FieldResolutionOptions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
  
  @media (max-width: 767px) {
    flex-direction: column;
  }
`

const FieldResolutionButton = styled.button`
  flex: 1;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.selected ? props.theme.colors.primary + '20' : props.theme.colors.card};
  color: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.text.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.xs};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primary}10;
  }
`

const ConflictResolution = ({ conflictInfo, onResolve, isLoading }) => {
  const [selectedResolution, setSelectedResolution] = useState('merge')
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [fieldResolutions, setFieldResolutions] = useState({})

  if (!conflictInfo) return null

  const { local, remote, localModified, remoteModified, conflicts, type } = conflictInfo
  const isFieldBased = type === 'field-based' && conflicts && conflicts.length > 0
  
  // Check if mobile view
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767

  // Initialize field resolutions for field-based conflicts
  useEffect(() => {
    if (isFieldBased) {
      const initialResolutions = {}
      conflicts.forEach(conflict => {
        const key = `${conflict.id}`
        conflict.conflictingFields.forEach(field => {
          const fieldKey = `${key}-${field.field}`
          // Default to merge for tags and order, timestamp-based for others
          if (field.field === 'tags' || field.field === 'order') {
            initialResolutions[fieldKey] = 'merge'
          } else {
            const localTime = conflict.local.lastModified || conflict.local.timestamp || 0
            const remoteTime = conflict.remote.lastModified || conflict.remote.timestamp || 0
            initialResolutions[fieldKey] = localTime > remoteTime ? 'local' : 'remote'
          }
        })
      })
      setFieldResolutions(initialResolutions)
    }
  }, [isFieldBased, conflicts])

  const renderFieldValue = (field, value) => {
    switch (field) {
      case 'completed':
        return (
          <FieldValue field={field} value={value}>
            {value ? '✓ Completed' : '○ Not completed'}
          </FieldValue>
        )
      case 'tags':
        return (
          <FieldValue field={field}>
            {(value || []).map(tag => (
              <TagChip key={tag}>{tag}</TagChip>
            ))}
            {(!value || value.length === 0) && (
              <span style={{ color: '#999', fontSize: '12px' }}>No tags</span>
            )}
          </FieldValue>
        )
      case 'priority':
        return (
          <FieldValue field={field}>
            !{value || 3}
          </FieldValue>
        )
      case 'order':
        return (
          <FieldValue field={field}>
            Position: {value || 0}
          </FieldValue>
        )
      case 'text':
        return (
          <FieldValue field={field}>
            {value || 'Empty'}
          </FieldValue>
        )
      default:
        return (
          <FieldValue field={field}>
            {String(value || 'Not set')}
          </FieldValue>
        )
    }
  }

  const setFieldResolution = (todoId, field, resolution) => {
    const key = `${todoId}-${field}`
    setFieldResolutions(prev => ({
      ...prev,
      [key]: resolution
    }))
  }

  const getFieldResolution = (todoId, field) => {
    const key = `${todoId}-${field}`
    return fieldResolutions[key] || 'local'
  }

  const handleResolve = () => {
    if (isFieldBased) {
      // Handle field-based resolution
      const resolvedTodos = conflicts.map(conflict => {
        const resolvedTodo = { ...conflict.local }
        
        conflict.conflictingFields.forEach(fieldConflict => {
          const resolution = getFieldResolution(conflict.id, fieldConflict.field)
          const field = fieldConflict.field
          
          switch (resolution) {
            case 'local':
              resolvedTodo[field] = fieldConflict.localValue
              break
            case 'remote':
              resolvedTodo[field] = fieldConflict.remoteValue
              break
            case 'merge':
              if (field === 'tags') {
                // Merge tags from both versions
                const localTags = fieldConflict.localValue || []
                const remoteTags = fieldConflict.remoteValue || []
                const allTags = [...localTags, ...remoteTags]
                resolvedTodo[field] = [...new Set(allTags)] // Remove duplicates
              } else if (field === 'order') {
                // For order conflicts, use the average of both values
                const localOrder = fieldConflict.localValue || 0
                const remoteOrder = fieldConflict.remoteValue || 0
                resolvedTodo[field] = Math.floor((localOrder + remoteOrder) / 2)
              } else {
                // For other fields, fall back to timestamp-based resolution
                const localTime = conflict.local.lastModified || conflict.local.timestamp || 0
                const remoteTime = conflict.remote.lastModified || conflict.remote.timestamp || 0
                resolvedTodo[field] = localTime > remoteTime ? fieldConflict.localValue : fieldConflict.remoteValue
              }
              break
          }
        })
        
        // Update last modified time
        resolvedTodo.lastModified = Date.now()
        return resolvedTodo
      })
      
      onResolve('field-based', resolvedTodos)
    } else {
      // Handle legacy whole-todo resolution
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
  }

  return (
    <ConflictModal>
      <ConflictContent>
        <ConflictHeader>
          <ConflictTitle>
            {isFieldBased ? 'Field Conflicts Detected' : 'Sync Conflict'}
          </ConflictTitle>
          <ConflictDescription>
            {isFieldBased 
              ? `${conflicts.length} todo${conflicts.length > 1 ? 's have' : ' has'} conflicting changes. Choose how to resolve each field.`
              : isMobile 
                ? 'Choose which version to keep:'
                : 'Your todos were modified in OneDrive by another device or session. Please choose how to resolve this conflict.'
            }
          </ConflictDescription>
        </ConflictHeader>

        {isFieldBased ? (
          <FieldConflictsList>
            {conflicts.map(conflict => (
              <FieldConflictItem key={conflict.id}>
                <FieldConflictHeader>
                  <TodoTitle>
                    {conflict.local.text || conflict.remote.text || `Todo #${conflict.id}`}
                  </TodoTitle>
                  <ConflictBadge>
                    {conflict.conflictingFields.length} field{conflict.conflictingFields.length > 1 ? 's' : ''} conflict
                  </ConflictBadge>
                </FieldConflictHeader>
                
                {conflict.conflictingFields.map(fieldConflict => (
                  <div key={fieldConflict.field}>
                    <FieldComparison>
                      <FieldVersion>
                        <FieldLabel>Local ({fieldConflict.field})</FieldLabel>
                        {renderFieldValue(fieldConflict.field, fieldConflict.localValue)}
                      </FieldVersion>
                      
                      <FieldVersion>
                        <FieldLabel>OneDrive ({fieldConflict.field})</FieldLabel>
                        {renderFieldValue(fieldConflict.field, fieldConflict.remoteValue)}
                      </FieldVersion>
                    </FieldComparison>
                    
                    <FieldResolutionOptions>
                      <FieldResolutionButton
                        selected={getFieldResolution(conflict.id, fieldConflict.field) === 'local'}
                        onClick={() => setFieldResolution(conflict.id, fieldConflict.field, 'local')}
                      >
                        Use Local
                      </FieldResolutionButton>
                      
                      <FieldResolutionButton
                        selected={getFieldResolution(conflict.id, fieldConflict.field) === 'remote'}
                        onClick={() => setFieldResolution(conflict.id, fieldConflict.field, 'remote')}
                      >
                        Use OneDrive
                      </FieldResolutionButton>
                      
                      {(fieldConflict.field === 'tags' || fieldConflict.field === 'order') && (
                        <FieldResolutionButton
                          selected={getFieldResolution(conflict.id, fieldConflict.field) === 'merge'}
                          onClick={() => setFieldResolution(conflict.id, fieldConflict.field, 'merge')}
                        >
                          {fieldConflict.field === 'tags' ? 'Merge Both' : 'Keep Both Orders'}
                        </FieldResolutionButton>
                      )}
                    </FieldResolutionOptions>
                  </div>
                ))}
              </FieldConflictItem>
            ))}
          </FieldConflictsList>
        ) : (
          <>
            <VersionComparison>
              <VersionPanel 
                selected={selectedVersion === 'local'}
                onClick={() => setSelectedVersion('local')}
              >
                <VersionTitle>{isMobile ? 'Local' : 'Your Local Version'}</VersionTitle>
                <VersionInfo>
                  {local.length} todos • Modified {localModified ? new Date(localModified).toLocaleString() : 'recently'}
                </VersionInfo>
                {!isMobile && (
                  <TodoList>
                    {local.slice(0, 10).map((todo, index) => (
                      <TodoItem key={todo.id || index} completed={todo.completed}>
                        {todo.text}
                      </TodoItem>
                    ))}
                    {local.length > 10 && <TodoItem>... and {local.length - 10} more</TodoItem>}
                  </TodoList>
                )}
              </VersionPanel>

              <VersionPanel 
                selected={selectedVersion === 'remote'}
                onClick={() => setSelectedVersion('remote')}
              >
                <VersionTitle>{isMobile ? 'OneDrive' : 'OneDrive Version'}</VersionTitle>
                <VersionInfo>
                  {remote.length} todos • Modified {remoteModified ? new Date(remoteModified).toLocaleString() : 'recently'}
                </VersionInfo>
                {!isMobile && (
                  <TodoList>
                    {remote.slice(0, 10).map((todo, index) => (
                      <TodoItem key={todo.id || index} completed={todo.completed}>
                        {todo.text}
                      </TodoItem>
                    ))}
                    {remote.length > 10 && <TodoItem>... and {remote.length - 10} more</TodoItem>}
                  </TodoList>
                )}
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
                  <OptionTitle>Smart Merge {isMobile ? '' : '(Recommended)'}</OptionTitle>
                  <OptionDescription>
                    {isMobile ? 'Combine both versions' : 'Combine both versions, keeping your local changes for any conflicts'}
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
                  <OptionTitle>{isMobile ? 'Use Local' : 'Use Local Version'}</OptionTitle>
                  <OptionDescription>
                    {isMobile ? 'Keep your current todos' : 'Replace OneDrive with your current local todos'}
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
                  <OptionTitle>{isMobile ? 'Use OneDrive' : 'Use OneDrive Version'}</OptionTitle>
                  <OptionDescription>
                    {isMobile ? 'Use the cloud version' : 'Replace your local todos with the OneDrive version'}
                  </OptionDescription>
                </OptionText>
              </ResolutionOption>
            </ResolutionOptions>
          </>
        )}

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