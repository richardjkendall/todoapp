# LongList

**LongList** is a modern, feature-rich task management application built with React and Vite. Designed for seamless task organization across devices, with powerful synchronization to Microsoft OneDrive using the Microsoft Graph API.

If you just want to use the app you can find it here https://longlist.app

## Features

### 📝 Core Task Management
- **Add, edit, complete, and delete tasks** with an intuitive interface
- **Smart text parsing**: Automatically extracts tags and priority from natural language (e.g., `Fix bug #urgent !1`)
- **Drag & drop reordering** within priority groups
- **Swipe gestures** on mobile for quick task completion and deletion
- **Auto-resize text input** with multi-line support

### 🏷️ Organization & Filtering
- **Hashtag tagging system**: Organize tasks with unlimited hashtags (`#work`, `#personal`, etc.)
- **5-level priority system**: Use `!1` (highest) to `!5` (lowest) priority markers
- **Quick filters**: One-tap filtering by tags, priority, age, and completion status
- **Advanced search**: Search by text, tags, priority, and completion status with live results
- **Smart filtering UI**: Contextual filter chips with item counts

### ☁️ Cloud Sync & Storage
- **Microsoft OneDrive integration**: Secure cloud storage using Microsoft Graph API
- **Offline-first architecture**: Works completely offline, syncs when connection restored
- **Intelligent conflict resolution**: Smart auto-merge with manual resolution for complex conflicts
- **Multiple storage modes**: Local-only or cloud sync with seamless switching
- **Real-time sync status**: Visual indicators for sync progress and connection state

### 📱 Mobile-Optimized Experience
- **Progressive Web App (PWA)**: Install on any device like a native app
- **Touch-optimized gestures**: Swipe to complete/delete, long-press for options
- **Camera integration**: Take photos and attach them directly to tasks
- **Responsive design**: Optimized layouts for mobile, tablet, and desktop
- **Mobile-specific features**: Context menus, haptic feedback, and touch-friendly UI

### 📸 Rich Media Support
- **Photo attachments**: Capture or upload photos directly to tasks
- **OneDrive photo storage**: Photos stored securely in your OneDrive
- **Image thumbnails**: Preview photos inline with full-screen modal view
- **Photo validation**: Automatic file type and size validation

### 🔗 Sharing & Collaboration
- **Task sharing**: Share individual tasks via URL, QR code, or native sharing
- **Cross-platform sharing**: Works with any messaging app or social platform
- **Compressed sharing format**: Efficient encoding for long task descriptions
- **Universal compatibility**: Shared tasks work across all devices and browsers

### 🔔 Smart Notifications
- **Push notifications**: Reminders for aged tasks and important items
- **Notification management**: Granular control over notification types and timing
- **Service worker integration**: Background notifications even when app is closed
- **Customizable alerts**: Set preferences for different notification scenarios

### 🛠️ Data Management
- **Import/Export**: Full data portability with JSON format
- **Backup reminders**: Automated prompts for users without cloud sync
- **Data validation**: Comprehensive validation and error recovery
- **Migration tools**: Seamless upgrades and data format migrations
- **Conflict detection**: Field-level conflict detection with smart resolution

### 🎨 User Experience
- **Dark/Light themes**: System-aware theme switching
- **Sticky header**: Always-accessible search and add functionality
- **Loading states**: Smooth loading indicators and skeleton screens
- **Error handling**: Graceful error recovery with user-friendly messages
- **Accessibility**: Keyboard navigation and screen reader support

## Technology Stack

- **[React 19](https://react.dev/)** - Modern UI framework with latest features
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool and dev server
- **[Styled Components](https://styled-components.com/)** - CSS-in-JS styling with theming
- **[Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)** - OneDrive integration and cloud storage
- **[MSAL Browser](https://github.com/AzureAD/microsoft-authentication-library-for-js)** - Microsoft authentication
- **[PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)** - Progressive Web App capabilities
- **[Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)** - Background sync and notifications
- **Modern React patterns** - Hooks, Context API, and custom hooks architecture

## Getting Started

### Prerequisites

- Node.js (version 16+ recommended)
- npm or yarn

### Installation

```bash
git clone https://github.com/richardjkendall/longlist.git
cd longlist
npm install   # or yarn install
```

### Development

```bash
npm run dev   # or yarn dev
```

Visit [http://localhost:5173](http://localhost:5173) to view the app.

### Build

```bash
npm run build   # or yarn build
```

### OneDrive Integration

To enable cloud sync:

1. Sign in with your Microsoft account when prompted.
2. Grant permissions for the app to access your OneDrive.
3. Your tasks will be securely saved to your OneDrive app folder (`todos.json`).

> **Note:** Sync is always enabled; local and remote data will be automatically merged or migrated as needed.

## Usage Guide

### Adding Tasks
- Type naturally: `Buy groceries #personal !2` automatically creates a task with the "personal" tag and priority 2
- Use `/` to start searching instead of adding
- Add photos by tapping the camera button (mobile) or photo button (desktop)

### Organization
- **Tags**: Use `#tagname` anywhere in your task text
- **Priority**: Use `!1` through `!5` (1 = highest priority)
- **Filtering**: Tap filter chips to show specific tags, priorities, or task ages
- **Search**: Type `/` followed by your search terms for instant results

### Mobile Features
- **Swipe right** on tasks to mark complete
- **Swipe left** on tasks to delete
- **Long press** the add button for camera and additional options
- **Pull to refresh** to force sync

### Sharing Tasks
- Tap the share button on any task
- Choose from URL sharing, QR codes, or native platform sharing
- Recipients can view and import shared tasks on any device

## Architecture & Advanced Features

### Custom Hooks Architecture
- **`useTodos`** - Central task management with optimistic updates
- **`useEnhancedOneDriveStorage`** - Cloud sync with intelligent conflict resolution
- **`useAuth`** - Microsoft authentication and token management  
- **`usePhotoService`** - Photo upload and OneDrive storage management
- **`useSwipeGesture`** - Touch gesture recognition and handling
- **`useQuickFilters`** - Dynamic filtering and search functionality
- **`useSharedTodo`** - URL-based task sharing system

### Performance Optimizations
- **Optimistic UI updates** - Instant feedback with background sync
- **Debounced sync operations** - Efficient batching of cloud saves
- **Session caching** - Reduced API calls with intelligent cache invalidation
- **Component lazy loading** - Code splitting for faster initial loads
- **Timestamp-based change detection** - Minimal data transfer

### Sync & Conflict Resolution
- **Field-level conflict detection** - Granular change tracking
- **Smart auto-merge strategies** - Intelligent conflict resolution
- **Tombstone deletion tracking** - Proper handling of deleted items
- **Multi-device synchronization** - Consistent state across devices
- **Offline queue management** - Reliable sync when connectivity returns

### Security & Data Integrity
- **Microsoft Graph API integration** - Enterprise-grade security
- **Data validation and sanitization** - Protection against corrupt data
- **Error boundary patterns** - Graceful failure handling
- **Structured logging framework** - Comprehensive debugging and monitoring

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

*This project was bootstrapped with Vite's React template and extended for cloud sync and advanced task management features.*
