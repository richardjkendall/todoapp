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
   * Format timestamp for display
   */
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const isYesterday = date.toDateString() === yesterday.toDateString()
      
      if (isYesterday) {
        return 'Yesterday'
      } else {
        return date.toLocaleDateString()
      }
    }
  }, [])

  return {
    extractTagsAndText,
    reconstructTextWithTags,
    formatTimestamp
  }
}