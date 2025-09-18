import { useMemo } from 'react'
import styled from 'styled-components'
import FilterChip from './FilterChip'
import { useQuickFilters } from '../hooks/useQuickFilters'

const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing.md} 0;
    gap: ${props => props.theme.spacing.sm};
    margin-bottom: ${props => props.theme.spacing.md};
  }
`

const FiltersScrollArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  
  @media (min-width: 769px) {
    gap: ${props => props.theme.spacing.sm};
  }
`

const ActiveFiltersIndicator = styled.div`
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.tertiary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  flex-shrink: 0;
`

const QuickFilters = ({ 
  todos, 
  activeFilters,
  onFilterToggle,
  searchActive = false,
  filterStats = null
}) => {
  const { quickFilterOptions } = useQuickFilters(todos)

  // Create combined list of options including orphaned active filters
  const allFilterOptions = useMemo(() => {
    const existingOptionIds = new Set(quickFilterOptions.map(option => option.id))
    const orphanedFilters = []
    
    // Find active filters that don't exist in current quickFilterOptions
    Array.from(activeFilters).forEach(filterId => {
      if (!existingOptionIds.has(filterId)) {
        // Create a dummy option for the orphaned filter so user can deactivate it
        orphanedFilters.push({
          id: filterId,
          type: 'orphaned',
          label: filterId.startsWith('tag-') 
            ? `#${filterId.replace('tag-', '')}` 
            : filterId.replace('-', ' '),
          count: 0,
          category: 'orphaned'
        })
      }
    })
    
    return [...quickFilterOptions, ...orphanedFilters]
  }, [quickFilterOptions, activeFilters])
  
  // Don't show quick filters if regular search is active
  if (searchActive) {
    return null
  }
  
  // Don't show if no filter options available AND no active filters
  if (quickFilterOptions.length === 0 && activeFilters.size === 0) {
    return null
  }

  return (
    <FiltersContainer>
      {activeFilters.size > 0 && (
        <ActiveFiltersIndicator>
          {filterStats ? 
            `Showing ${filterStats.filteredCount} of ${filterStats.totalCount} todos` :
            `${activeFilters.size} filter${activeFilters.size > 1 ? 's' : ''} active`
          }
        </ActiveFiltersIndicator>
      )}
      
      <FiltersScrollArea>
        {allFilterOptions.map(option => (
          <FilterChip
            key={option.id}
            label={option.label}
            count={option.count}
            active={activeFilters.has(option.id)}
            onClick={() => onFilterToggle(option.id)}
            data-testid={`filter-${option.id}`}
          />
        ))}
      </FiltersScrollArea>
    </FiltersContainer>
  )
}

export default QuickFilters