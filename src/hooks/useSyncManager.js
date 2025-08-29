import { useState, useCallback, useEffect, useRef } from 'react'
import { useOfflineDetection } from './useOfflineDetection'
import { useSyncQueue } from './useSyncQueue'
import { useOneDriveOperations } from './useOneDriveOperations'

/**
 * Sync management hook - handles sync status, timing, and coordination
 */
export const useSyncManager = (isOneDriveMode) => {
  const { isOnline, wasOffline, acknowledgeOnlineStatus } = useOfflineDetection()
  const { queueOperation, processQueue, queueStatus, clearQueue } = useSyncQueue()
  const oneDriveOps = useOneDriveOperations()
  
  const [syncStatus, setSyncStatus] = useState('idle')
  const [lastSyncTime, setLastSyncTime] = useState(null)
  
  // Debounce timer reference
  const debounceTimeoutRef = useRef(null)
  const isProcessingRef = useRef(false)

  /**
   * Debounced save function with randomized delay to prevent conflicts
   */
  const debouncedSave = useCallback((todos, showToast = false) => {
    if (!isOneDriveMode || !oneDriveOps) return
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Randomized delay to prevent multiple tabs from conflicting
    const baseDelay = 2000
    const randomDelay = Math.random() * 1000
    const delay = baseDelay + randomDelay
    
    debounceTimeoutRef.current = setTimeout(async () => {
      if (isProcessingRef.current) return
      
      isProcessingRef.current = true
      setSyncStatus('syncing')
      
      try {
        if (isOnline) {
          await oneDriveOps.saveToOneDriveImmediate(todos, showToast)
          setLastSyncTime(Date.now())
          setSyncStatus('synced')
        } else {
          // Queue operation for when back online
          queueOperation({
            type: 'SAVE_TODOS',
            data: todos,
            showToast,
            timestamp: Date.now()
          })
          setSyncStatus('queued')
        }
      } catch (error) {
        console.error('Debounced save failed:', error)
        setSyncStatus('error')
      } finally {
        isProcessingRef.current = false
      }
    }, delay)
  }, [isOneDriveMode, isOnline, oneDriveOps, queueOperation])

  /**
   * Process queued operations when back online
   */
  const processQueuedOperations = useCallback(async () => {
    if (!isOnline || !isOneDriveMode || queueStatus.count === 0) return
    
    setSyncStatus('syncing')
    
    try {
      await processQueue(async (operation) => {
        switch (operation.type) {
          case 'SAVE_TODOS':
            await oneDriveOps.saveToOneDriveImmediate(operation.data, operation.showToast)
            setLastSyncTime(Date.now())
            break
          case 'LOAD_TODOS':
            return await oneDriveOps.loadFromOneDrive()
          default:
            console.warn('Unknown queued operation type:', operation.type)
        }
      })
      
      setSyncStatus('synced')
    } catch (error) {
      console.error('Failed to process sync queue:', error)
      setSyncStatus('error')
    }
  }, [isOnline, isOneDriveMode, queueStatus.count, processQueue, oneDriveOps])

  /**
   * Handle coming back online
   */
  useEffect(() => {
    if (wasOffline && isOnline && isOneDriveMode) {
      // Small delay to let network stabilize
      const timeout = setTimeout(() => {
        processQueuedOperations()
        acknowledgeOnlineStatus()
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
  }, [wasOffline, isOnline, isOneDriveMode, processQueuedOperations, acknowledgeOnlineStatus])

  /**
   * Cleanup debounce timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Immediate save operation (bypasses debounce)
   */
  const saveImmediately = useCallback(async (todos, showToast = true) => {
    if (!isOneDriveMode) return
    
    // Clear any pending debounced save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    
    setSyncStatus('syncing')
    
    try {
      if (isOnline) {
        await oneDriveOps.saveToOneDriveImmediate(todos, showToast)
        setLastSyncTime(Date.now())
        setSyncStatus('synced')
      } else {
        queueOperation({
          type: 'SAVE_TODOS',
          data: todos,
          showToast,
          timestamp: Date.now()
        })
        setSyncStatus('queued')
      }
    } catch (error) {
      console.error('Immediate save failed:', error)
      setSyncStatus('error')
      throw error
    }
  }, [isOneDriveMode, isOnline, oneDriveOps, queueOperation])

  /**
   * Load operation
   */
  const loadData = useCallback(async () => {
    if (!isOneDriveMode) return []
    
    setSyncStatus('syncing')
    
    try {
      if (isOnline) {
        const data = await oneDriveOps.loadFromOneDrive()
        setSyncStatus('synced')
        return data
      } else {
        // Queue load operation
        queueOperation({
          type: 'LOAD_TODOS',
          timestamp: Date.now()
        })
        setSyncStatus('queued')
        return []
      }
    } catch (error) {
      console.error('Load failed:', error)
      setSyncStatus('error')
      throw error
    }
  }, [isOneDriveMode, isOnline, oneDriveOps, queueOperation])

  return {
    // Core sync operations
    debouncedSave,
    saveImmediately,
    loadData,
    processQueuedOperations,
    
    // OneDrive operations passthrough
    resolveConflict: oneDriveOps.resolveConflict,
    migrateToOneDrive: oneDriveOps.migrateToOneDrive,
    rollbackOptimisticChanges: oneDriveOps.rollbackOptimisticChanges,
    hasDataChanged: oneDriveOps.hasDataChanged,
    markAsDeleted: oneDriveOps.markAsDeleted,
    clearDeletedTracking: oneDriveOps.clearDeletedTracking,
    createGraphService: oneDriveOps.createGraphService,
    
    // State
    syncStatus,
    lastSyncTime,
    isLoading: oneDriveOps.isLoading,
    error: oneDriveOps.error,
    conflictInfo: oneDriveOps.conflictInfo,
    
    // Network and queue status
    isOnline,
    queueStatus
  }
}