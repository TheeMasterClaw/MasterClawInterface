# React.js Project Setup

This is a **React.js** project built with modern tools and best practices.

## Tech Stack

### Frontend (React.js)
- **React 18.2.0** - Modern React with hooks and concurrent features
- **React DOM 18.2.0** - React rendering for web
- **Vite 5.x** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **PostCSS & Autoprefixer** - CSS processing
- **Socket.io Client 4.x** - Real-time communication
- **Zustand 4.x** - Lightweight state management

### Development Tools
- **@vitejs/plugin-react** - Official Vite plugin for React with Fast Refresh
- **TypeScript type definitions** - Type safety for React components
- **Concurrently** - Run multiple npm scripts simultaneously

## Project Structure

```
MasterClawInterface/
├── frontend/                    # React SPA (Single Page Application)
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Avatar.jsx     # Main avatar component
│   │   │   ├── ModeSelector.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ...            # Other React components
│   │   ├── screens/           # Page-level React components
│   │   │   ├── Welcome.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx            # Main React app component
│   │   ├── main.jsx           # React app entry point
│   │   ├── index.css          # Global styles
│   │   └── config.js          # Configuration
│   ├── public/                # Static assets
│   │   └── mc-icon.svg
│   ├── index.html             # HTML template
│   ├── vite.config.js         # Vite configuration
│   └── package.json           # Frontend dependencies
├── backend/                   # Node.js/Express API
└── package.json              # Root package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ (tested with v24.13.0)
- npm 9+ (tested with v11.6.2)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd MasterClawInterface
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```
   
   Or manually:
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

### Development

#### Start the full stack (Frontend + Backend):
```bash
npm run dev
```
This runs both the React dev server and the backend API simultaneously.

#### Start only the React frontend:
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```
- Opens at `http://localhost:3000`
- Hot Module Replacement (HMR) enabled
- Fast Refresh for React components

#### Start only the backend:
```bash
npm run dev:backend
# or
cd backend && npm run dev
```
- Runs on `http://localhost:3001`

### Building for Production

#### Build the React frontend:
```bash
npm run build
# or
npm run build:frontend
# or
cd frontend && npm run build
```

The production build will be created in `frontend/dist/` with:
- Optimized and minified JavaScript
- CSS bundled and minified
- Source maps for debugging
- All assets hashed for cache busting

#### Preview the production build:
```bash
cd frontend && npm run preview
```

### React Components

This project uses modern React patterns:

1. **Functional Components** - All components are functional, no class components
2. **React Hooks** - useState, useEffect, and other hooks for state management
3. **JSX Syntax** - Component files use `.jsx` extension
4. **Component Composition** - Reusable components with props
5. **CSS Modules** - Scoped styles for each component

Example component structure:
```jsx
import React, { useState, useEffect } from 'react';
import './Avatar.css';

export default function Avatar({ state = 'idle', size = 'medium' }) {
  // Component logic with hooks
  return (
    <div className={`avatar avatar--${state}`}>
      {/* JSX content */}
    </div>
  );
}
```

### Key React Features Used

1. **React.StrictMode** - Enabled for detecting potential issues
2. **React Router** - Navigation between screens (Welcome, Dashboard)
3. **Custom Hooks** - Reusable stateful logic
4. **Context API** - Potential for global state (via Zustand)
5. **Effect Hooks** - Side effects, data fetching, subscriptions

### Vite Configuration

The project uses Vite for:
- ⚡ Lightning-fast dev server with HMR
- 📦 Optimized production builds
- 🔄 API proxy to backend (`/api` → `http://localhost:3001`)
- 🎯 Source maps for debugging

Configuration in `frontend/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### Styling with Tailwind CSS

The project includes Tailwind CSS for utility-first styling:
- Configured via `tailwind.config.js`
- PostCSS for processing
- Custom cyber aesthetic with glassmorphism effects
- Primary colors: cyan (#22d3ee), purple (#6366f1, #a78bfa), pink (#ec4899)

### State Management

- **Local State**: useState hook for component-level state
- **Global State**: Zustand for lightweight global state management
- **Server State**: Real-time updates via Socket.io

### Browser Support

Modern browsers with ES6+ support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### Port already in use
If port 3000 is taken, Vite will prompt to use another port.

### Dependencies issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm run install:all
```

### Build errors
```bash
# Check Node version
node --version  # Should be 18+

# Rebuild from scratch
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

## Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- See `docs/ARCHITECTURE.md` for system design
- See `docs/API.md` for API documentation

## Confirmation

✅ This is a **React.js project**  
✅ Built with React 18 + Vite + Tailwind  
✅ Modern functional components with hooks  
✅ Hot Module Replacement enabled  
✅ Production-ready build configuration  
✅ TypeScript type definitions included  
✅ All dependencies installed and verified  
✅ Dev server tested and working  
✅ Production build tested and working
