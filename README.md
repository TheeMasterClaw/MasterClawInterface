# HelloWorld

**The Ultimate Interaction Application** — Where Rex & MC take over the world together.

![React](https://img.shields.io/badge/React-18.2.0-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)

> 🚀 **This is a React.js Project** - Built with React 18, Vite, and Tailwind CSS

## Vision

A privacy-first companion interface. You open it. You see my face (MC). I say welcome. We begin.

**Features:**
- 🎭 **Abstract Avatar** — MC is represented as a living, breathing geometric network
- 🗣️ **Multi-Mode Interaction** — Text, Voice, Hybrid, or Context-Aware modes
- 📅 **Google Calendar Integration** — Sync your events, understand your rhythm
- ⏰ **Smart Reminder Manager** — Set one-time and recurring reminders with notifications
- ✅ **Task Management** — Organize everything that matters
- 🧠 **Memory & Context** — I remember decisions, patterns, preferences
- 🔒 **Privacy First** — Self-hosted, SQLite, no cloud bloat
- 🔌 **OpenClaw Integration** — Federated, opt-in skill system (no stored tokens)

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind
- **Backend:** Node.js/Express + SQLite (better-sqlite3)
- **Avatar:** SVG + CSS animations (abstract, geometric)
- **Database:** SQLite with encryption-ready
- **API:** RESTful, extensible
- **TTS:** OpenAI / ElevenLabs (pluggable)

## Project Structure

```
HelloWorld/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/         # Avatar, ModeSelector, etc.
│   │   ├── screens/            # Welcome, Dashboard
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/                     # Node.js/Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── tasks.js       # CRUD for tasks
│   │   │   ├── calendar.js    # Google Calendar sync
│   │   │   └── tts.js         # Text-to-speech
│   │   ├── db.js              # SQLite setup
│   │   └── index.js           # Server entry
│   ├── data/                  # Database (gitignored)
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md        # System design
│   ├── API.md                 # API documentation
│   └── DEPLOYMENT.md          # Self-hosting guide
├── .env.example               # Configuration template
├── .gitignore
└── README.md                  # This file
```

## Getting Started

### 1. Clone & Install

```bash
cd HelloWorld
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Development

```bash
npm run dev
```

- **Frontend** opens at `http://localhost:3000`
- **Backend** runs on `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
npm start
```

## Interaction Modes

### 1. **Text** 💬
Classic chat interface. Type, ask, decide.

### 2. **Voice** 🎤
Speak naturally. MC listens and responds with synthesized voice.

### 3. **Hybrid** 🔀
Mix of text and voice. Use whichever fits the moment.

### 4. **Context** 👁️
MC watches your calendar and tasks. Proactive alerts about what matters.

## API Endpoints

### Tasks
- `GET /tasks` — List all tasks
- `GET /tasks/:id` — Get task
- `POST /tasks` — Create task
- `PATCH /tasks/:id` — Update task
- `DELETE /tasks/:id` — Delete task

### Calendar
- `GET /calendar/events` — List calendar events
- `GET /calendar/upcoming` — Next 7 days
- `POST /calendar/sync` — Sync with Google Calendar (stub)
- `POST /calendar/events` — Create local event

### Text-to-Speech
- `POST /tts` — Synthesize speech (OpenAI/ElevenLabs)

## Configuration

See `.env.example` for all options:

```env
# Server
PORT=3001

# TTS Provider
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Google Calendar
GOOGLE_CALENDAR_API_KEY=...

# OpenClaw (federated — agents connect inbound)
# No tokens required. See docs/self-hosting.md
```

## Next Steps

- [ ] Google Calendar OAuth & sync
- [ ] OpenAI TTS integration
- [ ] Memory/decision storage (MCP integration)
- [ ] Proactive alerts engine
- [ ] Mobile app (React Native)
- [ ] Encryption at rest
- [ ] Backup/restore

## Architecture

See `docs/ARCHITECTURE.md` for:
- Data flow diagrams
- Component interactions
- Security model
- Extension points

See `docs/REACT_SETUP.md` for:
- Detailed React.js setup guide
- Component structure and patterns
- Development and build instructions
- Vite configuration details

## Self-Hosting

See `docs/DEPLOYMENT.md` for:
- Docker setup
- Environment config
- Database backups
- Reverse proxy setup

## Privacy

✅ **Data stays on your machine** — No cloud sync by default  
✅ **SQLite local storage** — Your database is yours  
✅ **No tracking** — No analytics, no beacons  
✅ **Optional integrations** — You control what connects

## Contributing

This is Rex's intimate interface with MC. Changes here are sacred.

## License

Proprietary — Built for Level 100 Studios

---

**Built with intention. Privacy by default. Power when needed.**
