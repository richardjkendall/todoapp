import styled, { keyframes, css } from 'styled-components'

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => {
    switch (props.status) {
      case 'syncing': return props.theme.colors.warning
      case 'synced': return props.theme.colors.success
      case 'error': return props.theme.colors.error
      case 'conflict': return props.theme.colors.warning
      case 'offline': return props.theme.colors.text.secondary
      default: return props.theme.colors.text.secondary
    }
  }};
  transition: all 0.2s ease;
  padding-right: ${props => props.theme.spacing.sm};
`

const StatusIcon = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  
  ${props => props.status === 'syncing' && css`
    border: 2px solid currentColor;
    border-top-color: transparent;
    background: transparent;
    animation: ${spin} 1s linear infinite;
  `}
  
  ${props => props.status === 'offline' && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}
`

const StatusText = styled.span`
  white-space: nowrap;
`

const QueueInfo = styled.span`
  background: ${props => props.theme.colors.warning}20;
  color: ${props => props.theme.colors.warning};
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 10px;
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-left: ${props => props.theme.spacing.xs};
`

const SyncStatusIndicator = ({ 
  syncStatus, 
  lastSyncTime, 
  isOnline, 
  queueStatus,
  conflictInfo,
  isOneDriveMode 
}) => {
  if (!isOneDriveMode) {
    return (
      <StatusContainer status="local">
        <StatusIcon status="local" />
        <StatusText>Local Storage</StatusText>
      </StatusContainer>
    )
  }

  const getStatusInfo = () => {
    if (conflictInfo) {
      return {
        status: 'conflict',
        text: 'Sync conflict - action required',
        priority: 'high'
      }
    }

    if (!isOnline) {
      return {
        status: 'offline',
        text: queueStatus.count > 0 
          ? `Offline - ${queueStatus.count} changes queued`
          : 'Working offline',
        priority: queueStatus.count > 0 ? 'medium' : 'low'
      }
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          status: 'syncing',
          text: 'Syncing...',
          priority: 'medium'
        }
      case 'synced':
        return {
          status: 'synced',
          text: lastSyncTime 
            ? `Synced ${formatSyncTime(lastSyncTime)}`
            : 'Synced',
          priority: 'low'
        }
      case 'error':
        return {
          status: 'error',
          text: 'Sync failed - data saved locally',
          priority: 'medium'
        }
      default:
        return {
          status: 'idle',
          text: 'Ready to sync',
          priority: 'low'
        }
    }
  }

  const formatSyncTime = (time) => {
    const now = new Date()
    const sync = new Date(time)
    const diffMinutes = Math.floor((now - sync) / (1000 * 60))
    
    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return sync.toLocaleDateString()
  }

  const { status, text } = getStatusInfo()

  return (
    <StatusContainer status={status}>
      <StatusIcon status={status} />
      <StatusText>{text}</StatusText>
      {queueStatus.count > 0 && isOnline && (
        <QueueInfo>{queueStatus.count} queued</QueueInfo>
      )}
    </StatusContainer>
  )
}

export default SyncStatusIndicator