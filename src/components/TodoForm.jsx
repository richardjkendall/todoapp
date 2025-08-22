import { useState } from 'react'
import { Form, FormRow, Textarea, Button } from '../styles/TodoStyles'

const TodoForm = ({ onAddTodo, onSearch, searchActive, onClearSearch }) => {
  const [inputValue, setInputValue] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
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
    } else if (!newIsSearchMode) {
      onClearSearch()
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
        <Textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isSearchMode ? "Search todos... Use #tags, !priority, completed:true/false (Ctrl+Enter)" : "Add todo or /search... Use #tags and !1-!5 for priority (Ctrl+Enter to submit)"}
          rows={1}
        />
      </FormRow>
      <Button type="submit">{isSearchMode ? 'Search' : 'Add'}</Button>
    </Form>
  )
}

export default TodoForm