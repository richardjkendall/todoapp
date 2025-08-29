import { useSyncManager } from './useSyncManager'
import { useStorageManager } from './useStorageManager'

/**
 * Enhanced OneDrive storage hook - simplified by using focused sub-hooks
 * This is now a composition of specialized hooks for better maintainability
 */
export const useEnhancedOneDriveStorage = () => {
  const storageManager = useStorageManager()
  const syncManager = useSyncManager(storageManager.isOneDriveMode)

  // Optimistic save - update UI immediately, sync in background
  const saveToOneDrive = (todos, showToast = true) => {
    if (!storageManager.isOneDriveMode) return
    
    // Check if data actually changed since last save
    if (!syncManager.hasDataChanged || !syncManager.hasDataChanged(todos)) {
      console.log('No changes detected, skipping sync')
      return
    }
    
    // Trigger debounced save
    syncManager.debouncedSave(todos, showToast)
  }

  // Load from OneDrive
  const loadFromOneDrive = async () => {
    if (!storageManager.isOneDriveMode) return []
    return await syncManager.loadData()
  }

  return {
    // Storage management
    storageType: storageManager.storageType,
    switchStorageType: storageManager.switchStorageType,
    isOneDriveMode: storageManager.isOneDriveMode,
    STORAGE_TYPES: storageManager.STORAGE_TYPES,

    // Sync operations
    saveToOneDrive,
    saveImmediately: syncManager.saveImmediately,
    loadFromOneDrive,
    resolveConflict: syncManager.resolveConflict,
    migrateToOneDrive: syncManager.migrateToOneDrive,
    rollbackOptimisticChanges: syncManager.rollbackOptimisticChanges,
    markAsDeleted: syncManager.markAsDeleted,
    clearDeletedTracking: syncManager.clearDeletedTracking,
    createGraphService: syncManager.createGraphService,

    // State
    syncStatus: syncManager.syncStatus,
    lastSyncTime: syncManager.lastSyncTime,
    isLoading: syncManager.isLoading,
    error: syncManager.error,
    conflictInfo: syncManager.conflictInfo,
    isOnline: syncManager.isOnline,
    queueStatus: syncManager.queueStatus
  }
}