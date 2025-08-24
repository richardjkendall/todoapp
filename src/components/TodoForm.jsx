import { useState } from 'react'
import { Form, FormRow, InputContainer, Textarea, Button } from '../styles/TodoStyles'
import InputHelper from './InputHelper'
import { PlusIcon, SearchIcon } from './Icons'

const TodoForm = ({ onAddTodo, onSearch, searchActive, onClearSearch }) => {
  const [inputValue, setInputValue] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showHelper, setShowHelper] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
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
      if (!newIsSearchMode) {
        onClearSearch()
      }
    }
    
    // Live search if in search mode
    if (newIsSearchMode && value.length > 1) {
      const searchTerm = value.slice(1).trim()
      onSearch(searchTerm)
      setShowHelper(false) // Hide helper when search starts returning results
    } else if (!newIsSearchMode) {
      onClearSearch()
      // Show helper again when not in search mode and focused
      if (isFocused) {
        setShowHelper(true)
      }
    }
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
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              setShowHelper(true)
            }}
            onBlur={() => {
              setIsFocused(false)
              // Delay hiding to allow clicking on helper
              setTimeout(() => setShowHelper(false), 150)
            }}
            placeholder={isSearchMode ? "Search todos... Type /search to search by text, #tag for tags, !1-!5 for priority, completed:true/false for status" : "Add a new todo... Use #tags and !1-!5 for priority, or type / to search"}
            rows={1}
          />
          <InputHelper show={showHelper} isSearchMode={isSearchMode} />
        </InputContainer>
      </FormRow>
      <Button type="submit" title={isSearchMode ? 'Search' : 'Add Todo'}>
        {isSearchMode ? <SearchIcon /> : <PlusIcon />}
      </Button>
    </Form>
  )
}

export default TodoForm