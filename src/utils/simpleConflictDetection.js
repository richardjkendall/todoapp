/**
 * Simplified conflict detection system
 * Core principle: OneDrive is source of truth. Only flag conflicts when there are
 * unsaved local changes that differ from remote changes.
 */

/**
 * Compare two todos for equality (ignoring system fields)
 */
function todosAreEqual(todo1, todo2) {
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
    
    if (val1 !== val2) {
      return false
    }
  }
  
  return true
}

/**
 * Check if a specific todo has a real conflict
 */
function hasRealConflict(todoId, local, remote, locallyModifiedIds) {
  // No conflict if this todo wasn't modified locally since last sync
  if (!locallyModifiedIds.has(todoId)) {
    console.log(`No conflict for todo ${todoId}: not modified locally`)
    return false
  }
  
  // No conflict if local and remote are the same
  if (todosAreEqual(local, remote)) {
    console.log(`No conflict for todo ${todoId}: local and remote are identical`)
    return false
  }
  
  console.log(`Real conflict detected for todo ${todoId}: local changes conflict with remote changes`)
  return true
}

/**
 * Simple conflict resolution
 * Returns { resolved: Todo[], conflicts: ConflictInfo[] }
 */
export function resolveSync(localTodos, remoteTodos, locallyModifiedIds = new Set()) {
  console.log('🔄 Simple sync resolution:', {
    localCount: localTodos.length,
    remoteCount: remoteTodos.length,
    locallyModified: locallyModifiedIds.size
  })
  
  const conflicts = []
  const resolved = []
  const processedLocalIds = new Set()
  
  // Process all remote todos first (OneDrive is source of truth)
  for (const remote of remoteTodos) {
    const local = localTodos.find(t => t.id === remote.id)
    
    if (!local) {
      // New remote todo - just add it
      console.log(`Adding new remote todo ${remote.id}: "${remote.text}"`)
      resolved.push(remote)
    } else if (hasRealConflict(remote.id, local, remote, locallyModifiedIds)) {
      // Real conflict - needs user input
      console.log(`Conflict detected for todo ${remote.id}`)
      conflicts.push({
        id: remote.id,
        local: local,
        remote: remote,
        conflictType: 'field-conflict'
      })
      processedLocalIds.add(remote.id)
    } else {
      // No conflict - use remote version (OneDrive wins)
      console.log(`Using remote version for todo ${remote.id}: "${remote.text}"`)
      resolved.push(remote)
      processedLocalIds.add(remote.id)
    }
  }
  
  // Add any local-only todos that were modified locally
  for (const local of localTodos) {
    if (!processedLocalIds.has(local.id) && locallyModifiedIds.has(local.id)) {
      console.log(`Keeping local-only modified todo ${local.id}: "${local.text}"`)
      resolved.push(local)
    } else if (!processedLocalIds.has(local.id)) {
      console.log(`Skipping unmodified local-only todo ${local.id} (will be removed)`)
      // Don't add local-only todos that weren't modified - they should be removed
    }
  }
  
  console.log(`✅ Sync resolution complete: ${resolved.length} resolved, ${conflicts.length} conflicts`)
  
  return {
    resolved,
    conflicts,
    hasConflicts: conflicts.length > 0
  }
}

/**
 * Create conflict info for UI (compatible with existing conflict resolution component)
 */
export function createConflictInfo(conflicts, localTodos, remoteTodos) {
  if (!conflicts || conflicts.length === 0) {
    return null
  }
  
  // Convert to format expected by existing UI
  const formattedConflicts = conflicts.map(conflict => ({
    id: conflict.id,
    local: conflict.local,
    remote: conflict.remote,
    conflictingFields: getConflictingFields(conflict.local, conflict.remote)
  }))
  
  return {
    conflicts: formattedConflicts,
    local: localTodos,
    remote: remoteTodos,
    timestamp: Date.now(),
    type: 'simple-conflict'
  }
}

/**
 * Get list of fields that are different between two todos
 */
function getConflictingFields(local, remote) {
  const conflicts = []
  const userFields = ['text', 'completed', 'tags', 'priority', 'order']
  
  for (const field of userFields) {
    let localVal = local[field]
    let remoteVal = remote[field]
    
    // Normalize for comparison (same as todosAreEqual)
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