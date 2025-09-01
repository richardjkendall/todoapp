import { useState, useCallback } from 'react'
import styled from 'styled-components'
import FilterChip from './FilterChip'
import { useQuickFilters } from '../hooks/useQuickFilters'
import { filterLogger } from '../utils/logger'

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
  onFilterChange, 
  searchActive = false,
  currentSearchQuery = '',
  filterStats = null
}) => {
  const [activeFilters, setActiveFilters] = useState(new Set())
  const { quickFilterOptions, filterTodosByAge, filterTodosByPriorityGroup } = useQuickFilters(todos)
  
  /**
   * Handle filter chip click
   */
  const handleFilterClick = useCallback((option) => {
    const newActiveFilters = new Set(activeFilters)
    
    if (activeFilters.has(option.id)) {
      // Remove filter
      newActiveFilters.delete(option.id)
      filterLogger.debug('Filter removed', { filterId: option.id, label: option.label })
    } else {
      // Add filter
      newActiveFilters.add(option.id)
      filterLogger.debug('Filter added', { filterId: option.id, label: option.label })
    }
    
    setActiveFilters(newActiveFilters)
    
    // Apply combined filters
    if (newActiveFilters.size === 0) {
      // No filters active - show all todos
      onFilterChange(todos, null, {
        filteredCount: todos.length,
        totalCount: todos.length
      })
    } else {
      // Apply all active filters
      let filteredTodos = todos
      const activeFilterOptions = quickFilterOptions.filter(opt => newActiveFilters.has(opt.id))
      
      // Apply each filter sequentially
      activeFilterOptions.forEach(filterOption => {
        if (filterOption.type === 'tag') {
          const tag = filterOption.label.substring(1) // Remove #
          filteredTodos = filteredTodos.filter(todo => 
            todo.tags && todo.tags.some(t => t.toLowerCase() === tag.toLowerCase())
          )
        } else if (filterOption.type === 'age') {
          const ageType = filterOption.id === 'old-items' ? 'old' : 'very-old'
          filteredTodos = filterTodosByAge(filteredTodos, ageType)
        } else if (filterOption.type === 'priority') {
          const priorityGroup = filterOption.id === 'high-priority' ? 'high' : 'low'
          filteredTodos = filterTodosByPriorityGroup(filteredTodos, priorityGroup)
        } else if (filterOption.type === 'status') {
          const completed = filterOption.id === 'completed'
          filteredTodos = filteredTodos.filter(todo => todo.completed === completed)
        }
      })
      
      filterLogger.info('Quick filters applied', {
        activeFilters: activeFilterOptions.map(opt => opt.label),
        originalCount: todos.length,
        filteredCount: filteredTodos.length
      })
      
      onFilterChange(filteredTodos, Array.from(newActiveFilters), {
        filteredCount: filteredTodos.length,
        totalCount: todos.length
      })
    }
  }, [activeFilters, quickFilterOptions, todos, onFilterChange, filterTodosByAge, filterTodosByPriorityGroup])
  
  // Don't show quick filters if regular search is active
  if (searchActive) {
    return null
  }
  
  // Don't show if no filter options available
  if (quickFilterOptions.length === 0) {
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
        {quickFilterOptions.map(option => (
          <FilterChip
            key={option.id}
            label={option.label}
            count={option.count}
            active={activeFilters.has(option.id)}
            onClick={() => handleFilterClick(option)}
            data-testid={`filter-${option.id}`}
          />
        ))}
      </FiltersScrollArea>
    </FiltersContainer>
  )
}

export default QuickFilters