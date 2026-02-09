# MC API Documentation

Base URL: `http://localhost:3001`

## Health Check

### `GET /health`
Check if the server is running.

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok"
}
```

---

## Tasks API

### `GET /tasks`
Get all tasks, sorted by due date.

```bash
curl http://localhost:3001/tasks
```

Response:
```json
[
  {
    "id": "a1b2c3d4e5f6",
    "title": "Optimize schedule",
    "description": "Work with MC to refine daily flow",
    "status": "open",
    "priority": "high",
    "dueDate": "2026-02-15",
    "createdAt": "2026-02-09T20:34:00.000Z",
    "updatedAt": "2026-02-09T20:34:00.000Z",
    "tags": "[\"important\", \"system\"]"
  }
]
```

### `GET /tasks/:id`
Get a specific task.

```bash
curl http://localhost:3001/tasks/a1b2c3d4e5f6
```

### `POST /tasks`
Create a new task.

```bash
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review calendar",
    "description": "Check upcoming meetings",
    "priority": "normal",
    "dueDate": "2026-02-12",
    "tags": "calendar"
  }'
```

Request Body:
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "low | normal | high | urgent (default: normal)",
  "dueDate": "YYYY-MM-DD (optional)",
  "tags": "comma-separated or JSON array (optional)"
}
```

Response:
```json
{
  "id": "a1b2c3d4e5f6",
  "title": "Review calendar",
  "description": "Check upcoming meetings",
  "priority": "normal",
  "dueDate": "2026-02-12",
  "tags": "calendar"
}
```

### `PATCH /tasks/:id`
Update an existing task.

```bash
curl -X PATCH http://localhost:3001/tasks/a1b2c3d4e5f6 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done",
    "priority": "low"
  }'
```

Request Body: (all optional)
```json
{
  "title": "string",
  "description": "string",
  "status": "open | in_progress | done | blocked",
  "priority": "low | normal | high | urgent",
  "dueDate": "YYYY-MM-DD",
  "tags": "string or array"
}
```

### `DELETE /tasks/:id`
Delete a task.

```bash
curl -X DELETE http://localhost:3001/tasks/a1b2c3d4e5f6
```

Response:
```json
{
  "success": true
}
```

---

## Calendar API

### `GET /calendar/events`
Get all calendar events.

```bash
curl http://localhost:3001/calendar/events
```

Response:
```json
[
  {
    "id": "evt_001",
    "googleEventId": "abc123@google.com",
    "title": "Team Standup",
    "description": "Daily sync",
    "startTime": "2026-02-10T10:00:00Z",
    "endTime": "2026-02-10T10:30:00Z",
    "location": "Zoom",
    "attendees": "[\"rex@level100.studios\"]",
    "synced_at": "2026-02-09T20:34:00Z"
  }
]
```

### `GET /calendar/upcoming`
Get events for the next 7 days.

```bash
curl http://localhost:3001/calendar/upcoming
```

### `POST /calendar/events`
Create a local calendar event (not synced to Google).

```bash
curl -X POST http://localhost:3001/calendar/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Focus Time",
    "description": "Deep work block",
    "startTime": "2026-02-10T14:00:00Z",
    "endTime": "2026-02-10T16:00:00Z",
    "location": "Home Office"
  }'
```

Request Body:
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "startTime": "ISO 8601 (required)",
  "endTime": "ISO 8601 (required)",
  "location": "string (optional)",
  "attendees": "JSON array (optional)"
}
```

### `POST /calendar/sync` (Stub)
Sync with Google Calendar. Currently a stub; needs OAuth implementation.

```bash
curl -X POST http://localhost:3001/calendar/sync
```

Response:
```json
{
  "synced": 0,
  "message": "Google Calendar sync not yet implemented"
}
```

---

## Text-to-Speech API

### `POST /tts`
Synthesize text to speech.

```bash
curl -X POST http://localhost:3001/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome, Rex. Let'\''s take over the world together.",
    "voice": "default",
    "provider": "openai"
  }'
```

Request Body:
```json
{
  "text": "string (required)",
  "voice": "string (optional, default: default)",
  "provider": "openai | elevenlabs | none (optional)"
}
```

Response:
```json
{
  "audioUrl": "data:audio/mp3;base64,...",
  "text": "Welcome, Rex. Let's take over the world together.",
  "voice": "default"
}
```

Currently returns `null` for `audioUrl` (stubs until API keys configured).

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "message": "Optional detailed message"
}
```

Examples:

```bash
# 404 - Task not found
curl http://localhost:3001/tasks/nonexistent
→ { "error": "Task not found" }

# 400 - Bad request
curl -X POST http://localhost:3001/tasks -d '{}'
→ { "error": "...", "message": "..." }

# 500 - Server error
→ { "error": "Internal server error" }
```

---

## Rate Limiting

Currently: None. Add if needed for production.

---

## Authentication

Currently: None. Add OAuth/JWT if adding multi-user support.

---

## CORS

Enabled for all origins during development. Restrict in production:

```javascript
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

---

## Future Endpoints

- `POST /memories` — Store decisions & context
- `GET /memories/recent` — Retrieve recent memories
- `POST /context/summarize` — Summarize current state
- `POST /suggest` — Get MC's suggestions based on data
- `POST /export` — Export all data as JSON

---

Built with intention. Privacy by default. Power when needed.
