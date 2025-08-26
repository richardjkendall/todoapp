import styled, { keyframes } from 'styled-components'

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`

const OfflineBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.warning};
  color: white;
  padding: ${props => props.theme.spacing.sm};
  text-align: center;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  z-index: 9999;
  animation: ${pulse} 2s ease-in-out infinite;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const OfflineMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
`

const OfflineIcon = styled.div`
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${props => props.theme.colors.warning};
`

const QueueCount = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-left: ${props => props.theme.spacing.sm};
`

const OfflineIndicator = ({ isOnline, queueStatus }) => {
  if (isOnline) return null

  return (
    <OfflineBanner>
      <OfflineMessage>
        <OfflineIcon>⚡</OfflineIcon>
        Working offline - changes saved locally
        {queueStatus.count > 0 && (
          <QueueCount>{queueStatus.count} changes queued for sync</QueueCount>
        )}
      </OfflineMessage>
    </OfflineBanner>
  )
}

export default OfflineIndicator