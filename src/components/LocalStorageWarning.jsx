import styled from 'styled-components'
import { useAuth } from '../context/AuthContext'
import { WarningIcon } from './Icons'

const WarningBanner = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.warning}10 0%, ${props => props.theme.colors.warning}08 100%);
  border: 1px solid ${props => props.theme.colors.warning}30;
  border-left: 3px solid ${props => props.theme.colors.warning};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  margin: ${props => props.theme.spacing.md} 0;
  font-family: ${props => props.theme.typography.fontFamily};
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.md};
    margin: ${props => props.theme.spacing.lg} 0;
  }
`

const WarningContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`

const WarningIconContainer = styled.div`
  color: ${props => props.theme.colors.warning};
  font-size: ${props => props.theme.typography.fontSize.base};
  flex-shrink: 0;
  display: flex;
  align-items: center;

  @media (max-width: 767px) {
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
`

const WarningText = styled.div`
  flex: 1;
`


const WarningMessage = styled.p`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  margin: 0;

  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`


const LocalStorageWarning = () => {
  const { isAuthenticated } = useAuth()

  // Don't show warning if user is authenticated
  if (isAuthenticated) {
    return null
  }

  return (
    <WarningBanner>
      <WarningContent>
        <WarningIconContainer>
          <WarningIcon />
        </WarningIconContainer>
        <WarningText>
          <WarningMessage>
            Tasks are stored locally. Use the "Sign In To Enable Sync" button above to sync across devices.
          </WarningMessage>
        </WarningText>
      </WarningContent>
    </WarningBanner>
  )
}

export default LocalStorageWarning