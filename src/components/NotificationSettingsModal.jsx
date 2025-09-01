import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { 
  getNotificationSettings, 
  saveNotificationSettings,
  requestNotificationPermission,
  isNotificationSupported,
  canShowNotifications,
  showNotification,
  createAgedItemsNotification,
  createHighPriorityNotification,
  createDailyDigestNotification,
  NOTIFICATION_PERMISSIONS
} from '../utils/notificationService'
import { filterLogger } from '../utils/logger'
import { CancelIcon, BellIcon, ClockIcon, ZapIcon, CalendarIcon, BarChartIcon, CheckIcon } from './Icons'

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
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @media (max-width: 767px) {
    padding: ${props => props.theme.spacing.lg};
    margin: ${props => props.theme.spacing.md};
    max-height: 85vh;
  }
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.lg};
`

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text.primary};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.borderFocus}40;
  }
`

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.sm};
  }
`

const SettingLabel = styled.div`
  flex: 1;
`

const SettingTitle = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
`

const SettingDescription = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
  line-height: ${props => props.theme.typography.lineHeight.normal};
`

const Toggle = styled.button`
  width: 48px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: ${props => props.enabled 
    ? props.theme.colors.primary 
    : props.theme.colors.surface};
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.enabled ? '26px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.borderFocus}40;
  }
`

const TimeInput = styled.input`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  width: 80px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.borderFocus};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PermissionBanner = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'granted': return `${props.theme.colors.success}10`
      case 'denied': return `${props.theme.colors.error}10`  
      default: return `${props.theme.colors.warning}10`
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'granted': return `${props.theme.colors.success}30`
      case 'denied': return `${props.theme.colors.error}30`
      default: return `${props.theme.colors.warning}30`
    }
  }};
  border-left: 3px solid ${props => {
    switch (props.status) {
      case 'granted': return props.theme.colors.success
      case 'denied': return props.theme.colors.error
      default: return props.theme.colors.warning
    }
  }};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.md};
`

const PermissionText = styled.div`
  flex: 1;
`

const PermissionTitle = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`

const PermissionDescription = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
`

const EnableButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.borderFocus}40;
  }
`

const TestSection = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};
`

const TestButton = styled.button`
  background: ${props => props.variant === 'secondary' 
    ? 'transparent' 
    : props.theme.colors.warning};
  color: ${props => props.variant === 'secondary' 
    ? props.theme.colors.text.secondary 
    : 'white'};
  border: 1px solid ${props => props.variant === 'secondary' 
    ? props.theme.colors.border 
    : props.theme.colors.warning};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
  
  &:hover:not(:disabled) {
    background: ${props => props.variant === 'secondary' 
      ? props.theme.colors.surface 
      : props.theme.colors.warningHover || '#f59e0b'};
    ${props => props.variant === 'secondary' && `
      color: ${props.theme.colors.text.primary};
    `}
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.borderFocus}40;
  }
`

const TestButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
`

