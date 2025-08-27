import { useCallback } from 'react'
import { DEFAULT_PRIORITY } from '../utils/todoValidation'

/**
 * Hook for parsing todo text, extracting tags and priority
 */
export const useTodoTextParser = () => {
  
  /**
   * Extract tags and priority from text
   */
  const extractTagsAndText = useCallback((text) => {
    const tagRegex = /#\w+/g
    const priorityRegex = /!([1-5])/g

    const tags = (text.match(tagRegex) || []).map(tag => tag.substring(1))
    const priorityMatch = text.match(priorityRegex)
    const priority = priorityMatch ? parseInt(priorityMatch[priorityMatch.length - 1][1]) : DEFAULT_PRIORITY

    const cleanText = text
      .replace(tagRegex, '')
      .replace(priorityRegex, '')
      .replace(/\s+/g, ' ')
      .trim()

    return { text: cleanText, tags, priority }
  }, [])

  /**
   * Reconstruct text with tags and priority for display/editing
   */
  const reconstructTextWithTags = useCallback((text, tags, priority) => {
    let result = text

    if (tags && tags.length > 0) {
      result += ' ' + tags.map(tag => `#${tag}`).join(' ')
    }

    if (priority && priority !== DEFAULT_PRIORITY) {
      result += ` !${priority}`
    }

    return result.trim()
  }, [])

  /**
   * Format timestamp for display with age in days and highlighting
   */
  const formatTimestamp = useCallback((timestamp, priority = 3) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    // Calculate age in days
    const timeDiff = now.getTime() - date.getTime()
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24))
    
    // Define age thresholds based on priority (higher priority = earlier alerts)
    const getAgeThresholds = (priority) => {
      switch(priority) {
        case 5: return { warning: 1, urgent: 3 }    // Highest priority: warn after 1 day, urgent after 3
        case 4: return { warning: 2, urgent: 5 }    // High priority: warn after 2 days, urgent after 5
        case 3: return { warning: 5, urgent: 10 }   // Normal: warn after 5 days, urgent after 10
        case 2: return { warning: 10, urgent: 20 }  // Low priority: warn after 10 days, urgent after 20
        case 1: return { warning: 15, urgent: 30 }  // Lowest priority: warn after 15 days, urgent after 30
        default: return { warning: 5, urgent: 10 }
      }
    }
    
    const thresholds = getAgeThresholds(priority)
    const getHighlightLevel = () => {
      if (daysDiff >= thresholds.urgent) return 'urgent'
      if (daysDiff >= thresholds.warning) return 'warning'
      return 'normal'
    }
    
    if (isToday) {
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return {
        displayText: `${timeStr} (today)`,
        daysDiff: 0,
        highlightLevel: 'normal'
      }
    } else {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const isYesterday = date.toDateString() === yesterday.toDateString()
      
      if (isYesterday) {
        return {
          displayText: 'Yesterday (1 day)',
          daysDiff: 1,
          highlightLevel: getHighlightLevel()
        }
      } else {
        const dateStr = date.toLocaleDateString()
        const daysText = daysDiff === 1 ? '1 day' : `${daysDiff} days`
        return {
          displayText: `${dateStr} (${daysText})`,
          daysDiff,
          highlightLevel: getHighlightLevel()
        }
      }
    }
  }, [])

  return {
    extractTagsAndText,
    reconstructTextWithTags,
    formatTimestamp
  }
}