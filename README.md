# LongList

**LongList** is a modern task management application built with React and Vite. Designed for seamless task organization across devices, with powerful synchronization to Microsoft OneDrive using the Microsoft Graph API.

If you just want to use the app you can find it here https://longlist.app

## Features

- **Add, edit, complete, and delete tasks**
- **Tagging and priority support**: Organize your tasks with hashtags and priority markers (e.g., `#work !1`)
- **Powerful search and filtering**
- **Offline-first experience**: Your tasks are stored locally and sync when you return online
- **OneDrive cloud sync**: Securely save and access your tasks across devices by signing in with your Microsoft account
- **Conflict resolution**: Handles sync conflicts and provides resolution options
- **Backup reminders**: Get notified to backup/export your tasks periodically if not using cloud sync
- **Data integrity checks**: Monitors for sync health and data consistency

## Technology Stack

- [React](https://react.dev/) (UI framework)
- [Vite](https://vitejs.dev/) (build tool)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview) (for OneDrive integration)
- Modern React hooks and context patterns

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

## Advanced

- **Custom Hooks**: The app uses custom React hooks for task management, OneDrive sync, data integrity, and more.
- **Optimistic UI**: Changes are reflected instantly in the UI and synced in the background.
- **Sync Health**: The app tracks the health of your sync and notifies you if something needs attention.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

*This project was bootstrapped with Vite's React template and extended for cloud sync and advanced task management features.*
