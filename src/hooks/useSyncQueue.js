import { useState, useCallback, useRef } from 'react'
import { syncLogger } from '../utils/logger'

export const useSyncQueue = () => {
  const [pendingOperations, setPendingOperations] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const operationIdRef = useRef(0)

  // Add operation to queue
  const queueOperation = useCallback((operation) => {
    const id = ++operationIdRef.current
    const queuedOperation = {
      id,
      timestamp: Date.now(),
      ...operation
    }

    setPendingOperations(prev => [...prev, queuedOperation])
    return id
  }, [])

  // Remove operation from queue
  const removeOperation = useCallback((id) => {
    setPendingOperations(prev => prev.filter(op => op.id !== id))
  }, [])

  // Clear all operations
  const clearQueue = useCallback(() => {
    setPendingOperations([])
  }, [])

  // Process queue with a handler function
  const processQueue = useCallback(async (handler) => {
    if (isProcessing || pendingOperations.length === 0) {
      return { success: true, processed: 0 }
    }

    setIsProcessing(true)
    let processedCount = 0
    const failedOperations = []

    try {
      // Process operations in order
      for (const operation of pendingOperations) {
        try {
          await handler(operation)
          processedCount++
        } catch (error) {
          syncLogger.error('Failed to process queued operation', { 
            operationId: operation.id, 
            operationType: operation.type,
            error: error.message 
          })
          failedOperations.push(operation)
        }
      }

      // Remove successful operations, keep failed ones for retry
      setPendingOperations(failedOperations)

      return {
        success: failedOperations.length === 0,
        processed: processedCount,
        failed: failedOperations.length
      }
    } finally {
      setIsProcessing(false)
    }
  }, [pendingOperations, isProcessing])

  // Get queue status
  const queueStatus = {
    count: pendingOperations.length,
    isProcessing,
    oldestOperation: pendingOperations.length > 0 ? pendingOperations[0] : null
  }

  return {
    pendingOperations,
    queueStatus,
    queueOperation,
    removeOperation,
    clearQueue,
    processQueue
  }
}