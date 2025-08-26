import { useState } from 'react'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import SyncStatusIndicator from './SyncStatusIndicator'

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`


const AuthButton = styled.button`
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

const SyncStatus = ({ 
  syncStatus, 
  isOnline,
  queueStatus,
  syncHealthScore,
  conflictInfo
}) => {
  const { isAuthenticated, login, logout } = useAuth()

  const handleAuthToggle = async () => {
    try {
      if (isAuthenticated) {
        await logout()
      } else {
        await login()
      }
    } catch (error) {
      console.error('Auth toggle failed:', error)
    }
  }

  return (
    <StatusContainer>      
      {isAuthenticated ? (
        <>
          <SyncStatusIndicator
            syncStatus={syncStatus}
            isOnline={isOnline}
            queueStatus={queueStatus}
            conflictInfo={conflictInfo}
            isOneDriveMode={true}
          />
          
          <HealthIndicator score={syncHealthScore}>
            <HealthBar>
              <HealthFill score={syncHealthScore} />
            </HealthBar>
            <span>{syncHealthScore}%</span>
          </HealthIndicator>
          
          <AuthButton onClick={handleAuthToggle}>
            Sign Out
          </AuthButton>
        </>
      ) : (
        <AuthButton onClick={handleAuthToggle}>
          Sign In to Enable Sync
        </AuthButton>
      )}
    </StatusContainer>
  )
}

export default SyncStatus