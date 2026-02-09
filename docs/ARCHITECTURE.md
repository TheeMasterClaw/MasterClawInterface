# HelloWorld Architecture

## Overview

MC is a privacy-first interaction layer between Rex and his familiar assistant. The system is built on:

- **Decoupled frontend & backend** — React SPA + Express API
- **Local-first storage** — SQLite for data persistence
- **Abstract avatar** — SVG-based, animated MC representation
- **Multi-modal input** — Text, voice, hybrid, or context-aware

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Port 3000)              │
│  ┌────────────────────────────────────────────────┐ │
│  │  React SPA                                     │ │
│  │  ├── Welcome Screen (Avatar + Greeting)       │ │
│  │  ├── Mode Selector (Text/Voice/Hybrid)        │ │
│  │  └── Dashboard (Chat Interface)               │ │
│  │      ├── Avatar (SVG, animated)               │ │
│  │      ├── Message History                      │ │
│  │      └── Input (Text/Voice/Context)           │ │
│  └────────────────────────────────────────────────┘ │
│                         │                            │
│                    HTTP/REST                         │
│                         ▼                            │
│  ┌────────────────────────────────────────────────┐ │
│  │    Backend (Port 3001)                         │ │
│  │  ├── /tasks — Task management                 │ │
│  │  ├── /calendar — Event sync & queries         │ │
│  │  ├── /tts — Text-to-speech synthesis          │ │
│  │  └── /memory — Decisions & context storage    │ │
│  └────────────────────────────────────────────────┘ │
│                         │                            │
│                    SQLite                            │
│                         ▼                            │
│  ┌────────────────────────────────────────────────┐ │
│  │    Local Database (data/mc.db)                 │ │
│  │  ├── tasks                                     │ │
│  │  ├── calendar_events                           │ │
│  │  ├── memories                                  │ │
│  │  └── settings                                  │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
         ▲                                     ▲
         │                                     │
    Browser UI              (Future) OpenClaw Gateway
                           (Federated Tasks & Memory)
```

## Component Breakdown

### Frontend (React)

**Avatar Component** (`Avatar.jsx`)
- SVG-based, abstract geometric representation
- Central core (intelligence) + orbiting nodes (thoughts) + connecting lines (communication)
- CSS animations: pulse, flow, breathe
- No anthropomorphization—pure information flow visualization

**Welcome Screen** (`Welcome.jsx`)
- First impression: "Welcome, Rex. Let's take over the world together."
- Displays avatar + message + begin button
- Voice greeting (TTS) if available

**Mode Selector** (`ModeSelector.jsx`)
- Four interaction modes: Text, Voice, Hybrid, Context
- Card-based UI with icons & descriptions
- User chooses how to interact

**Dashboard** (`Dashboard.jsx`)
- Main workspace after mode selection
- Message history (scrollable)
- Input area (changes based on mode)
- Sidebar with avatar + mode badge

### Backend (Node.js/Express)

**Database** (`db.js`)
- SQLite with WAL mode (write-ahead logging)
- Tables: tasks, calendar_events, memories, settings
- Helper: `genId()` for random IDs

**Routes**

1. **Tasks** (`routes/tasks.js`)
   - CRUD operations
   - Priority + due dates
   - Tags for organization

2. **Calendar** (`routes/calendar.js`)
   - Event listing & filtering
   - Google Calendar sync (stub)
   - Local event creation

3. **TTS** (`routes/tts.js`)
   - Pluggable providers (OpenAI, ElevenLabs)
   - Voice synthesis for MC responses
   - Fallback to silent mode

### Database Schema

```sql
-- Tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',  -- open, in_progress, done, blocked
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  dueDate TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  tags TEXT  -- JSON array
);

-- Calendar Events (synced from Google Calendar)
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  googleEventId TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  location TEXT,
  attendees TEXT,  -- JSON array
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Memories (decisions, notes, context)
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  type TEXT,  -- decision, note, pattern, lesson
  content TEXT NOT NULL,
  context TEXT,  -- JSON context
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  tags TEXT  -- JSON array
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Data Flow

### Welcome → Mode Selection → Dashboard

```
1. User opens app
2. Welcome screen renders with avatar
3. TTS plays: "Welcome, Rex. Let's take over the world together."
4. User clicks "Begin"
5. Mode selector shows 4 options
6. User picks mode (text/voice/hybrid/context)
7. Dashboard loads with appropriate input method
```

### Text Mode Flow

```
User types → Frontend POST /tasks
           ↓
Backend validates & stores in SQLite
           ↓
MC processes task (stub for now)
           ↓
Response JSON → Frontend displays in chat
           ↓
(Optional) TTS synthesis for voice playback
```

### Voice Mode Flow

```
User speaks → Browser SpeechRecognition API
            ↓
Transcript sent to backend
            ↓
Backend processes (same as text)
            ↓
Response generated
            ↓
TTS synthesizes audio
            ↓
Audio plays back to user
```

### Context Mode Flow

```
MC watches Google Calendar + Tasks
         ↓
Identifies upcoming deadlines, conflicts, opportunities
         ↓
Generates proactive alerts
         ↓
Pushes notifications to user
         ↓
User can interact or dismiss
```

## Security & Privacy

### Local-First Design
- No cloud sync by default
- SQLite database on user's machine
- All processing happens locally or on OpenClaw gateway

### Encryption (Future)
- SQLite encryption at rest (SQLCipher)
- TLS for API communication (if distributed)
- Encrypted backups

### Third-Party Integrations
- Google Calendar: OAuth 2.0 (user-initiated)
- TTS: API key in env variables
- OpenClaw: Gateway token (optional)

## Extensibility

### Add a New Route
```javascript
// backend/src/routes/newfeature.js
export const newRouter = express.Router();

newRouter.get('/', (req, res) => {
  // your code
});
```

Then in `index.js`:
```javascript
app.use('/newfeature', newRouter);
```

### Add a New Mode
1. Create component in `frontend/src/components/NewMode.jsx`
2. Add to `ModeSelector.jsx`
3. Import & render in `Dashboard.jsx`

### Add a TTS Provider
```javascript
// In backend/src/routes/tts.js
async function synthesizeWithMyProvider(text, voice) {
  // Call your API
}
```

## Development Workflow

### Local Development
```bash
npm run dev
# Frontend on 3000, Backend on 3001
```

### Testing
```bash
# Run backend server
npm run dev:backend

# Test API in another terminal
curl http://localhost:3001/health
curl http://localhost:3001/tasks
```

### Building
```bash
npm run build
# Outputs to dist/ folders
```

## Performance Considerations

- **Frontend:** React fast refresh during dev, optimized build for prod
- **Backend:** SQLite is fast for local queries; add indexes if needed
- **Avatar:** SVG is lightweight; CSS animations use GPU
- **Scrolling:** Virtual scrolling for long message histories (future)

## Future Enhancements

1. **Memory Context** — Use recent memories to make smarter decisions
2. **Google Calendar Sync** — Pull events automatically
3. **Smart Alerts** — Warn about conflicts, suggest optimizations
4. **Multi-Device** — Sync across desktop, mobile, OpenClaw
5. **Custom Training** — Learn Rex's patterns & preferences
6. **Export/Backup** — Download all data
7. **Dark Mode Toggle** — (Currently dark-only)
8. **Analytics** — Local, privacy-respecting usage insights

---

**Built with intention. Privacy by default. Power when needed.**
