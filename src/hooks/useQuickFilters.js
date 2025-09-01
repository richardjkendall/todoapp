import { useMemo } from 'react'
import { DEFAULT_PRIORITY } from '../utils/todoValidation'
import { filterLogger } from '../utils/logger'

/**
 * Hook for generating and managing quick filter options
 * Based on analysis of current todos to suggest relevant filters
 */
export const useQuickFilters = (todos) => {
  /**
   * Analyze todos to find most common tags (top 5)
   */
  const commonTags = useMemo(() => {
    const tagCounts = {}
    
    todos.forEach(todo => {
      if (todo.tags && Array.isArray(todo.tags)) {
        todo.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase().trim()
          if (normalizedTag) {
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1
          }
        })
      }
    })
    
    // Sort by count and take top 5
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))
    
    filterLogger.debug('Common tags analysis', {
      totalUniqueTags: Object.keys(tagCounts).length,
      topTags: sortedTags.length
    })
    
    return sortedTags
  }, [todos])
  
  /**
   * Analyze todos for age-based categorization
   */
  const ageAnalysis = useMemo(() => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay
    
    let oldCount = 0
    let veryOldCount = 0
    
    todos.forEach(todo => {
      const todoTime = todo.timestamp || todo.lastModified || now
      const age = now - todoTime
      
      if (age > oneMonth) {
        veryOldCount++
        oldCount++ // Very old items are also old
      } else if (age > oneWeek) {
        oldCount++
      }
    })
    
    filterLogger.debug('Age analysis', {
      totalTodos: todos.length,
      oldItems: oldCount,
      veryOldItems: veryOldCount
    })
    
    return {
      oldCount,
      veryOldCount,
      hasOldItems: oldCount > 0,
      hasVeryOldItems: veryOldCount > 0
    }
  }, [todos])
  
  /**
   * Analyze todos for priority distribution
   */
  const priorityAnalysis = useMemo(() => {
    const priorityCounts = {
      1: 0, // Highest
      2: 0, // High
      3: 0, // Medium (default)
      4: 0, // Low
      5: 0  // Lowest
    }
    
    todos.forEach(todo => {
      const priority = todo.priority || DEFAULT_PRIORITY
      if (priorityCounts.hasOwnProperty(priority)) {
        priorityCounts[priority]++
      }
    })
    
    const highPriorityCount = priorityCounts[5] + priorityCounts[4]
    const lowPriorityCount = priorityCounts[2] + priorityCounts[1]
    
    filterLogger.debug('Priority analysis', {
      distribution: priorityCounts,
      highPriority: highPriorityCount,
      lowPriority: lowPriorityCount
    })
    
    return {
      counts: priorityCounts,
      highPriorityCount,
      lowPriorityCount,
      hasHighPriority: highPriorityCount > 0,
      hasLowPriority: lowPriorityCount > 0
    }
  }, [todos])
  
  /**
   * Analyze completion status
   */
  const statusAnalysis = useMemo(() => {
    let completedCount = 0
    let pendingCount = 0
    
    todos.forEach(todo => {
      if (todo.completed) {
        completedCount++
      } else {
        pendingCount++
      }
    })
    
    return {
      completedCount,
      pendingCount,
      hasCompleted: completedCount > 0,
      hasPending: pendingCount > 0
    }
  }, [todos])
  
  /**
   * Generate quick filter options based on analysis
   */
  const quickFilterOptions = useMemo(() => {
    const options = []
    
    // Add common tag filters
    commonTags.forEach(({ tag, count }) => {
      options.push({
        id: `tag-${tag}`,
        type: 'tag',
        label: `#${tag}`,
        searchQuery: `#${tag}`,
        count: count,
        category: 'tags'
      })
    })
    
    // Add age-based filters
    if (ageAnalysis.hasOldItems) {
      options.push({
        id: 'old-items',
        type: 'age',
        label: 'Old items',
        searchQuery: 'age:old',
        count: ageAnalysis.oldCount,
        category: 'age'
      })
    }
    
    if (ageAnalysis.hasVeryOldItems) {
      options.push({
        id: 'very-old-items',
        type: 'age',
        label: 'Very old',
        searchQuery: 'age:very-old',
        count: ageAnalysis.veryOldCount,
        category: 'age'
      })
    }
    
    // Add priority filters - only show high priority filter
    if (priorityAnalysis.hasHighPriority) {
      options.push({
        id: 'high-priority',
        type: 'priority',
        label: 'High priority',
        searchQuery: '!5 OR !4',
        count: priorityAnalysis.highPriorityCount,
        category: 'priority'
      })
    }
    
    // Add status filters
    if (statusAnalysis.hasCompleted) {
      options.push({
        id: 'completed',
        type: 'status',
        label: 'Completed',
        searchQuery: 'completed',
        count: statusAnalysis.completedCount,
        category: 'status'
      })
    }
    
    if (statusAnalysis.hasPending) {
      options.push({
        id: 'pending',
        type: 'status',
        label: 'Pending',
        searchQuery: 'pending',
        count: statusAnalysis.pendingCount,
        category: 'status'
      })
    }
    
    return options
  }, [commonTags, ageAnalysis, priorityAnalysis, statusAnalysis])
  
  /**
   * Custom filter function for age-based filters
   * Since the existing search system doesn't handle age queries
   */
  const filterTodosByAge = (todos, ageType) => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay
    
    return todos.filter(todo => {
      const todoTime = todo.timestamp || todo.lastModified || now
      const age = now - todoTime
      
      switch (ageType) {
        case 'old':
          return age > oneWeek
        case 'very-old':
          return age > oneMonth
        default:
          return true
      }
    })
  }
  
  /**
   * Custom filter function for priority OR queries
   * Since existing system doesn't handle OR operations
   */
  const filterTodosByPriorityGroup = (todos, priorityGroup) => {
    return todos.filter(todo => {
      const priority = todo.priority || DEFAULT_PRIORITY
      
      switch (priorityGroup) {
        case 'high':
          return priority === 5 || priority === 4
        case 'low':
          return priority === 2 || priority === 1
        default:
          return true
      }
    })
  }
  
  return {
    quickFilterOptions,
    commonTags,
    ageAnalysis,
    priorityAnalysis,
    statusAnalysis,
    filterTodosByAge,
    filterTodosByPriorityGroup
  }
}