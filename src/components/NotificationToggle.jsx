import styled from 'styled-components'
import { useState, useEffect } from 'react'
import { getNotificationSettings, canShowNotifications } from '../utils/notificationService'
import { BellIcon } from './Icons'

const ToggleButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  margin-right: ${props => props.theme.spacing.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  position: relative;

  &:hover {
    background: ${props => props.theme.colors.surface};
    border-color: ${props => props.theme.colors.borderFocus};
    color: ${props => props.theme.colors.text.primary};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.borderFocus};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.borderFocus}40;
  }

  &:active {
    transform: translateY(1px);
  }

  /* Desktop compact mode (when sticky) */
  ${props => props.isCompact && `
    @media (min-width: 768px) {
      padding: ${props.theme.spacing.xs};
      font-size: ${props.theme.typography.fontSize.xs};
      transform: scale(0.9);
      
      span {
        display: none;
      }
    }
  `}

  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.xs};
    font-size: ${props => props.theme.typography.fontSize.xs};
    
    span {
      display: none;
    }
  }
`

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'enabled': return props.theme.colors.success
      case 'disabled': return props.theme.colors.text.tertiary
      case 'blocked': return props.theme.colors.error
      default: return props.theme.colors.warning
    }
  }};
  flex-shrink: 0;
  transition: background-color 0.2s ease;
`

const NotificationToggle = ({ onToggle, isVisible, isCompact }) => {
  const [notificationStatus, setNotificationStatus] = useState('unknown')

  const updateStatus = () => {
    const settings = getNotificationSettings()
    const canShow = canShowNotifications()
    
    if (settings.permissions === 'denied') {
      setNotificationStatus('blocked')
    } else if (canShow && settings.enabled) {
      setNotificationStatus('enabled')
    } else if (settings.permissions === 'granted' && !settings.enabled) {
      setNotificationStatus('disabled')
    } else {
      setNotificationStatus('pending')
    }
  }

  // Update status on initial load and after a short delay to handle race conditions
  useEffect(() => {
    updateStatus()
    
    // Also check after a short delay in case permissions API is async
    const timeoutId = setTimeout(updateStatus, 100)
    
    // Update status when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateStatus()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Poll for status updates when modal is visible
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(updateStatus, 1000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const getStatusText = () => {
    switch (notificationStatus) {
      case 'enabled': return 'Notifications On'
      case 'disabled': return 'Notifications Off'
      case 'blocked': return 'Notifications Blocked'
      case 'pending': return 'Notifications'
      default: return 'Notifications'
    }
  }

  const getAriaLabel = () => {
    return isVisible ? 'Hide notification settings' : 'Show notification settings'
  }

  return (
    <ToggleButton 
      onClick={onToggle}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
      isCompact={isCompact}
    >
      <BellIcon style={{ fontSize: '14px' }} />
      <StatusDot status={notificationStatus} />
      <span>{getStatusText()}</span>
    </ToggleButton>
  )
}

export default NotificationToggle