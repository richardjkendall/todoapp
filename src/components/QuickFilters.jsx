import { useState, useCallback, useEffect, useRef } from 'react'
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
  const hasRestoredFilters = useRef(false)
  const { quickFilterOptions, filterTodosByAge, filterTodosByPriorityGroup } = useQuickFilters(todos)

  // Load saved filters on component mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('quickFilters')
      if (savedFilters) {
        const filterArray = JSON.parse(savedFilters)
        if (Array.isArray(filterArray)) {
          setActiveFilters(new Set(filterArray))
          filterLogger.debug('Restored quick filters from storage', { 
            filterCount: filterArray.length,
            filters: filterArray 
          })
        }
      }
    } catch (error) {
      filterLogger.warn('Failed to restore quick filters from storage', { 
        error: error.message 
      })
    }
  }, [])

  // Save filters to localStorage whenever activeFilters changes
  useEffect(() => {
    try {
      const filterArray = Array.from(activeFilters)
      if (filterArray.length > 0) {
        localStorage.setItem('quickFilters', JSON.stringify(filterArray))
        filterLogger.debug('Saved quick filters to storage', { 
          filterCount: filterArray.length,
          filters: filterArray 
        })
      } else {
        // Clear storage when no filters are active
        localStorage.removeItem('quickFilters')
        filterLogger.debug('Cleared quick filters from storage')
      }
    } catch (error) {
      filterLogger.warn('Failed to save quick filters to storage', { 
        error: error.message 
      })
    }
  }, [activeFilters])

  // Extract filter application logic to reuse
  const applyFilters = useCallback((filtersToApply) => {
    if (filtersToApply.size === 0) {
      onFilterChange(todos, null, {
        filteredCount: todos.length,
        totalCount: todos.length
      })
      return
    }

    // Apply all active filters
    let filteredTodos = todos
    const activeFilterOptions = quickFilterOptions.filter(opt => filtersToApply.has(opt.id))
    
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
    
    onFilterChange(filteredTodos, Array.from(filtersToApply), {
      filteredCount: filteredTodos.length,
      totalCount: todos.length
    })
  }, [todos, quickFilterOptions, onFilterChange, filterTodosByAge, filterTodosByPriorityGroup])
  
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
    applyFilters(newActiveFilters)
  }, [activeFilters, applyFilters])

  // Apply restored filters when quickFilterOptions become available
  useEffect(() => {
    if (activeFilters.size > 0 && quickFilterOptions.length > 0 && !hasRestoredFilters.current) {
      // Apply filters after restoration
      filterLogger.debug('Applying restored filters', { filterCount: activeFilters.size })
      hasRestoredFilters.current = true
      applyFilters(activeFilters)
    }
  }, [quickFilterOptions, applyFilters]) // Only run when quickFilterOptions changes

  // Listen for external filter requests (from notifications, etc.)
  useEffect(() => {
    const handleExternalFilterRequest = (event) => {
      const { filterName, filterParams } = event.detail || {}
      
      filterLogger.debug('External filter request received', { filterName, filterParams })
      
      // Map external filter params to internal filter IDs
      let filterId = null
      
      if (filterParams === 'aged') {
        filterId = 'old-items'
      } else if (filterParams === 'high-priority') {
        filterId = 'high-priority'
      } else if (filterName) {
        // Try to find filter by name
        const matchingOption = quickFilterOptions.find(opt => 
          opt.label.toLowerCase().includes(filterName.toLowerCase())
        )
        filterId = matchingOption?.id
      }
      
      if (filterId) {
        filterLogger.info('Applying external filter', { filterId, filterName, filterParams })
        
        // Clear existing filters and apply the requested one
        const newActiveFilters = new Set([filterId])
        setActiveFilters(newActiveFilters)
        applyFilters(newActiveFilters)
      } else {
        filterLogger.warn('Could not find matching filter', { filterName, filterParams, availableOptions: quickFilterOptions.map(opt => opt.id) })
      }
    }

    window.addEventListener('quick-filter-select', handleExternalFilterRequest)
    
    return () => {
      window.removeEventListener('quick-filter-select', handleExternalFilterRequest)
    }
  }, [quickFilterOptions, applyFilters])
  
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