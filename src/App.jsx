import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import useTodos from './hooks/useTodos'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { SearchIcon } from './components/Icons'
import ExportImport from './components/ExportImport'
import StickyHeader from './components/StickyHeader'
import { 
  GlobalStyle, 
  Container, 
  ContentArea,
  SearchIndicator,
  getTheme
} from './styles/TodoStyles'

const AppContent = () => {
  const { isDark } = useTheme()
  const theme = getTheme(isDark)
  
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
    searchTodos,
    clearSearch,
    searchActive,
    importTodos
  } = useTodos()

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      <Container>
        <StickyHeader 
          actions={<ExportImport todos={allTodos} onImportTodos={importTodos} />}
          forceSticky={searchActive}
        >
          <TodoForm 
            key="todo-form"
            onAddTodo={addTodo} 
            onSearch={searchTodos}
            onClearSearch={clearSearch}
            searchActive={searchActive}
          />
        </StickyHeader>
        
        {searchActive && (
          <SearchIndicator isEmpty={todos.length === 0}>
            <SearchIcon />
            {todos.length === 0 ? 
              'No todos found for your search' : 
              `Showing ${todos.length} of ${allTodos.length} todos`
            }
          </SearchIndicator>
        )}
        
        <ContentArea>
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
        </ContentArea>
      </Container>
    </StyledThemeProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
