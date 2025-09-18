import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { useQuickFilters } from './hooks/useQuickFilters'
import { appLogger } from './utils/logger'
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
  const [activeQuickFilters, setActiveQuickFilters] = useState(new Set())
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

  // Get quick filter functions  
  const { quickFilterOptions, filterTodosByAge, filterTodosByPriorityGroup } = useQuickFilters(allTodos)
  
  // Apply filters to get filtered todos
  const filteredTodos = useMemo(() => {
    if (activeQuickFilters.size === 0) {
      return allTodos
    }
    
    let result = allTodos
    const activeOptions = quickFilterOptions.filter(opt => activeQuickFilters.has(opt.id))
    
    activeOptions.forEach(filterOption => {
      if (filterOption.type === 'tag') {
        const tag = filterOption.label.substring(1) // Remove #
        result = result.filter(todo => 
          todo.tags && todo.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        )
      } else if (filterOption.type === 'age') {
        const ageType = filterOption.id === 'old-items' ? 'old' : 'very-old'
        result = filterTodosByAge(result, ageType)
      } else if (filterOption.type === 'priority') {
        const priorityGroup = filterOption.id === 'high-priority' ? 'high' : 'low'
        result = filterTodosByPriorityGroup(result, priorityGroup)
      } else if (filterOption.type === 'status') {
        const completed = filterOption.id === 'completed'
        result = result.filter(todo => todo.completed === completed)
      }
    })
    
    return result
  }, [allTodos, activeQuickFilters, quickFilterOptions, filterTodosByAge, filterTodosByPriorityGroup])
  
  // Compute filter stats without storing in state
  const filterStats = useMemo(() => {
    if (activeQuickFilters.size > 0) {
      return {
        filteredCount: filteredTodos.length,
        totalCount: allTodos.length
      }
    }
    return null
  }, [activeQuickFilters.size, filteredTodos.length, allTodos.length])
  
  // Load saved filters on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('quickFilters')
      if (savedFilters) {
        const filterArray = JSON.parse(savedFilters)
        if (Array.isArray(filterArray)) {
          setActiveQuickFilters(new Set(filterArray))
        }
      }
    } catch (error) {
      appLogger.warn('Failed to restore quick filters from storage', { error: error.message })
    }
  }, [])
  
  // Save filters when they change
  useEffect(() => {
    try {
      const filterArray = Array.from(activeQuickFilters)
      if (filterArray.length > 0) {
        localStorage.setItem('quickFilters', JSON.stringify(filterArray))
      } else {
        localStorage.removeItem('quickFilters')
      }
    } catch (error) {
      appLogger.warn('Failed to save quick filters to storage', { error: error.message })
    }
  }, [activeQuickFilters])

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

  // Handle individual filter toggle
  const handleFilterToggle = useCallback((filterId) => {
    setActiveQuickFilters(current => {
      const newActiveFilters = new Set(current)
      if (newActiveFilters.has(filterId)) {
        newActiveFilters.delete(filterId)
        return newActiveFilters
      } else {
        newActiveFilters.add(filterId)
        return newActiveFilters
      }
    })
  }, [])


  // Clear quick filters when regular search becomes active
  const handleSearch = (query) => {
    if (query && activeQuickFilters.size > 0) {
      setActiveQuickFilters(new Set())
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
    appLogger.debug('handleNotificationFilter called', { filterParams })
    
    // Clear any existing search first
    if (searchActive) {
      appLogger.debug('Clearing search before applying notification filter')
      handleClearSearch()
    }
    
    // Clear quick filters and set new one based on notification
    setActiveQuickFilters(new Set())
    
    // Trigger appropriate filter based on notification action
    const filterMap = {
      'aged': 'Old items',
      'high-priority': 'High priority'
    }
    
    const filterName = filterMap[filterParams]
    appLogger.debug('Mapped filter params to filter name', { filterParams, filterName })
    
    if (filterName) {
      // Find the filter ID and apply it directly
      const matchingOption = quickFilterOptions.find(opt => 
        opt.label.toLowerCase().includes(filterName.toLowerCase())
      )
      if (matchingOption) {
        setActiveQuickFilters(new Set([matchingOption.id]))
        appLogger.debug('Applied notification filter', { filterId: matchingOption.id, filterName })
      }
    } else {
      appLogger.warn('No matching filter found for params', { filterParams })
    }
  }

  // Determine which todos to display
  const displayTodos = searchActive 
    ? todos  // Regular search takes precedence
    : (activeQuickFilters.size > 0 ? filteredTodos : todos)  // Use filtered todos if filters active, otherwise all todos

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
      appLogger.debug('Service worker message received', { data: event.data })
      
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { filterParams, action, notificationType } = event.data
        
        appLogger.debug('Processing notification action', {
          action,
          notificationType,
          filterParams,
          hasFilterParams: !!filterParams
        })
        
        if (filterParams) {
          handleNotificationFilter(filterParams)
        }
        
        // Log the notification interaction
        appLogger.info('Notification action processed', {
          action,
          notificationType,
          filterParams
        })
      } else {
        appLogger.warn('Unknown service worker message type', { type: event.data?.type })
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
          activeFilters={activeQuickFilters}
          onFilterToggle={handleFilterToggle}
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
              searchActive={searchActive || activeQuickFilters.size > 0}
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
