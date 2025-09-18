import styled from 'styled-components'

const ChipButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.active 
    ? props.theme.colors.primary 
    : props.theme.colors.surface};
  color: ${props => props.active 
    ? '#FFFFFF'
    : props.theme.colors.text.primary};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  
  /* Add class name for better selector targeting */
  &.filter-chip {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  @media (min-width: 769px) {
    gap: ${props => props.theme.spacing.sm};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
  
  &:hover {
    background: ${props => props.active 
      ? props.theme.colors.primaryHover 
      : props.theme.colors.card};
    border-color: ${props => props.active 
      ? props.theme.colors.primaryHover 
      : props.theme.colors.borderFocus};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.borderFocus};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.borderFocus}40;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const ChipCount = styled.span`
  background: ${props => props.active 
    ? 'rgba(255, 255, 255, 0.2)' 
    : props.theme.colors.card};
  color: ${props => props.active 
    ? 'rgba(255, 255, 255, 0.9)' 
    : props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  min-width: 1.25rem;
  text-align: center;
  line-height: 1;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const FilterChip = ({ 
  label, 
  count, 
  active = false, 
  onClick,
  disabled = false,
  'data-testid': testId
}) => {
  const isOrphaned = count === 0 && active
  
  return (
    <ChipButton
      className="filter-chip"
      active={active}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-pressed={active}
      role="button"
      style={isOrphaned ? { opacity: 0.8, fontStyle: 'italic' } : {}}
      title={isOrphaned ? 'No items match this filter (click to remove)' : undefined}
    >
      {label}
      {count > 0 ? (
        <ChipCount active={active}>
          {count}
        </ChipCount>
      ) : active && (
        <ChipCount active={active}>
          ✕
        </ChipCount>
      )}
    </ChipButton>
  )
}

export default FilterChip