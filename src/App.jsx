import { useState } from 'react'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import useTodos from './hooks/useTodos'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider, ToastRenderer } from './context/ToastContext'
import { SearchIcon } from './components/Icons'
import ExportImport from './components/ExportImport'
import StickyHeader from './components/StickyHeader'
import SyncStatus from './components/SyncStatus'
import ConflictResolution from './components/ConflictResolution'
import OfflineIndicator from './components/OfflineIndicator'
import LocalStorageWarning from './components/LocalStorageWarning'
import WelcomeScreen from './components/WelcomeScreen'
import Footer from './components/Footer'
import { 
  GlobalStyle, 
  Container, 
  ContentArea,
  SearchIndicator,
  getTheme
} from './styles/TodoStyles'

const AppContent = () => {
  const { isDark } = useTheme()
  const { isAuthenticated } = useAuth()
  const theme = getTheme(isDark)
  const [headerIsSticky, setHeaderIsSticky] = useState(false)
  
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
    importTodos,
    handleConflictResolution,
    syncStatus,
    conflictInfo,
    isOnline,
    queueStatus
  } = useTodos()

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      <OfflineIndicator 
        isOnline={isOnline}
        queueStatus={queueStatus}
      />
      <Container>
        <StickyHeader 
          actions={
            <>
              <SyncStatus 
                syncStatus={syncStatus}
                isOnline={isOnline}
                queueStatus={queueStatus}
                conflictInfo={conflictInfo}
              />
              <ExportImport todos={allTodos} onImportTodos={importTodos} />
            </>
          }
          forceSticky={searchActive}
          onStickyChange={setHeaderIsSticky}
        >
          <TodoForm 
            key="todo-form"
            onAddTodo={addTodo} 
            onSearch={searchTodos}
            onClearSearch={clearSearch}
            searchActive={searchActive}
          />
        </StickyHeader>
        
        {/* Only show warning if user has todos but isn't authenticated */}
        {!isAuthenticated && allTodos.length > 0 && <LocalStorageWarning />}
        
        {searchActive && (
          <SearchIndicator isEmpty={todos.length === 0}>
            <SearchIcon />
            {todos.length === 0 ? 
              'No todos found for your search' : 
              `Showing ${todos.length} of ${allTodos.length} todos`
            }
          </SearchIndicator>
        )}
        
        <ContentArea headerIsSticky={headerIsSticky}>
          {!isAuthenticated && allTodos.length === 0 ? (
            <WelcomeScreen />
          ) : (
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
          )}
        </ContentArea>
      </Container>

      <Footer />

      {/* Conflict Resolution Modal */}
      {conflictInfo && (
        <ConflictResolution
          conflictInfo={conflictInfo}
          onResolve={handleConflictResolution}
          isLoading={syncStatus === 'syncing'}
        />
      )}
      
      <ToastRenderer />
    </StyledThemeProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
