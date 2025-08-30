import styled from 'styled-components'
import { GitHubIcon } from './Icons'

const FooterContainer = styled.footer`
  background: ${props => props.theme.colors.surface};
  border-top: 1px solid ${props => props.theme.colors.border};
  margin-top: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  text-align: center;
  font-family: ${props => props.theme.typography.fontFamily};

  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.xl};
    margin-top: ${props => props.theme.spacing['2xl']};
  }
`

const FooterContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
    gap: ${props => props.theme.spacing.md};
  }
`

const FooterText = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};

  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

const FooterLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};

  &:hover {
    color: ${props => props.theme.colors.primaryHover};
    background: ${props => props.theme.colors.primary}10;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  }
`

const HeartIcon = styled.span`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.base};
  margin: 0 ${props => props.theme.spacing.xs};
  animation: heartbeat 2s ease-in-out infinite;

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.lg};
  }
`

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterText>
          We <HeartIcon>♥</HeartIcon> open source
        </FooterText>
        <FooterLink 
          href="https://github.com/richardjkendall/longlist" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="View LongList source code on GitHub"
        >
          <GitHubIcon />
          View on GitHub
        </FooterLink>
      </FooterContent>
    </FooterContainer>
  )
}

export default Footer