import { useState } from 'react'
import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import UserAvatar from './UserAvatar'
import { authLogger } from '../utils/logger'

const AuthButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`

const AuthButton = styled.button`
  background: ${props => props.theme.colors.primary};
  border: none;
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primaryHover};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`

const UserName = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
`

const UserEmail = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  opacity: 0.8;
`

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-top: ${props => props.theme.spacing.xs};
`

const AuthButtonComponent = () => {
  const { isAuthenticated, user, isLoading, error, login, logout, profilePhoto, isLoadingPhoto } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setActionLoading(true)
      await login()
    } catch (error) {
      authLogger.error('Login failed', { error: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setActionLoading(true)
      await logout()
    } catch (error) {
      authLogger.error('Logout failed', { error: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AuthButtonContainer>
        <AuthButton disabled>Loading...</AuthButton>
      </AuthButtonContainer>
    )
  }

  if (isAuthenticated && user) {
    return (
      <AuthButtonContainer>
        <UserInfo>
          <UserName>{user.name || user.displayName || 'User'}</UserName>
          <UserEmail>{user.username || user.userPrincipalName}</UserEmail>
        </UserInfo>
        <UserAvatar 
          user={user}
          profilePhoto={profilePhoto}
          isLoadingPhoto={isLoadingPhoto}
        />
        <AuthButton 
          onClick={handleLogout}
          disabled={actionLoading}
        >
          {actionLoading ? 'Signing out...' : 'Sign out'}
        </AuthButton>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </AuthButtonContainer>
    )
  }

  return (
    <AuthButtonContainer>
      <AuthButton 
        onClick={handleLogin}
        disabled={actionLoading}
      >
        {actionLoading ? 'Signing in...' : 'Sign in with Microsoft'}
      </AuthButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </AuthButtonContainer>
  )
}

export default AuthButtonComponent