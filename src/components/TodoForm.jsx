import { useState, useRef, useEffect } from 'react'
import { Form, FormRow, InputContainer, Textarea, Button } from '../styles/TodoStyles'
import InputHelper from './InputHelper'
import PhotoButton from './PhotoButton'
import LongPressButton from './LongPressButton'
import { PlusIcon, SearchIcon } from './Icons'
import { isMobileDevice } from '../utils/deviceUtils'

const TodoForm = ({ onAddTodo, onSearch, searchActive, onClearSearch, onShowCamera, disabled = false }) => {
  const [inputValue, setInputValue] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showHelper, setShowHelper] = useState(false)
  const textareaRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (disabled) return // Prevent submit when disabled
    
    if (inputValue.trim()) {
      setShowHelper(false)
      if (isSearchMode) {
        // Extract search term (remove the /)
        const searchTerm = inputValue.slice(1).trim()
        onSearch(searchTerm)
      } else {
        onAddTodo(inputValue.trim())
        setInputValue('')
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      setShowHelper(false)
      handleSubmit(e)
    } else if (e.key === 'Escape') {
      if (isSearchMode) {
        setInputValue('')
        setIsSearchMode(false)
        onClearSearch()
      }
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    autoResize(e.target)
    
    // Detect search mode
    const newIsSearchMode = value.startsWith('/')
    if (newIsSearchMode !== isSearchMode) {
      setIsSearchMode(newIsSearchMode)
    }
    
    // Live search if in search mode
    if (newIsSearchMode) {
      if (value.length > 1) {
        const searchTerm = value.slice(1).trim()
        onSearch(searchTerm)
        setShowHelper(false) // Hide helper when search starts returning results
      } else {
        // User just typed '/' - don't search yet, but don't clear either
        setShowHelper(true)
      }
    } else {
      onClearSearch()
      // Show helper again when not in search mode and focused
      if (isFocused) {
        setShowHelper(true)
      }
    }
  }

  const handlePhotoAdded = (markdownRef) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const currentValue = inputValue
    
    // Insert photo markdown at cursor position
    const newValue = currentValue.slice(0, cursorPos) + markdownRef + ' ' + currentValue.slice(cursorPos)
    setInputValue(newValue)
    
    // Auto resize after adding photo
    setTimeout(() => {
      autoResize(textarea)
      // Restore cursor position after the inserted text
      textarea.focus()
      const newCursorPos = cursorPos + markdownRef.length + 1
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const autoResize = (textarea) => {
    textarea.style.height = 'auto'
    const lineHeight = 20 // approximate line height
    const maxHeight = lineHeight * 5 // 5 lines max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = newHeight + 'px'
  }

  return (
    <Form onSubmit={handleSubmit}>
      <FormRow>
        <InputContainer>
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              setShowHelper(true)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              // Delay hiding to allow clicking on helper
              setTimeout(() => setShowHelper(false), 150)
            }}
            placeholder={disabled ? "Syncing..." : isSearchMode ? "Search todos... Type /search to search by text, #tag for tags, !1-!5 for priority, completed:true/false for status" : "Add a new todo... Use #tags and !1-!5 for priority, or type / to search"}
            rows={1}
            disabled={disabled}
          />
          <InputHelper show={showHelper} isSearchMode={isSearchMode} inputRef={textareaRef} />
        </InputContainer>
      </FormRow>
      {/* Mobile: Long press button, Desktop: Separate buttons */}
      {isMobileDevice() ? (
        <LongPressButton
          onPhotoAdded={handlePhotoAdded}
          onShowCamera={onShowCamera}
          isSearchMode={isSearchMode}
          disabled={disabled}
        />
      ) : (
        <>
          <PhotoButton onPhotoAdded={handlePhotoAdded} disabled={disabled || isSearchMode} onShowCamera={onShowCamera} />
          <Button type="submit" title={isSearchMode ? 'Search' : 'Add Todo'} disabled={disabled}>
            {isSearchMode ? <SearchIcon /> : <PlusIcon />}
          </Button>
        </>
      )}
    </Form>
  )
}

export default TodoForm