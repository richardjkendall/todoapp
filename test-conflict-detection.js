// Simple test script for the new conflict detection system
import { smartMergeTodos, detectConflicts, autoResolveConflicts } from './src/utils/conflictDetection.js'

// Test data
const localTodos = [
  {
    id: 1,
    text: 'Buy groceries',
    completed: false,
    tags: ['shopping', 'urgent'],
    priority: 2,
    timestamp: Date.now() - 5000,
    lastModified: Date.now() - 3000
  },
  {
    id: 2,
    text: 'Walk the dog',
    completed: true,
    tags: ['pets'],
    priority: 3,
    timestamp: Date.now() - 10000,
    lastModified: Date.now() - 1000
  },
  {
    id: 3,
    text: 'Local only todo',
    completed: false,
    tags: ['local'],
    priority: 1,
    timestamp: Date.now(),
    lastModified: Date.now()
  }
]

const remoteTodos = [
  {
    id: 1,
    text: 'Buy groceries and milk', // Text conflict
    completed: false,
    tags: ['shopping', 'food'], // Tag conflict 
    priority: 2,
    timestamp: Date.now() - 5000,
    lastModified: Date.now() - 2000 // More recent
  },
  {
    id: 2,
    text: 'Walk the dog',
    completed: false, // Completion status conflict
    tags: ['pets'],
    priority: 4, // Priority conflict
    timestamp: Date.now() - 10000,
    lastModified: Date.now() - 2000 // Older than local
  },
  {
    id: 4,
    text: 'Remote only todo',
    completed: false,
    tags: ['remote'],
    priority: 1,
    timestamp: Date.now(),
    lastModified: Date.now()
  }
]

console.log('Testing field-based conflict detection...\n')

// Test 1: Basic conflict detection
console.log('=== Test 1: Basic Conflict Detection ===')
const { conflicts, safeToMerge } = detectConflicts(localTodos, remoteTodos)
console.log(`Found ${conflicts.length} conflicts and ${safeToMerge.length} safe merges`)

conflicts.forEach((conflict, i) => {
  console.log(`\nConflict ${i + 1} (Todo ID: ${conflict.id}):`)
  conflict.conflictingFields.forEach(field => {
    console.log(`  - ${field.field}: "${field.localValue}" vs "${field.remoteValue}"`)
  })
})

safeToMerge.forEach((merge, i) => {
  console.log(`\nSafe merge ${i + 1}: ${merge.reason}`)
  console.log(`  Todo: "${merge.todo.text}" from ${merge.source}`)
})

// Test 2: Auto-resolution
console.log('\n=== Test 2: Auto-Resolution ===')
const { resolved, needsUserInput } = autoResolveConflicts(conflicts, 'additive')
console.log(`Auto-resolved: ${resolved.length}, Need user input: ${needsUserInput.length}`)

resolved.forEach((resolution, i) => {
  console.log(`\nAuto-resolved ${i + 1}: ${resolution.reason}`)
  console.log(`  Result: "${resolution.todo.text}"`)
})

needsUserInput.forEach((conflict, i) => {
  console.log(`\nUser input needed ${i + 1}:`)
  conflict.conflictingFields.forEach(field => {
    console.log(`  - ${field.field}: "${field.localValue}" vs "${field.remoteValue}"`)
  })
})

// Test 3: Full smart merge
console.log('\n=== Test 3: Smart Merge ===')
const mergeResult = smartMergeTodos(localTodos, remoteTodos, 'additive')
console.log('Merge summary:', mergeResult.summary)
console.log(`Has conflicts requiring user input: ${mergeResult.hasConflicts}`)

if (mergeResult.hasConflicts) {
  console.log('\nConflicts needing resolution:')
  mergeResult.conflictsNeedingResolution.forEach((conflict, i) => {
    console.log(`  ${i + 1}. Todo: "${conflict.local.text || conflict.remote.text}"`)
    conflict.conflictingFields.forEach(field => {
      console.log(`     Field "${field.field}": "${field.localValue}" vs "${field.remoteValue}"`)
    })
  })
} else {
  console.log('\nAll conflicts auto-resolved! Merged todos:')
  mergeResult.mergedTodos.forEach((todo, i) => {
    console.log(`  ${i + 1}. "${todo.text}" (completed: ${todo.completed}, tags: [${todo.tags?.join(', ')}])`)
  })
}

console.log('\nTest completed!')