/**
 * Smart Sync with Timestamp-Based Conflict Avoidance
 * 
 * Core principle: Only show conflicts for true simultaneous edits.
 * Use modification timestamps to intelligently resolve most conflicts automatically.
 */

import { conflictLogger } from './logger'

// Configuration constants
const CONFLICT_WINDOW = 5 * 60 * 1000      // 5 minutes - only consider conflicts within this window
const CLEAR_WINNER_THRESHOLD = 30 * 1000   // 30 seconds - clear winner if time diff > this
const GRACE_PERIOD = 2 * 60 * 1000        // 2 minutes - recent local changes always win

/**
 * Compare two todos for content equality (ignoring timestamps)
 */
function todosHaveSameContent(todo1, todo2) {
  if (!todo1 || !todo2) return false
  
  const userFields = ['text', 'completed', 'tags', 'priority', 'order']
  
  for (const field of userFields) {
    let val1 = todo1[field]
    let val2 = todo2[field]
    
    // Normalize values for comparison
    if (field === 'text') {
      val1 = (val1 || '').trim()
      val2 = (val2 || '').trim()
    } else if (field === 'completed') {
      val1 = Boolean(val1)
      val2 = Boolean(val2)
    } else if (field === 'tags') {
      val1 = JSON.stringify((val1 || []).sort())
      val2 = JSON.stringify((val2 || []).sort())
    } else if (field === 'priority') {
      val1 = val1 || 3
      val2 = val2 || 3
    } else if (field === 'order') {
      val1 = val1 || 0
      val2 = val2 || 0
    }
    
    if (val1 !== val2) return false
  }
  
  return true
}

/**
 * Check if todos differ only in order field (common when adding new todos)
 */
function todosOnlyDifferInOrder(todo1, todo2) {
  if (!todo1 || !todo2) return false
  
  const nonOrderFields = ['text', 'completed', 'tags', 'priority']
  
  for (const field of nonOrderFields) {
    let val1 = todo1[field]
    let val2 = todo2[field]
    
    // Normalize values for comparison (same as above)
    if (field === 'text') {
      val1 = (val1 || '').trim()
      val2 = (val2 || '').trim()
    } else if (field === 'completed') {
      val1 = Boolean(val1)
      val2 = Boolean(val2)
    } else if (field === 'tags') {
      val1 = JSON.stringify((val1 || []).sort())
      val2 = JSON.stringify((val2 || []).sort())
    } else if (field === 'priority') {
      val1 = val1 || 3
      val2 = val2 || 3
    }
    
    if (val1 !== val2) return false // Differs in more than just order
  }
  
  // Check if order actually differs
  const order1 = todo1.order || 0
  const order2 = todo2.order || 0
  return order1 !== order2
}

/**
 * Determine if two todos should conflict based on timestamps and content
 */
function shouldConflict(localTodo, remoteTodo) {
  // Get modification timestamps (fallback to creation time if needed)
  const localTime = localTodo.lastModified || localTodo.timestamp || Date.now()
  const remoteTime = remoteTodo.lastModified || remoteTodo.timestamp || Date.now()
  const timeDiff = Math.abs(localTime - remoteTime)
  const now = Date.now()
  
  conflictLogger.debug('Analyzing timestamps for conflict detection', {
    todoId: localTodo.id,
    timeDiffSeconds: Math.round(timeDiff / 1000),
    localWins: localTime > remoteTime,
    withinConflictWindow: timeDiff <= CONFLICT_WINDOW
  })
  
  // Same content = no conflict regardless of timing
  if (todosHaveSameContent(localTodo, remoteTodo)) {
    conflictLogger.debug('Same content detected - no conflict', { todoId: localTodo.id })
    return false
  }
  
  // Order-only differences should favor local version (common when adding new todos)
  if (todosOnlyDifferInOrder(localTodo, remoteTodo)) {
    conflictLogger.debug('Order-only difference detected - local wins', { todoId: localTodo.id })
    return false
  }
  
  // If local change is very recent (within grace period), it always wins
  const localAge = now - localTime
  if (localAge < GRACE_PERIOD) {
    conflictLogger.debug('Local change is recent - local wins', { ageSeconds: Math.round(localAge / 1000) })
    return false
  }
  
  // If changes are far apart in time, use the newer one
  if (timeDiff > CONFLICT_WINDOW) {
    conflictLogger.debug('Changes are far apart - use newer', { minutesApart: Math.round(timeDiff / 60000) })
    return false
  }
  
  // If there's a clear winner (>30s difference), use the newer one
  if (timeDiff > CLEAR_WINNER_THRESHOLD) {
    conflictLogger.debug('Clear winner - use newer', { secondsDifference: Math.round(timeDiff / 1000) })
    return false
  }
  
  // Real conflict: edited within 5min window, different content, no clear winner
  conflictLogger.warn('Real conflict detected - simultaneous edits', { todoId: localTodo.id })
  return true
}

