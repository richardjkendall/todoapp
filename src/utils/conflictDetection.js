/**
 * Field-based conflict detection system
 * Only detects conflicts on user-editable fields and provides smart auto-resolution
 */
import { conflictLogger } from './logger'

/**
 * Deep equality check for complex values
 */
function deepEqual(a, b) {
  if (a === b) return true
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, i) => deepEqual(val, b[i]))
  }
  
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    return keysA.every(key => deepEqual(a[key], b[key]))
  }
  
  return false
}

/**
 * Normalize field values for consistent comparison
 */
function normalizeFieldValue(value, field) {
  switch (field) {
    case 'text':
      return (value || '').trim()
    case 'completed':
      return Boolean(value)
    case 'tags':
      return (value || []).sort() // Sort for consistent comparison
    case 'priority':
      return value || 3 // Default priority
    case 'order':
      return value || 0 // Default order
    default:
      return value
  }
}

/**
 * Compare user-editable fields between two todos
 */
function compareUserFields(local, remote) {
  const conflicts = []
  
  // Only compare user-editable fields
  const userFields = ['text', 'completed', 'tags', 'priority', 'order']
  
  for (const field of userFields) {
    const localValue = local[field]
    const remoteValue = remote[field]
    
    // Normalize values for comparison
    const localNormalized = normalizeFieldValue(localValue, field)
    const remoteNormalized = normalizeFieldValue(remoteValue, field)
    
    if (!deepEqual(localNormalized, remoteNormalized)) {
      conflicts.push({
        field,
        localValue: localValue,
        remoteValue: remoteValue,
        localNormalized,
        remoteNormalized
      })
    }
  }
  
  return conflicts
}

/**
 * Main conflict detection function
 */
export function detectConflicts(localTodos, remoteTodos) {
  const conflicts = []
  const safeToMerge = []
  
  // Create maps for efficient lookup by ID
  const localMap = new Map(localTodos.map(todo => [todo.id, todo]))
  const remoteMap = new Map(remoteTodos.map(todo => [todo.id, todo]))
  
  // Get all unique todo IDs
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()])
  
  for (const id of allIds) {
    const local = localMap.get(id)
    const remote = remoteMap.get(id)
    
    if (!local && remote) {
      // Todo exists only in remote - safe to add
      safeToMerge.push({ 
        type: 'add', 
        todo: remote, 
        source: 'remote',
        reason: 'Todo only exists in OneDrive'
      })
    } else if (local && !remote) {
      // Todo exists only in local - safe to add
      safeToMerge.push({ 
        type: 'add', 
        todo: local, 
        source: 'local',
        reason: 'Todo only exists locally'
      })
    } else {
      // Todo exists in both - check for field conflicts
      const fieldConflicts = compareUserFields(local, remote)
      
      if (fieldConflicts.length > 0) {
        conflicts.push({
          id,
          local,
          remote,
          conflictingFields: fieldConflicts
        })
      } else {
        // Same todo, no conflicts - use most recently modified
        const localTime = local.lastModified || local.timestamp || 0
        const remoteTime = remote.lastModified || remote.timestamp || 0
        const winner = localTime > remoteTime ? local : remote
        
        safeToMerge.push({ 
          type: 'update', 
          todo: winner, 
          source: localTime > remoteTime ? 'local' : 'remote',
          reason: 'No field conflicts, using most recent version'
        })
      }
    }
  }
  
  return { conflicts, safeToMerge }
}

/**
 * Check if a conflict can be auto-resolved
 */
function canAutoResolve(conflict) {
  const { conflictingFields } = conflict
  
  // Auto-resolvable fields - text changes always require user input
  const autoResolvableFields = ['completed', 'tags', 'priority', 'order']
  
  // Auto-resolve if ALL conflicting fields are auto-resolvable
  return conflictingFields.every(fieldConflict => 
    autoResolvableFields.includes(fieldConflict.field)
  )
}

/**
 * Automatically resolve a conflict based on strategy
 */
