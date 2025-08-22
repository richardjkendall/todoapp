export const PRIORITY_LABELS = {
  5: 'Highest',
  4: 'High', 
  3: 'Medium',
  2: 'Low',
  1: 'Lowest'
}

export const PRIORITY_COLORS = {
  5: '#dc3545', // Red
  4: '#fd7e14', // Orange
  3: '#007bff', // Blue  
  2: '#28a745', // Green
  1: '#6c757d'  // Gray
}

export const DEFAULT_PRIORITY = 3

export const getPriorityLabel = (priority) => {
  return PRIORITY_LABELS[priority] || PRIORITY_LABELS[DEFAULT_PRIORITY]
}

export const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS[DEFAULT_PRIORITY]
}

export const getPriorityOptions = () => {
  return Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
    value: parseInt(value),
    label: `${value} - ${label}`
  })).reverse() // Show highest priority first
}