/**
 * Smart sync resolution with tombstone deletion support
 * @param {Array} localTodos - Current local todos (active only)
 * @param {Array} remoteTodos - Remote todos from OneDrive (includes tombstones)
 * @param {Set} localDeletedIds - Set of todo IDs that were deleted locally this session
 */
export function smartSyncResolve(localTodos, remoteTodos, localDeletedIds = new Set()) {
  console.log('🧠 Smart sync resolution with tombstones:', {
    localCount: localTodos.length,
    remoteCount: remoteTodos.length,
    locallyDeleted: localDeletedIds.size,
    timestamp: new Date().toISOString()
  })
  
  // Separate active todos from tombstones
  const activeRemoteTodos = remoteTodos.filter(todo => !todo.deleted)
  const remoteTombstones = remoteTodos.filter(todo => todo.deleted)
  
  console.log(`📊 Remote breakdown: ${activeRemoteTodos.length} active, ${remoteTombstones.length} tombstones`)
  
  const conflicts = []
  const resolved = []
  const tombstonesToCreate = []
  const processedLocalIds = new Set()
  
  // Step 1: Process tombstones - remove any local todos that have remote tombstones
  for (const tombstone of remoteTombstones) {
    const local = localTodos.find(t => t.id === tombstone.id)
    if (local) {
      console.log(`💀 Todo ${tombstone.id} has remote tombstone - removing from local`)
      processedLocalIds.add(tombstone.id)
      // Don't add to resolved (effectively deletes it locally)
    }
  }
  
  // Step 2: Process active remote todos
  for (const remote of activeRemoteTodos) {
    const local = localTodos.find(t => t.id === remote.id)
    
    if (!local) {
      // Check if this was deleted locally this session
      if (localDeletedIds.has(remote.id)) {
        console.log(`🗑️ Todo ${remote.id} deleted locally - creating tombstone`)
        tombstonesToCreate.push(createTombstone(remote))
      } else {
        // New remote todo - add it
        console.log(`📥 New remote todo ${remote.id}: "${remote.text}"`)
        resolved.push(remote)
      }
    } else if (shouldConflict(local, remote)) {
      // True conflict - needs user input
      console.log(`🔥 Conflict for todo ${remote.id}: "${local.text}" vs "${remote.text}"`)
      conflicts.push({
        id: remote.id,
        local: local,
        remote: remote,
        conflictType: 'simultaneous-edit'
      })
      processedLocalIds.add(remote.id)
    } else {
      // Auto-resolve based on timestamps
      const localTime = local.lastModified || local.timestamp || 0
      const remoteTime = remote.lastModified || remote.timestamp || 0
      const winner = localTime > remoteTime ? local : remote
      const source = localTime > remoteTime ? 'local' : 'remote'
      
      console.log(`🤖 Auto-resolved todo ${remote.id}: using ${source} version (${winner.text})`)
      resolved.push({
        ...winner,
        // Ensure we have the latest timestamp
        lastModified: Math.max(localTime, remoteTime)
      })
      processedLocalIds.add(remote.id)
    }
  }
  
  // Step 3: Handle local-only todos (but check if they were deleted locally)
  for (const local of localTodos) {
    if (!processedLocalIds.has(local.id)) {
      if (localDeletedIds.has(local.id)) {
        // This local todo was deleted this session - create tombstone
        console.log(`🗑️ Local todo ${local.id} deleted this session - creating tombstone`)
        tombstonesToCreate.push(createTombstone(local))
      } else {
        // Regular local-only todo
        console.log(`📤 Local-only todo ${local.id}: "${local.text}"`)
        resolved.push(local)
      }
    }
  }
  
  // Step 4: Add tombstones to the resolved list (they need to be synced to OneDrive)
  resolved.push(...tombstonesToCreate)
  
  // Also preserve existing remote tombstones so they don't get lost
  resolved.push(...remoteTombstones)
  
  const totalTombstones = tombstonesToCreate.length + remoteTombstones.length
  // Smart sync complete - this log is now handled by the calling function
  
  return {
    resolved, // Includes both active todos and tombstones
    conflicts,
    hasConflicts: conflicts.length > 0,
    tombstonesCreated: tombstonesToCreate.length,
    summary: {
      total: resolved.length,
      activeTodos: resolved.length - totalTombstones,
      tombstones: totalTombstones,
      conflicts: conflicts.length
    }
  }
}

