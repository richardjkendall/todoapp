import TodoItem from './TodoItem'
import { TodoList as StyledTodoList } from '../styles/TodoStyles'
import { DEFAULT_PRIORITY } from '../utils/priority'

const TodoList = ({ 
  todos, 
  allTodos,
  onToggleComplete, 
  onEditTodo, 
  onRemoveTag,
  onDeleteTodo,
  onReorderTodos,
  extractTagsAndText,
  reconstructTextWithTags,
  formatTimestamp,
  searchActive,
  disabled = false
}) => {
  const sortedTodos = [...todos].sort((a, b) => {
    // First: incomplete todos before completed
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    
    // Second: sort by priority (higher priority first)
    const aPriority = a.priority || DEFAULT_PRIORITY
    const bPriority = b.priority || DEFAULT_PRIORITY
    if (aPriority !== bPriority) {
      return bPriority - aPriority // Higher priority first
    }
    
    // Third: sort by manual order within priority group
    const aOrder = a.order || 0
    const bOrder = b.order || 0
    if (aOrder !== bOrder) {
      return aOrder - bOrder // Lower order first
    }
    
    // Fourth: sort by timestamp (newer first) as fallback
    const aTimestamp = a.timestamp || 0
    const bTimestamp = b.timestamp || 0
    return bTimestamp - aTimestamp
  })

  return (
    <StyledTodoList>
      {sortedTodos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          position={index + 1}
          onToggleComplete={onToggleComplete}
          onEditTodo={onEditTodo}
          onRemoveTag={onRemoveTag}
          onDeleteTodo={onDeleteTodo}
          onReorderTodos={onReorderTodos}
          sortedTodos={searchActive ? sortedTodos : sortedTodos}
          allTodos={allTodos}
          searchActive={searchActive}
          extractTagsAndText={extractTagsAndText}
          reconstructTextWithTags={reconstructTextWithTags}
          formatTimestamp={formatTimestamp}
          disabled={disabled}
        />
      ))}
    </StyledTodoList>
  )
}

export default TodoList