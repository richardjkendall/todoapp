import { useState } from 'react'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import SyncStatusIndicator from './SyncStatusIndicator'

const SettingsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
`

const StorageOption = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.card};
  }
`

const RadioInput = styled.input`
  margin: 0;
  cursor: pointer;
`

const StorageLabel = styled.label`
  cursor: pointer;
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => {
    switch (props.status) {
      case 'synced': return props.theme.colors.success
      case 'syncing': return props.theme.colors.warning
      case 'error': return props.theme.colors.error
      default: return props.theme.colors.text.secondary
    }
  }};
`

const MigrateButton = styled.button`
  background: ${props => props.theme.colors.primary};
  border: none;
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryHover};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorText = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-left: ${props => props.theme.spacing.sm};
`

const HealthIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => {
    if (props.score >= 80) return props.theme.colors.success
    if (props.score >= 60) return props.theme.colors.warning
    return props.theme.colors.error
  }};
  margin-left: ${props => props.theme.spacing.sm};
`

const HealthBar = styled.div`
  width: 40px;
  height: 4px;
  background: ${props => props.theme.colors.border};
  border-radius: 2px;
  overflow: hidden;
`

const HealthFill = styled.div`
  width: ${props => props.score}%;
  height: 100%;
  background: ${props => {
    if (props.score >= 80) return props.theme.colors.success
    if (props.score >= 60) return props.theme.colors.warning  
    return props.theme.colors.error
  }};
  transition: all 0.3s ease;
`

const StorageSettings = ({ 
  todos, 
  onMigrate, 
  storageType, 
  syncStatus, 
  switchStorageType,
  isOneDriveMode,
  conflictInfo,
  isOnline,
  queueStatus,
  syncHealthScore,
  STORAGE_TYPES 
}) => {
  const { isAuthenticated } = useAuth()
  const [isMigrating, setIsMigrating] = useState(false)

  const handleStorageChange = (type) => {
    switchStorageType(type)
  }

  const handleMigrate = async () => {
    if (!todos || todos.length === 0) {
      alert('No todos to migrate')
      return
    }

    if (window.confirm(`Migrate ${todos.length} todos from localStorage to OneDrive?`)) {
      try {
        setIsMigrating(true)
        const migratedTodos = await onMigrate(todos)
        alert(`Successfully migrated ${migratedTodos.length} todos to OneDrive!`)
      } catch (err) {
        alert(`Migration failed: ${err.message}`)
      } finally {
        setIsMigrating(false)
      }
    }
  }

  const showMigrateButton = isAuthenticated && 
    storageType === STORAGE_TYPES.LOCAL && 
    todos && 
    todos.length > 0

  return (
    <SettingsContainer>
      <span>Storage:</span>
      
      <StorageOption>
        <RadioInput
          type="radio"
          name="storage"
          checked={storageType === STORAGE_TYPES.LOCAL}
          onChange={() => handleStorageChange(STORAGE_TYPES.LOCAL)}
        />
        <StorageLabel>Local Only</StorageLabel>
      </StorageOption>

      <StorageOption>
        <RadioInput
          type="radio"
          name="storage"
          checked={storageType === STORAGE_TYPES.ONEDRIVE}
          onChange={() => handleStorageChange(STORAGE_TYPES.ONEDRIVE)}
          disabled={!isAuthenticated}
        />
        <StorageLabel>
          Local + OneDrive Sync {!isAuthenticated && '(Sign in required)'}
        </StorageLabel>
        {isAuthenticated && isOneDriveMode && (
          <HealthIndicator score={syncHealthScore}>
            <HealthBar>
              <HealthFill score={syncHealthScore} />
            </HealthBar>
            <span>{syncHealthScore}%</span>
          </HealthIndicator>
        )}
      </StorageOption>

      <SyncStatusIndicator
        syncStatus={syncStatus}
        isOnline={isOnline}
        queueStatus={queueStatus}
        conflictInfo={conflictInfo}
        isOneDriveMode={isOneDriveMode}
      />

      {showMigrateButton && (
        <MigrateButton
          onClick={handleMigrate}
          disabled={isMigrating}
        >
          {isMigrating ? 'Migrating...' : 'Migrate to OneDrive'}
        </MigrateButton>
      )}
    </SettingsContainer>
  )
}

export default StorageSettings