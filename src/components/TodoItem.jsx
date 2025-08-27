import { useState, useEffect, useRef } from 'react'
import Tag from './Tag'
import { EditIcon, CheckIcon, UndoIcon, DeleteIcon, SaveIcon, CancelIcon } from './Icons'
import { 
  TodoItem as StyledTodoItem, 
  SwipeContainer,
  SwipeContent,
  SwipeAction,
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
import useSwipeGesture from '../hooks/useSwipeGesture'

// Module-level variable to track currently dragged todo
let currentDraggedTodo = null

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
  const swipeContainerRef = useRef(null)

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
    // Store the dragged todo for cross-browser compatibility
    currentDraggedTodo = todo
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    // Clear the dragged todo reference
    currentDraggedTodo = null
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Use module-level variable for cross-browser compatibility
    const draggedTodo = currentDraggedTodo
    
    // Check if drop is allowed (same priority and both not completed)
    const canDrop = draggedTodo && 
                   draggedTodo.priority === todo.priority && 
                   !todo.completed && 
                   !draggedTodo.completed &&
                   draggedTodo.id !== todo.id // Can't drop on itself
    
    // Find the todo item container to apply classes
    const todoItemElement = e.currentTarget.closest('[data-todo-item]') || e.currentTarget.parentElement
    
    if (canDrop) {
      setShowDropIndicator(true)
      if (todoItemElement) {
        todoItemElement.classList.remove('drag-over-invalid')
      }
    } else {
      setShowDropIndicator(false)
      if (todoItemElement) {
        todoItemElement.classList.add('drag-over-invalid')
      }
    }
  }

  const handleDragLeave = (e) => {
    // Only hide indicator if leaving the element entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setShowDropIndicator(false)
      const todoItemElement = e.currentTarget.closest('[data-todo-item]') || e.currentTarget.parentElement
      if (todoItemElement) {
        todoItemElement.classList.remove('drag-over-invalid')
      }
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
    const todoItemElement = e.currentTarget.closest('[data-todo-item]') || e.currentTarget.parentElement
    if (todoItemElement) {
      todoItemElement.classList.remove('drag-over-invalid')
    }
  }

  const priorityColor = getPriorityColor(todo.priority || DEFAULT_PRIORITY)
  const timestampData = formatTimestamp(todo.timestamp, todo.priority)

  // Swipe gesture handlers
  const handleSwipeComplete = () => {
    if (!todo.completed) {
      onToggleComplete(todo.id)
    }
  }

  const handleSwipeDelete = () => {
    if (todo.completed) {
      onDeleteTodo(todo.id)
    }
  }

  // Configure swipe gestures based on todo state
  const swipeConfig = {
    threshold: 80,
    velocityThreshold: 0.3,
    preventDefaultThreshold: 15,
    restoreSpeed: 250,
    maxVerticalMovement: 30
  }

  const {
    swipeOffset,
    actionRevealed,
    isAnimating,
    touchHandlers,
    resetSwipe
  } = useSwipeGesture(
    todo.completed ? handleSwipeDelete : null, // Only allow delete swipe for completed todos
    !todo.completed ? handleSwipeComplete : null, // Only allow complete swipe for incomplete todos
    swipeConfig
  )

  // Disable drag and drop during active swipe animation or when editing/searching
  const isDragDisabled = isEditing || searchActive || (isAnimating && Math.abs(swipeOffset) > 50)

  // Add non-passive touchmove listener to prevent scroll interference
  useEffect(() => {
    const container = swipeContainerRef.current
    if (!container) return

    const handleTouchMove = (e) => {
      touchHandlers.onTouchMove(e)
    }

    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [touchHandlers])

  return (
    <StyledTodoItem 
      priorityColor={priorityColor}
      isDragging={isDragging}
      showDropIndicator={showDropIndicator}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-todo-item={todo.id}
    >
      <SwipeContainer
        ref={swipeContainerRef}
        onTouchStart={touchHandlers.onTouchStart}
        onTouchEnd={touchHandlers.onTouchEnd}
        onTouchCancel={touchHandlers.onTouchCancel}
      >
        {/* Swipe action backgrounds */}
        {!todo.completed && (
          <SwipeAction 
            direction="right" 
            revealed={actionRevealed === 'right'}
          >
            <CheckIcon />
          </SwipeAction>
        )}
        {todo.completed && (
          <SwipeAction 
            direction="left" 
            revealed={actionRevealed === 'left'}
          >
            <DeleteIcon />
          </SwipeAction>
        )}
        
        <SwipeContent 
          offset={swipeOffset} 
          isAnimating={isAnimating}
          draggable={!isDragDisabled}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <TodoLeftColumn>
            <TodoNumber>{position}</TodoNumber>
            <PriorityIndicator priorityColor={priorityColor}>
              !{todo.priority || DEFAULT_PRIORITY}
            </PriorityIndicator>
          </TodoLeftColumn>
          <TodoContent>
            <TodoHeader>
              <TodoTimestamp highlightLevel={timestampData.highlightLevel}>
                {timestampData.displayText}
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
                  <EditButton onClick={saveEdit} title="Save"><SaveIcon /></EditButton>
                  <CancelButton onClick={cancelEdit} title="Cancel"><CancelIcon /></CancelButton>
                </>
              ) : (
                <>
                  {todo.completed ? (
                    <DeleteButton onClick={() => onDeleteTodo(todo.id)} title="Delete"><DeleteIcon /></DeleteButton>
                  ) : (
                    <EditButton onClick={startEdit} title="Edit"><EditIcon /></EditButton>
                  )}
                  <CompleteButton 
                    completed={todo.completed}
                    onClick={() => onToggleComplete(todo.id)}
                    title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {todo.completed ? <UndoIcon /> : <CheckIcon />}
                  </CompleteButton>
                </>
              )}
            </ButtonGroup>
          </TodoActions>
        </SwipeContent>
      </SwipeContainer>
    </StyledTodoItem>
  )
}

export default TodoItem