import styled from 'styled-components'
import { CheckIcon, CloudIcon, EditIcon, PlusIcon } from './Icons'

const WelcomeContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.md};
  text-align: center;
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing['2xl']} ${props => props.theme.spacing.xl};
  }
`

const WelcomeTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize['2xl']};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  line-height: ${props => props.theme.typography.lineHeight.tight};
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize['3xl']};
    margin-bottom: ${props => props.theme.spacing.lg};
  }
`

const WelcomeSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.lg};
    margin-bottom: ${props => props.theme.spacing['2xl']};
  }
`

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: ${props => props.theme.spacing.xl};
    margin-bottom: ${props => props.theme.spacing['2xl']};
  }
`

const FeatureCard = styled.div`
  background: linear-gradient(145deg, ${props => props.theme.colors.card} 0%, ${props => props.theme.colors.surface} 100%);
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  text-align: left;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme.colors.primary + '40'};
  }
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing.xl};
  }
`

const FeatureIconContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryHover} 100%);
  border-radius: ${props => props.theme.borderRadius.md};
  color: white;
  font-size: ${props => props.theme.typography.fontSize.xl};
  margin-bottom: ${props => props.theme.spacing.md};
  box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
`

const FeatureTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  line-height: ${props => props.theme.typography.lineHeight.tight};
`

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

const GetStartedSection = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}08 0%, ${props => props.theme.colors.primary}05 100%);
  border: 1px solid ${props => props.theme.colors.primary}20;
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.xl};
  
  @media (min-width: 768px) {
    padding: ${props => props.theme.spacing['2xl']};
    margin-top: ${props => props.theme.spacing['2xl']};
  }
`

const GetStartedTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  line-height: ${props => props.theme.typography.lineHeight.tight};
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize['2xl']};
  }
`

const GetStartedText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.lg};
  }
`

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-around;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.xl};
    margin-top: ${props => props.theme.spacing.xl};
  }
`

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
  text-align: left;
  
  @media (min-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
    gap: ${props => props.theme.spacing.sm};
  }
`

const StepNumber = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${props => props.theme.colors.primary};
  color: white;
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  border-radius: ${props => props.theme.borderRadius.full};
  flex-shrink: 0;
  
  @media (min-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

const StepText = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.normal};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  
  @media (min-width: 768px) {
    font-size: ${props => props.theme.typography.fontSize.base};
  }
`

const WelcomeScreen = () => {
  return (
    <WelcomeContainer>
      <WelcomeTitle>Welcome to LongList!</WelcomeTitle>
      <WelcomeSubtitle>
        Your modern task management companion designed for seamless organization across all your devices.
      </WelcomeSubtitle>

      <FeaturesGrid>
        <FeatureCard>
          <FeatureIconContainer>
            <PlusIcon />
          </FeatureIconContainer>
          <FeatureTitle>Smart Task Management</FeatureTitle>
          <FeatureDescription>
            Add tasks with hashtags and priorities (like #work !1). Our intelligent system automatically organizes and sorts your tasks for maximum productivity.
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIconContainer>
            <CloudIcon />
          </FeatureIconContainer>
          <FeatureTitle>Cross-Device Sync</FeatureTitle>
          <FeatureDescription>
            Sign in with Microsoft to sync your tasks across all devices via OneDrive. Access your tasks anywhere, anytime, with automatic conflict resolution.
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIconContainer>
            <EditIcon />
          </FeatureIconContainer>
          <FeatureTitle>Powerful Editing</FeatureTitle>
          <FeatureDescription>
            Edit tasks inline, manage tags, set priorities, and organize with drag-and-drop. Everything you need for efficient task management at your fingertips.
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIconContainer>
            <CheckIcon />
          </FeatureIconContainer>
          <FeatureTitle>Offline First</FeatureTitle>
          <FeatureDescription>
            Work seamlessly offline with local storage. Your tasks are always available, and changes sync automatically when you're back online.
          </FeatureDescription>
        </FeatureCard>
      </FeaturesGrid>

      <GetStartedSection>
        <GetStartedTitle>Ready to get organized?</GetStartedTitle>
        <GetStartedText>
          Getting started with LongList is easy. Follow these simple steps:
        </GetStartedText>
        
        <StepsContainer>
          <Step>
            <StepNumber>1</StepNumber>
            <StepText>
              Type your first task in the box above (try "Buy groceries #shopping !2")
            </StepText>
          </Step>
          <Step>
            <StepNumber>2</StepNumber>
            <StepText>
              Use hashtags for categories and !1-5 for priorities
            </StepText>
          </Step>
          <Step>
            <StepNumber>3</StepNumber>
            <StepText>
              Sign in with Microsoft to sync across devices
            </StepText>
          </Step>
        </StepsContainer>
      </GetStartedSection>
    </WelcomeContainer>
  )
}

export default WelcomeScreen