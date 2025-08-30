import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { WarningIcon, InfoIcon, CloudIcon } from './Icons'

const WarningBanner = styled.div`
  background: ${props => props.isCompact 
    ? `linear-gradient(135deg, ${props.theme.colors.surface} 0%, ${props.theme.colors.card} 100%)`
    : `linear-gradient(135deg, ${props.theme.colors.warning}10 0%, ${props.theme.colors.warning}08 100%)`};
  border: 1px solid ${props => props.isCompact 
    ? props.theme.colors.border 
    : props.theme.colors.warning + '30'};
  border-left: ${props => props.isCompact 
    ? `3px solid ${props.theme.colors.text.tertiary}`
    : `4px solid ${props.theme.colors.warning}`};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.isCompact 
    ? props.theme.spacing.sm 
    : props.theme.spacing.md};
  margin-bottom: ${props => props.isCompact 
    ? props.theme.spacing.md 
    : props.theme.spacing.lg};
  font-family: ${props => props.theme.typography.fontFamily};
  position: relative;
  box-shadow: ${props => props.isCompact 
    ? '0 1px 3px rgba(0, 0, 0, 0.05)'
    : '0 2px 8px rgba(0, 0, 0, 0.08)'};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: ${props => props.isCompact 
      ? '0 2px 6px rgba(0, 0, 0, 0.1)'
      : '0 4px 16px rgba(0, 0, 0, 0.12)'};
  }

  @media (min-width: 768px) {
    padding: ${props => props.isCompact 
      ? props.theme.spacing.md 
      : props.theme.spacing.lg};
    margin-bottom: ${props => props.isCompact 
      ? props.theme.spacing.lg 
      : props.theme.spacing.xl};
  }
`

const WarningContent = styled.div`
  display: flex;
  align-items: ${props => props.isCompact ? 'center' : 'flex-start'};
  gap: ${props => props.isCompact ? props.theme.spacing.sm : props.theme.spacing.md};

  @media (max-width: 767px) {
    flex-direction: ${props => props.isCompact ? 'row' : 'column'};
    gap: ${props => props.theme.spacing.sm};
  }
`

const WarningIconContainer = styled.div`
  color: ${props => props.isCompact ? props.theme.colors.text.tertiary : props.theme.colors.warning};
  font-size: ${props => props.isCompact ? props.theme.typography.fontSize.base : props.theme.typography.fontSize.xl};
  flex-shrink: 0;
  margin-top: ${props => props.isCompact ? '0' : '2px'};
  display: flex;
  align-items: center;

  @media (max-width: 767px) {
    align-self: ${props => props.isCompact ? 'center' : 'flex-start'};
    font-size: ${props => props.isCompact ? props.theme.typography.fontSize.sm : props.theme.typography.fontSize.lg};
  }
`

const WarningText = styled.div`
  flex: 1;
`

const WarningTitle = styled.h3`
  color: ${props => props.theme.colors.warning};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  line-height: ${props => props.theme.typography.lineHeight.tight};

  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.lg};
  }
`

const WarningMessage = styled.p`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  margin: 0 0 ${props => props.theme.spacing.md} 0;

  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

const WarningActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 767px) {
    margin-top: ${props => props.theme.spacing.sm};
  }
`

const SignInButton = styled.button`
  background: ${props => props.theme.colors.warning};
  border: none;
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${props => props.theme.colors.warning + 'dd'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(247, 99, 12, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

const DismissButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
    border-color: ${props => props.theme.colors.text.secondary};
  }

  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

const LocalStorageWarning = ({ hasTodos = false }) => {
  const { isAuthenticated, login, isLoading } = useAuth()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Don't show warning if user is authenticated or has dismissed it
  if (isAuthenticated || isDismissed) {
    return null
  }

  const isCompact = hasTodos

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true)
      await login()
    } catch (error) {
      console.error('Sign in failed:', error)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('localStorageWarningDismissed', 'true')
  }

  // Check if warning was previously dismissed (but reset on page refresh for now)
  // You could make this persistent by checking localStorage.getItem('localStorageWarningDismissed')

  return (
    <WarningBanner isCompact={isCompact}>
      <WarningContent isCompact={isCompact}>
        <WarningIconContainer isCompact={isCompact}>
          {isCompact ? <InfoIcon /> : <WarningIcon />}
        </WarningIconContainer>
        <WarningText>
          {!isCompact && <WarningTitle>Data stored locally only</WarningTitle>}
          <WarningMessage>
            {isCompact 
              ? 'Tasks are stored locally. Use the "Sign In To Enable Sync" button above to sync across devices.'
              : 'Your tasks are currently stored locally on this device. We recommend signing in to OneDrive to sync your data across devices and protect against data loss.'
            }
          </WarningMessage>
          {!isCompact && (
            <WarningActions>
              <SignInButton 
                onClick={handleSignIn}
                disabled={isLoading || isSigningIn}
              >
                {isSigningIn ? 'Signing in...' : (
                  <>
                    <CloudIcon style={{ marginRight: '0.5rem' }} />
                    Sign in to OneDrive
                  </>
                )}
              </SignInButton>
              <DismissButton onClick={handleDismiss}>
                Continue locally
              </DismissButton>
            </WarningActions>
          )}
        </WarningText>
      </WarningContent>
    </WarningBanner>
  )
}

export default LocalStorageWarning