/**
 * Create conflict info for UI (compatible with existing conflict resolution component)
 */
export function createSmartConflictInfo(conflicts, allLocalTodos, allRemoteTodos) {
  if (!conflicts || conflicts.length === 0) {
    return null
  }
  
  // Format conflicts for UI
  const formattedConflicts = conflicts.map(conflict => ({
    id: conflict.id,
    local: conflict.local,
    remote: conflict.remote,
    conflictingFields: getConflictingFields(conflict.local, conflict.remote),
    conflictReason: 'simultaneous-edit'
  }))
  
  return {
    conflicts: formattedConflicts,
    local: allLocalTodos,
    remote: allRemoteTodos,
    timestamp: Date.now(),
    type: 'smart-sync-conflict'
  }
}

/**
 * Get list of fields that differ between two todos
 */
function getConflictingFields(local, remote) {
  const conflicts = []
  const userFields = ['text', 'completed', 'tags', 'priority', 'order']
  
  for (const field of userFields) {
    let localVal = local[field]
    let remoteVal = remote[field]
    
    // Normalize for comparison
    if (field === 'text') {
      localVal = (localVal || '').trim()
      remoteVal = (remoteVal || '').trim()
    } else if (field === 'completed') {
      localVal = Boolean(localVal)
      remoteVal = Boolean(remoteVal)
    } else if (field === 'tags') {
      localVal = JSON.stringify((localVal || []).sort())
      remoteVal = JSON.stringify((remoteVal || []).sort())
    } else if (field === 'priority') {
      localVal = localVal || 3
      remoteVal = remoteVal || 3
    } else if (field === 'order') {
      localVal = localVal || 0
      remoteVal = remoteVal || 0
    }
    
    if (localVal !== remoteVal) {
      conflicts.push({
        field,
        localValue: local[field],
        remoteValue: remote[field]
      })
    }
  }
  
  return conflicts
}

/**
 * Update todo timestamp when user makes changes
 */
export function touchTodo(todo) {
  return {
    ...todo,
    lastModified: Date.now()
  }
}

/**
 * Create a tombstone record for a deleted todo
 */
function createTombstone(todo) {
  return {
    ...todo,
    deleted: true,
    deletedAt: Date.now(),
    lastModified: Date.now()
  }
}

/**
 * Filter out tombstones and return only active todos for the UI
 */
export function filterActiveTodos(todos) {
  return todos.filter(todo => !todo.deleted)
}

/**
 * Clean up old tombstones (older than 30 days)
 */
export function cleanupOldTombstones(todos) {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  return todos.filter(todo => {
    if (!todo.deleted) return true // Keep active todos
    if (!todo.deletedAt) return true // Keep tombstones without deletion date (safety)
    return todo.deletedAt > thirtyDaysAgo // Keep recent tombstones
  })
}