function resolveAutomatically(conflict, strategy = 'additive') {
  const { local, remote, conflictingFields } = conflict
  
  switch (strategy) {
    case 'additive':
      // For tags, merge them; for others use newer
      const resolved = { ...local }
      
      for (const fieldConflict of conflictingFields) {
        if (fieldConflict.field === 'tags') {
          // Merge tags from both versions
          const localTags = local.tags || []
          const remoteTags = remote.tags || []
          const allTags = [...localTags, ...remoteTags]
          resolved.tags = [...new Set(allTags)] // Remove duplicates
          resolved.lastModified = Math.max(
            local.lastModified || 0, 
            remote.lastModified || 0
          )
        } else if (fieldConflict.field === 'order') {
          // For order conflicts, use the average of both values
          const localOrder = local.order || 0
          const remoteOrder = remote.order || 0
          resolved.order = Math.floor((localOrder + remoteOrder) / 2)
          resolved.lastModified = Math.max(
            local.lastModified || 0, 
            remote.lastModified || 0
          )
        } else {
          // Use more recent value for other fields
          const localTime = local.lastModified || local.timestamp || 0
          const remoteTime = remote.lastModified || remote.timestamp || 0
          
          if (localTime > remoteTime) {
            resolved[fieldConflict.field] = fieldConflict.localValue
            resolved.lastModified = localTime
          } else {
            resolved[fieldConflict.field] = fieldConflict.remoteValue
            resolved.lastModified = remoteTime
          }
        }
      }
      
      return resolved
      
    case 'timestamp-based':
      // Use the more recently modified version entirely
      const localTime = local.lastModified || local.timestamp || 0
      const remoteTime = remote.lastModified || remote.timestamp || 0
      return localTime > remoteTime ? local : remote
      
    default:
      return resolveAutomatically(conflict, 'additive')
  }
}

/**
 * Auto-resolve conflicts where possible
 */
export function autoResolveConflicts(conflicts, strategy = 'additive') {
  const resolved = []
  const needsUserInput = []
  
  for (const conflict of conflicts) {
    if (canAutoResolve(conflict)) {
      const resolvedTodo = resolveAutomatically(conflict, strategy)
      resolved.push({
        type: 'auto-resolve',
        todo: resolvedTodo,
        originalConflict: conflict,
        strategy,
        reason: `Auto-resolved ${conflict.conflictingFields.map(f => f.field).join(', ')} conflict`
      })
    } else {
      needsUserInput.push(conflict)
    }
  }
  
  return { resolved, needsUserInput }
}

/**
 * Merge todos with conflict detection and auto-resolution
 */
export function smartMergeTodos(localTodos, remoteTodos, autoResolveStrategy = 'additive') {
  conflictLogger.debug('Starting smart merge', { 
    localCount: localTodos.length, 
    remoteCount: remoteTodos.length,
    strategy: autoResolveStrategy
  })
  
  // Step 1: Detect conflicts
  const { conflicts, safeToMerge } = detectConflicts(localTodos, remoteTodos)
  
  conflictLogger.info('Conflict detection complete', {
    conflictsFound: conflicts.length,
    safeToMerge: safeToMerge.length
  })
  
  // Step 2: Auto-resolve conflicts where possible
  const { resolved, needsUserInput } = autoResolveConflicts(conflicts, autoResolveStrategy)
  
  conflictLogger.info('Auto-resolution complete', {
    autoResolved: resolved.length,
    needsUserInput: needsUserInput.length
  })
  
  // Step 3: Build merged todo list
  const mergedTodos = []
  const processedIds = new Set()
  
  // Add safely merged todos
  safeToMerge.forEach(item => {
    mergedTodos.push(item.todo)
    processedIds.add(item.todo.id)
  })
  
  // Add auto-resolved todos
  resolved.forEach(item => {
    mergedTodos.push(item.todo)
    processedIds.add(item.todo.id)
  })
  
  // Add todos that weren't involved in any conflicts
  const allTodos = [...localTodos, ...remoteTodos]
  allTodos.forEach(todo => {
    if (!processedIds.has(todo.id)) {
      mergedTodos.push(todo)
      processedIds.add(todo.id)
    }
  })
  
  return {
    mergedTodos,
    hasConflicts: needsUserInput.length > 0,
    conflictsNeedingResolution: needsUserInput,
    autoResolvedCount: resolved.length,
    safelyMergedCount: safeToMerge.length,
    summary: {
      total: mergedTodos.length,
      conflicts: needsUserInput.length,
      autoResolved: resolved.length,
      safelyMerged: safeToMerge.length
    }
  }
}

/**
 * Create conflict info for the UI
 */
export function createConflictInfo(conflictsNeedingResolution, localTodos, remoteTodos, localModified, remoteModified) {
  if (!conflictsNeedingResolution || conflictsNeedingResolution.length === 0) {
    return null
  }
  
  return {
    conflicts: conflictsNeedingResolution,
    local: localTodos,
    remote: remoteTodos,
    localModified,
    remoteModified,
    timestamp: Date.now(),
    type: 'field-based' // Indicates this is the new conflict system
  }
}