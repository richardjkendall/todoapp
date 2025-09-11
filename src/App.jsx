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
import CameraCapture from './components/CameraCapture'
import { useSharedTodo } from './hooks/useSharedTodo'
import { 
  GlobalStyle, 
  Container, 
  ContentArea,
  SearchIndicator,
  getTheme
} from './styles/TodoStyles'
import styled from 'styled-components'

// Initial sync loader component
const InitialSyncContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  min-height: 300px;
`

const SyncSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme.colors.border};
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const SyncText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const SyncSubtext = styled.div`
  color: ${props => props.theme.colors.text.tertiary};
  font-size: ${props => props.theme.typography.fontSize.xs};
`

const InitialSyncLoader = ({ isAuthLoading, isLoaded, isInitialSyncing }) => (
  <InitialSyncContainer>
    <SyncSpinner />
    <SyncText>
      {isAuthLoading ? 'Loading...' : 
       !isLoaded ? 'Loading your todos...' : 
       isInitialSyncing ? 'Syncing with OneDrive...' : 
       'Loading...'}
    </SyncText>
    <SyncSubtext>
      {isAuthLoading ? 'Checking your account' :
       !isLoaded ? 'Getting your data ready' :
       isInitialSyncing ? 'Loading your latest todos' :
       'Please wait'}
    </SyncSubtext>
  </InitialSyncContainer>
)

const AppContent = () => {
  const { isDark } = useTheme()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const theme = getTheme(isDark)
  const [headerIsSticky, setHeaderIsSticky] = useState(false)
  const [quickFilteredTodos, setQuickFilteredTodos] = useState(null)
  const [activeQuickFilters, setActiveQuickFilters] = useState(null)
  const [filterStats, setFilterStats] = useState(null)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [onPhotoCapture, setOnPhotoCapture] = useState(null)
  const [isInitialSyncing, setIsInitialSyncing] = useState(false)
  
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
    queueStatus,
    isLoaded
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

  // Handle camera modal
  const handleShowCamera = (photoCallback) => {
    setOnPhotoCapture(() => photoCallback)
    setShowCameraCapture(true)
  }

  const handleCameraClose = () => {
    setShowCameraCapture(false)
    setOnPhotoCapture(null)
  }

  const handlePhotoCapture = (photoBlob) => {
    if (onPhotoCapture) {
      onPhotoCapture(photoBlob)
    }
    handleCameraClose()
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

  // Track initial sync state - show loading only during first sync after auth when no data exists
  useEffect(() => {
    // Start loading when authenticated user starts syncing, app is loaded, but no data exists yet
    if (isAuthenticated && isLoaded && syncStatus === 'syncing' && !isInitialSyncing && allTodos.length === 0) {
      setIsInitialSyncing(true)
    }
    
    // Stop loading when sync completes (success or error), user logs out, or we have data to show
    if (isInitialSyncing && (syncStatus === 'synced' || syncStatus === 'error' || !isAuthenticated || allTodos.length > 0)) {
      setIsInitialSyncing(false)
    }
  }, [syncStatus, isAuthenticated, isLoaded, isInitialSyncing, allTodos.length])

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
            onShowCamera={handleShowCamera}
            disabled={syncStatus === 'syncing'}
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
          {/* Show loading during initial app/auth/data loading */}
          {isAuthLoading || !isLoaded || isInitialSyncing ? (
            <InitialSyncLoader 
              isAuthLoading={isAuthLoading}
              isLoaded={isLoaded}
              isInitialSyncing={isInitialSyncing}
            />
          ) : !isAuthenticated && allTodos.length === 0 ? (
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
              disabled={syncStatus === 'syncing'}
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
      
      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <CameraCapture
          onPhotoCapture={handlePhotoCapture}
          onClose={handleCameraClose}
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
