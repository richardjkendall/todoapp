import styled from 'styled-components'

const HelperContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  opacity: ${props => props.show ? 1 : 0};
  transform: translateY(${props => props.show ? '0' : '-8px'});
  transition: all 0.2s ease;
  pointer-events: ${props => props.show ? 'auto' : 'none'};
`

const HelperTitle = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`

const HelperList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`

const HelperItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  line-height: ${props => props.theme.typography.lineHeight.tight};
`

const HelperCode = styled.code`
  background: ${props => props.theme.colors.surface};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8em;
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  min-width: 80px;
  text-align: center;
`

const InputHelper = ({ show, isSearchMode }) => {
  const addModeHelp = [
    { code: '#work', description: 'Add tags to categorize todos' },
    { code: '!1 to !5', description: 'Set priority (1=highest, 5=lowest)' },
    { code: 'Enter', description: 'Add new line' },
    { code: 'Ctrl+Enter', description: 'Save todo' },
    { code: '/', description: 'Switch to search mode' }
  ]

  const searchModeHelp = [
    { code: '/text', description: 'Search by todo text content' },
    { code: '#tag', description: 'Filter by specific tags' },
    { code: '!3', description: 'Filter by priority level' },
    { code: 'completed:true', description: 'Show only completed todos' },
    { code: 'completed:false', description: 'Show only incomplete todos' },
    { code: 'Escape', description: 'Exit search mode' }
  ]

  const helpItems = isSearchMode ? searchModeHelp : addModeHelp

  return (
    <HelperContainer show={show}>
      <HelperTitle>
        {isSearchMode ? 'Search Commands' : 'Todo Formatting'}
      </HelperTitle>
      <HelperList>
        {helpItems.map((item, index) => (
          <HelperItem key={index}>
            <HelperCode>{item.code}</HelperCode>
            <span>{item.description}</span>
          </HelperItem>
        ))}
      </HelperList>
    </HelperContainer>
  )
}

export default InputHelper