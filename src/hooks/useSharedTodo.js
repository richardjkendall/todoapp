import { useEffect, useState, useCallback } from 'react'
import { decodeTodoFromShare } from '../utils/todoSharing'
import { shareLogger } from '../utils/logger'

/**
 * Hook for handling shared todos from URL fragments
 * Automatically detects and decodes shared todos when the app loads
 */
export const useSharedTodo = () => {
  const [sharedTodo, setSharedTodo] = useState(null)
  const [isProcessingShare, setIsProcessingShare] = useState(false)

  // Check for shared todo in URL fragment
  const checkForSharedTodo = useCallback(() => {
    const hash = window.location.hash.slice(1) // Remove #
    
    if (!hash) return null
    
    // Look for share= parameter
    const params = new URLSearchParams(hash)
    const shareData = params.get('share')
    
    if (!shareData) return null
    
    setIsProcessingShare(true)
    
    try {
      const decoded = decodeTodoFromShare(shareData)
      if (decoded) {
        setSharedTodo(decoded)
        // Clear the URL fragment after processing
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    } catch (error) {
      shareLogger.error('Error processing shared todo', { error: error.message })
    } finally {
      setIsProcessingShare(false)
    }
  }, [])

  // Handle hash changes (for SPAs)
  const handleHashChange = useCallback(() => {
    checkForSharedTodo()
  }, [checkForSharedTodo])

  // Clear shared todo
  const clearSharedTodo = useCallback(() => {
    setSharedTodo(null)
  }, [])

  // Accept shared todo and clear it
  const acceptSharedTodo = useCallback(() => {
    const todo = sharedTodo
    setSharedTodo(null)
    return todo
  }, [sharedTodo])

  // Set up event listeners
  useEffect(() => {
    // Check on mount
    checkForSharedTodo()
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [checkForSharedTodo, handleHashChange])

  return {
    sharedTodo,
    isProcessingShare,
    clearSharedTodo,
    acceptSharedTodo
  }
}