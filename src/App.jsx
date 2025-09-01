import { useState, useEffect } from 'react'
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
import SharedTodoModal from './components/SharedTodoModal'
import QuickFilters from './components/QuickFilters'
import NotificationSettingsModal from './components/NotificationSettingsModal'
import NotificationToggle from './components/NotificationToggle'
import { useSharedTodo } from './hooks/useSharedTodo'
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
  const [quickFilteredTodos, setQuickFilteredTodos] = useState(null)
  const [activeQuickFilters, setActiveQuickFilters] = useState(null)
  const [filterStats, setFilterStats] = useState(null)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  
  // Handle shared todos from URLs
  const { sharedTodo, clearSharedTodo, acceptSharedTodo } = useSharedTodo()
  
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

  // Handle shared todo actions
  const handleAcceptSharedTodo = () => {
    const todo = acceptSharedTodo()
    if (todo) {
      // Reconstruct the todo text with tags and priority
      const todoText = reconstructTextWithTags(todo.text, todo.tags || [], todo.priority)
      // Add the shared todo to the list
      addTodo(todoText)
    }
  }

  const handleDeclineSharedTodo = () => {
    clearSharedTodo()
  }

  // Handle quick filter changes
  const handleQuickFilterChange = (filteredTodos, activeFilters, stats) => {
    setQuickFilteredTodos(filteredTodos)
    setActiveQuickFilters(activeFilters)
    setFilterStats(stats)
  }

  // Clear quick filters when regular search becomes active
  const handleSearch = (query) => {
    if (query && (quickFilteredTodos || activeQuickFilters)) {
      setQuickFilteredTodos(null)
      setActiveQuickFilters(null)
      setFilterStats(null)
      // Also clear persisted quick filters when search starts
      localStorage.removeItem('quickFilters')
    }
    searchTodos(query)
  }

  // Clear quick filters when regular search is cleared
  const handleClearSearch = () => {
    clearSearch()
    // Don't automatically clear quick filters - let user manage them independently
  }

  // Handle notification settings toggle
  const handleNotificationToggle = () => {
    setShowNotificationSettings(!showNotificationSettings)
  }

  // Handle notification filter requests
  const handleNotificationFilter = (filterParams) => {
    // Clear any existing search first
    if (searchActive) {
      handleClearSearch()
    }
    
    // Clear quick filters and set new one based on notification
    setQuickFilteredTodos(null)
    setActiveQuickFilters(null)
    setFilterStats(null)
    
    // Trigger appropriate filter based on notification action
    const filterMap = {
      'aged': 'Old items',
      'high-priority': 'High priority'
    }
    
    const filterName = filterMap[filterParams]
    if (filterName) {
      // Simulate clicking the appropriate quick filter
      setTimeout(() => {
        const filterEvent = new CustomEvent('quick-filter-select', {
          detail: { filterName, filterParams }
        })
        window.dispatchEvent(filterEvent)
      }, 100)
    }
  }

  // Determine which todos to display
  const displayTodos = searchActive 
    ? todos  // Regular search takes precedence
    : (quickFilteredTodos || todos)  // Use quick filtered todos if available, otherwise all todos

  // Listen for notification filter requests and service worker messages
  useEffect(() => {
    // Handle custom notification filter events
    const handleNotificationFilterEvent = (event) => {
      if (event.detail?.filterParams) {
        handleNotificationFilter(event.detail.filterParams)
      }
    }

    // Handle service worker messages from notifications
    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { filterParams, action, notificationType } = event.data
        
        if (filterParams) {
          handleNotificationFilter(filterParams)
        }
        
        // Log the notification interaction
        console.log('Notification action received:', {
          action,
          notificationType,
          filterParams
        })
      }
    }

    // Add event listeners
    window.addEventListener('notification-filter-request', handleNotificationFilterEvent)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)

    // Cleanup
    return () => {
      window.removeEventListener('notification-filter-request', handleNotificationFilterEvent)
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [searchActive, handleClearSearch])

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
              <NotificationToggle 
                onToggle={handleNotificationToggle}
                isVisible={showNotificationSettings}
                isCompact={headerIsSticky}
              />
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
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            searchActive={searchActive}
          />
        </StickyHeader>
        
        {/* Only show warning if user has todos but isn't authenticated */}
        {!isAuthenticated && allTodos.length > 0 && <LocalStorageWarning />}
        
        {searchActive && (
          <SearchIndicator isEmpty={displayTodos.length === 0}>
            <SearchIcon />
            {displayTodos.length === 0 ? 
              'No todos found for your search' : 
              `Showing ${displayTodos.length} of ${allTodos.length} todos`
            }
          </SearchIndicator>
        )}
        
        {/* Quick Filters - show when not in search mode */}
        <QuickFilters
          todos={allTodos}
          onFilterChange={handleQuickFilterChange}
          searchActive={searchActive}
          filterStats={filterStats}
        />
        
        
        <ContentArea headerIsSticky={headerIsSticky}>
          {!isAuthenticated && allTodos.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <TodoList 
              todos={displayTodos}
              allTodos={allTodos}
              onToggleComplete={toggleComplete}
              onEditTodo={editTodo}
              onRemoveTag={removeTag}
              onDeleteTodo={deleteTodo}
              onReorderTodos={reorderTodos}
              extractTagsAndText={extractTagsAndText}
              reconstructTextWithTags={reconstructTextWithTags}
              formatTimestamp={formatTimestamp}
              searchActive={searchActive || Boolean(quickFilteredTodos)}
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
      
      {/* Shared Todo Modal */}
      {sharedTodo && (
        <SharedTodoModal
          sharedTodo={sharedTodo}
          onAccept={handleAcceptSharedTodo}
          onDecline={handleDeclineSharedTodo}
        />
      )}
      
      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isVisible={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
      
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
