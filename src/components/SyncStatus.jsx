import { useState } from 'react'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import SyncStatusIndicator from './SyncStatusIndicator'
import { authLogger } from '../utils/logger'
import UserAvatar from './UserAvatar'
import { SignInIcon, SignOutIcon } from './Icons'

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`


const AuthButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  padding: 0.5rem;
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  min-width: 2.5rem;
  height: 2.5rem;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`


const SyncStatus = ({ 
  syncStatus, 
  isOnline,
  queueStatus,
  conflictInfo
}) => {
  const { isAuthenticated, user, login, logout, profilePhoto, isLoadingPhoto } = useAuth()

  const handleAuthToggle = async () => {
    try {
      if (isAuthenticated) {
        await logout()
      } else {
        await login()
      }
    } catch (error) {
      authLogger.error('Auth toggle failed', { error: error.message })
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
          
          <UserAvatar 
            user={user}
            profilePhoto={profilePhoto}
            isLoadingPhoto={isLoadingPhoto}
          />
          
          <AuthButton onClick={handleAuthToggle}>
            <SignOutIcon />
            Sign Out
          </AuthButton>
        </>
      ) : (
        <AuthButton onClick={handleAuthToggle}>
          <SignInIcon />
          Sign In to Enable Sync
        </AuthButton>
      )}
    </StatusContainer>
  )
}

export default SyncStatus