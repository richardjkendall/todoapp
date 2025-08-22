import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import useTodos from './hooks/useTodos'
import { GlobalStyle, Container, Title } from './styles/TodoStyles'

function App() {
  const {
    todos,
    allTodos,
    addTodo,
    toggleComplete,
    editTodo,
    removeTag,
    deleteTodo,
    reorderTodos,
    extractTagsAndText,
    reconstructTextWithTags,
    formatTimestamp,
    searchQuery,
    searchTodos,
    clearSearch,
    searchActive
  } = useTodos()

  return (
    <>
      <GlobalStyle />
      <Container>
        <Title>Todo List</Title>
        <TodoForm 
          onAddTodo={addTodo} 
          onSearch={searchTodos}
          onClearSearch={clearSearch}
          searchActive={searchActive}
        />
        {searchActive && (
          <div style={{
            padding: '0.5rem 0',
            color: '#6c757d',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {todos.length === 0 ? 
              'No todos found' : 
              `Showing ${todos.length} of ${allTodos.length} todos`
            }
          </div>
        )}
        <TodoList 
          todos={todos}
          allTodos={allTodos}
          onToggleComplete={toggleComplete}
          onEditTodo={editTodo}
          onRemoveTag={removeTag}
          onDeleteTodo={deleteTodo}
          onReorderTodos={reorderTodos}
          extractTagsAndText={extractTagsAndText}
          reconstructTextWithTags={reconstructTextWithTags}
          formatTimestamp={formatTimestamp}
          searchActive={searchActive}
        />
      </Container>
    </>
  )
}

export default App
