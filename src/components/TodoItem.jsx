import { useState, useEffect, useRef } from 'react'
import Tag from './Tag'
import { 
  TodoItem as StyledTodoItem, 
  TodoNumber,
  TodoLeftColumn,
  TodoContent, 
  TodoHeader,
  TodoTimestamp, 
  PriorityIndicator,
  TodoText, 
  TagContainer, 
  EditTextarea,
  TodoActions,
  ButtonGroup, 
  EditButton, 
  CancelButton, 
  DeleteButton,
  CompleteButton 
} from '../styles/TodoStyles'
import { getPriorityColor, DEFAULT_PRIORITY } from '../utils/priority'

const TodoItem = ({ 
  todo, 
  position,
  onToggleComplete, 
  onEditTodo, 
  onRemoveTag,
  onDeleteTodo,
  onReorderTodos,
  sortedTodos,
  allTodos,
  searchActive,
  extractTagsAndText,
  reconstructTextWithTags,
  formatTimestamp 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showDropIndicator, setShowDropIndicator] = useState(false)
  const textareaRef = useRef(null)

  const startEdit = () => {
    setIsEditing(true)
    setEditValue(reconstructTextWithTags(todo.text, todo.tags || [], todo.priority))
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const saveEdit = () => {
    onEditTodo(todo.id, editValue)
    setIsEditing(false)
    setEditValue('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const handleEditChange = (e) => {
    setEditValue(e.target.value)
    autoResize(e.target)
  }

  const autoResize = (textarea) => {
    textarea.style.height = 'auto'
    const lineHeight = 20 // approximate line height
    const maxHeight = lineHeight * 5 // 5 lines max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = newHeight + 'px'
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Auto-resize when editing starts with existing content
      setTimeout(() => autoResize(textareaRef.current), 0)
    }
  }, [isEditing])

  const handleRemoveTag = (tag) => {
    onRemoveTag(todo.id, tag)
  }

  // Drag and drop handlers
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', todo.id.toString())
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
    const draggedTodo = sortedTodos.find(t => t.id === draggedId)
    
    // Check if drop is allowed (same priority)
    const canDrop = draggedTodo && draggedTodo.priority === todo.priority && !todo.completed
    
    if (canDrop) {
      setShowDropIndicator(true)
      e.currentTarget.classList.remove('drag-over-invalid')
    } else {
      setShowDropIndicator(false)
      e.currentTarget.classList.add('drag-over-invalid')
    }
  }

  const handleDragLeave = (e) => {
    // Only hide indicator if leaving the element entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setShowDropIndicator(false)
      e.currentTarget.classList.remove('drag-over-invalid')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'))
    const targetIndex = sortedTodos.findIndex(t => t.id === todo.id)
    
    if (draggedId !== todo.id) {
      onReorderTodos(draggedId, targetIndex, sortedTodos)
    }
    
    setShowDropIndicator(false)
    e.currentTarget.classList.remove('drag-over-invalid')
  }

  const priorityColor = getPriorityColor(todo.priority || DEFAULT_PRIORITY)

  return (
    <StyledTodoItem 
      priorityColor={priorityColor}
      isDragging={isDragging}
      showDropIndicator={showDropIndicator}
      draggable={!isEditing && !todo.completed && !searchActive}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TodoLeftColumn>
        <TodoNumber>{position}</TodoNumber>
        <PriorityIndicator priorityColor={priorityColor}>
          !{todo.priority || DEFAULT_PRIORITY}
        </PriorityIndicator>
      </TodoLeftColumn>
      <TodoContent>
        <TodoHeader>
          <TodoTimestamp>
            {formatTimestamp(todo.timestamp)}
          </TodoTimestamp>
        </TodoHeader>
        {isEditing ? (
          <EditTextarea
            ref={textareaRef}
            value={editValue}
            onChange={handleEditChange}
            onKeyDown={handleKeyPress}
            placeholder="Edit todo... Use #tags and !1-!5 for priority (Ctrl+Enter to save)"
            rows={1}
            autoFocus
          />
        ) : (
          <>
            <TodoText 
              hasTags={todo.tags && todo.tags.length > 0}
              completed={todo.completed}
            >
              {todo.text}
            </TodoText>
            {todo.tags && todo.tags.length > 0 && (
              <TagContainer>
                {todo.tags.map((tag, index) => (
                  <Tag 
                    key={index} 
                    tag={tag} 
                    onDelete={handleRemoveTag}
                  />
                ))}
              </TagContainer>
            )}
          </>
        )}
      </TodoContent>
      <TodoActions>
        <ButtonGroup>
          {isEditing ? (
            <>
              <EditButton onClick={saveEdit} title="Save">💾</EditButton>
              <CancelButton onClick={cancelEdit} title="Cancel">❌</CancelButton>
            </>
          ) : (
            <>
              {todo.completed ? (
                <DeleteButton onClick={() => onDeleteTodo(todo.id)} title="Delete">🗑️</DeleteButton>
              ) : (
                <EditButton onClick={startEdit} title="Edit">✏️</EditButton>
              )}
              <CompleteButton 
                completed={todo.completed}
                onClick={() => onToggleComplete(todo.id)}
                title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {todo.completed ? '↩️' : '✅'}
              </CompleteButton>
            </>
          )}
        </ButtonGroup>
      </TodoActions>
    </StyledTodoItem>
  )
}

export default TodoItem