const LoadingContainer = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
`

const NotificationSettingsModal = ({ isVisible, onClose }) => {
  const [settings, setSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  
  // Check if we're on localhost for testing features
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1'

  // Load settings on mount
  useEffect(() => {
    if (isVisible) {
      const loadSettings = () => {
        try {
          const currentSettings = getNotificationSettings()
          setSettings(currentSettings)
          filterLogger.debug('Notification settings loaded', { 
            enabled: currentSettings.enabled,
            permissions: currentSettings.permissions 
          })
        } catch (error) {
          filterLogger.error('Failed to load notification settings', { 
            error: error.message 
          })
        } finally {
          setIsLoading(false)
        }
      }

      loadSettings()
    }
  }, [isVisible])

  // Save settings when they change
  const updateSettings = (newSettings) => {
    setSettings(newSettings)
    saveNotificationSettings(newSettings)
    filterLogger.debug('Notification settings updated', newSettings)
  }

  const handleEnableNotifications = async () => {
    setIsRequestingPermission(true)
    try {
      const permission = await requestNotificationPermission()
      const updatedSettings = {
        ...settings,
        permissions: permission,
        enabled: permission === NOTIFICATION_PERMISSIONS.GRANTED
      }
      updateSettings(updatedSettings)
    } catch (error) {
      filterLogger.error('Failed to enable notifications', { 
        error: error.message 
      })
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleToggle = (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    }
    updateSettings(newSettings)
  }

  const handleTimeChange = (value) => {
    const newSettings = {
      ...settings,
      digestTime: value
    }
    updateSettings(newSettings)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Test notification functions (localhost only)
  const createTestTodos = () => ({
    aged: [
      {
        id: 'test-aged-1',
        text: 'Test aged task from 10 days ago',
        completed: false,
        priority: 2,
        timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000),
        lastModified: Date.now() - (10 * 24 * 60 * 60 * 1000)
      }
    ],
    priority: [
      {
        id: 'test-priority-1', 
        text: 'Test high priority urgent task',
        completed: false,
        priority: 5,
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
        lastModified: Date.now() - (2 * 24 * 60 * 60 * 1000),
        urgencyLevel: 'urgent'
      }
    ],
    summary: {
      totalTasks: 8,
      completedTotal: 3,
      completedToday: 2,
      pending: 5,
      overdue: 2,
      highPriority: 1
    }
  })

  const testNotification = async (type) => {
    if (!isLocalhost || isTesting) return

    setIsTesting(true)
    
    try {
      // Check if notifications are supported and permitted
      if (!isNotificationSupported()) {
        return
      }

      if (Notification.permission === 'denied') {
        return
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          return
        }
      }

      const testData = createTestTodos()
      let notification

      switch (type) {
        case 'aged':
          notification = createAgedItemsNotification(testData.aged)
          break
        case 'priority':
          notification = createHighPriorityNotification(testData.priority)
          break
        case 'digest':
          notification = createDailyDigestNotification(testData.summary)
          break
        case 'batch':
          // Test batched notification
          notification = {
            title: '📋 Multiple Updates',
            body: 'You have several task notifications: high priority tasks, overdue items, daily summary',
            tag: 'batched_notifications',
            data: {
              type: 'batched',
              types: ['priority', 'aged', 'digest'],
              todoIds: ['test-1', 'test-2', 'test-3'],
              notifications: 3
            },
            actions: [
              {
                action: 'view',
                title: 'Open App',
                icon: '/icons/view.png'
              },
              {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss.png'
              }
            ]
          }
          break
        case 'simple':
          // Simple notification test (bypasses service worker)
          try {
            const simpleNotification = new Notification('🧪 Simple Test', {
              body: 'This is a basic notification test without service worker',
              icon: '/pwa-192x192.png'
            })
            
            setTimeout(() => simpleNotification.close(), 5000)
            return
          } catch (simpleError) {
            filterLogger.error('Simple notification failed', { error: simpleError.message })
            return
          }
          
        default:
          // Basic test notification
          notification = {
            title: '🧪 Test Notification',
            body: 'This is a test notification from LongList PWA',
            tag: 'test_notification',
            data: { type: 'test' },
            actions: [
              {
                action: 'view',
                title: 'Open App'
              }
            ]
          }
      }

      const success = await showNotification(notification)
      
      if (success) {
        filterLogger.info('Test notification sent', { type })
      }
      
    } catch (error) {
      filterLogger.error('Test notification failed', { 
        error: error.message,
        type 
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (!isVisible) return null

  if (isLoading || !settings) {
    return (
      <ModalOverlay onClick={handleOverlayClick}>
        <ModalContainer onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>Notification Settings</ModalTitle>
            <CloseButton onClick={onClose} aria-label="Close settings">
              <CancelIcon />
            </CloseButton>
          </ModalHeader>
          <LoadingContainer>Loading notification settings...</LoadingContainer>
        </ModalContainer>
      </ModalOverlay>
    )
  }

  if (!isNotificationSupported()) {
    return (
      <ModalOverlay onClick={handleOverlayClick}>
        <ModalContainer onClick={e => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>Notification Settings</ModalTitle>
            <CloseButton onClick={onClose} aria-label="Close settings">
              <CancelIcon />
            </CloseButton>
          </ModalHeader>
          <PermissionBanner status="denied">
            <PermissionText>
              <PermissionTitle>Notifications Not Supported</PermissionTitle>
              <PermissionDescription>
                Your browser doesn't support notifications. Please use a modern browser with PWA support.
              </PermissionDescription>
            </PermissionText>
          </PermissionBanner>
        </ModalContainer>
      </ModalOverlay>
    )
  }

  const getPermissionBanner = () => {
    switch (settings.permissions) {
      case NOTIFICATION_PERMISSIONS.GRANTED:
        return null // No banner needed when notifications are working
      
      case NOTIFICATION_PERMISSIONS.DENIED:
        return (
          <PermissionBanner status="denied">
            <PermissionText>
              <PermissionTitle>
                <CancelIcon style={{ color: 'inherit' }} />
                Notifications Blocked
              </PermissionTitle>
              <PermissionDescription>
                Notifications are blocked. Enable them in your browser settings to receive task reminders.
              </PermissionDescription>
            </PermissionText>
          </PermissionBanner>
        )
      
      default:
        return (
          <PermissionBanner status="default">
            <PermissionText>
              <PermissionTitle>
                <BellIcon style={{ color: 'inherit' }} />
                Enable Notifications
              </PermissionTitle>
              <PermissionDescription>
                Get reminded about aged tasks and high priority items that need your attention
              </PermissionDescription>
            </PermissionText>
            <EnableButton 
              onClick={handleEnableNotifications}
              disabled={isRequestingPermission}
            >
              {isRequestingPermission ? 'Requesting...' : 'Enable'}
            </EnableButton>
          </PermissionBanner>
        )
    }
  }

  const canModifySettings = canShowNotifications()

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Notification Settings</ModalTitle>
          <CloseButton onClick={onClose} aria-label="Close settings">
            <CancelIcon />
          </CloseButton>
        </ModalHeader>
        
        {getPermissionBanner()}
        
        <SettingRow>
          <SettingLabel>
            <SettingTitle>
              <ClockIcon style={{ marginRight: '8px' }} />
              Aged Items Reminders
            </SettingTitle>
            <SettingDescription>
              Get notified about tasks that have been pending for more than a week
            </SettingDescription>
          </SettingLabel>
          <Toggle
            enabled={settings.agedItemsEnabled}
            disabled={!canModifySettings}
            onClick={() => handleToggle('agedItemsEnabled')}
            aria-label="Toggle aged items notifications"
          />
        </SettingRow>

        <SettingRow>
          <SettingLabel>
            <SettingTitle>
              <ZapIcon style={{ marginRight: '8px' }} />
              High Priority Alerts
            </SettingTitle>
            <SettingDescription>
              Get notified about urgent (priority 5) and important (priority 4) tasks
            </SettingDescription>
          </SettingLabel>
          <Toggle
            enabled={settings.highPriorityEnabled}
            disabled={!canModifySettings}
            onClick={() => handleToggle('highPriorityEnabled')}
            aria-label="Toggle high priority notifications"
          />
        </SettingRow>

        <SettingRow>
          <SettingLabel>
            <SettingTitle>
              <BarChartIcon style={{ marginRight: '8px' }} />
              Daily Digest
            </SettingTitle>
            <SettingDescription>
              Receive a daily summary of your tasks, completed items, and priorities
            </SettingDescription>
          </SettingLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TimeInput
              type="time"
              value={settings.digestTime}
              disabled={!canModifySettings || !settings.dailyDigestEnabled}
              onChange={(e) => handleTimeChange(e.target.value)}
              aria-label="Daily digest time"
            />
            <Toggle
              enabled={settings.dailyDigestEnabled}
              disabled={!canModifySettings}
              onClick={() => handleToggle('dailyDigestEnabled')}
              aria-label="Toggle daily digest notifications"
            />
          </div>
        </SettingRow>

        {/* Test Section - only visible on localhost */}
        {isLocalhost && canModifySettings && (
          <TestSection>
            <SettingTitle>Testing (localhost only)</SettingTitle>
            <SettingDescription>
              Test different notification types to see how they appear on your device
            </SettingDescription>
            <TestButtonGroup>
              <TestButton 
                onClick={() => testNotification('simple')}
                disabled={isTesting}
              >
                {isTesting ? 'Testing...' : 'Simple Test'}
              </TestButton>
              <TestButton 
                onClick={() => testNotification('basic')}
                disabled={isTesting}
              >
                PWA Test
              </TestButton>
              <TestButton 
                onClick={() => testNotification('aged')}
                disabled={isTesting}
              >
                Aged Items
              </TestButton>
              <TestButton 
                onClick={() => testNotification('priority')}
                disabled={isTesting}
              >
                High Priority
              </TestButton>
              <TestButton 
                onClick={() => testNotification('digest')}
                disabled={isTesting}
              >
                Daily Digest
              </TestButton>
              <TestButton 
                onClick={() => testNotification('batch')}
                disabled={isTesting}
                variant="secondary"
              >
                Batched
              </TestButton>
            </TestButtonGroup>
          </TestSection>
        )}
      </ModalContainer>
    </ModalOverlay>
  )
}

export default NotificationSettingsModal