# Skill Development Guide

This guide explains how to create a skill for the MasterClaw bot to connect to the interface.

## Overview

Skills are capabilities that a bot registers with the MasterClaw Interface, allowing users to discover and invoke them through chat commands or the REST API. Skills can be:

- **Socket-based** — Registered via WebSocket by a connected bot process
- **Endpoint-based** — Registered via REST API with a remote callback URL

## Quick Start

### 1. Connect via WebSocket (Recommended)

The simplest way to add a skill is by connecting a bot process via Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  auth: {
    token: process.env.MASTERCLAW_API_TOKEN,
  },
});

socket.on('connect', () => {
  console.log('Connected to MasterClaw Interface');

  // Register a skill
  socket.emit('skill:register', {
    name: 'Weather Lookup',
    description: 'Get current weather for a city',
    trigger: 'weather',
    parameters: [
      { name: 'city', type: 'string', required: true, description: 'City name' },
    ],
  }, (ack) => {
    if (ack.ok) {
      console.log('Skill registered:', ack.skill);
    } else {
      console.error('Registration failed:', ack.error);
    }
  });
});

// Handle skill invocations
socket.on('skill:execute', async ({ trigger, params, requesterId }) => {
  console.log(`Skill invoked: ${trigger}`, params);

  // Process the skill request
  const result = { text: `Weather in ${params.city}: Sunny, 72°F` };

  // Send the result back
  socket.emit('skill:result', {
    requesterId,
    trigger,
    result,
  });
});
```

### 2. Register via REST API

You can also register a skill with a remote endpoint:

```bash
curl -X POST http://localhost:3001/skills \
  -H "Content-Type: application/json" \
  -H "X-API-Token: your-token" \
  -d '{
    "name": "Weather Lookup",
    "description": "Get current weather for a city",
    "trigger": "weather",
    "endpoint": "https://your-bot.example.com/skills/weather",
    "parameters": [
      { "name": "city", "type": "string", "required": true, "description": "City name" }
    ]
  }'
```

When the skill is invoked, the interface will POST to your endpoint:

```json
POST https://your-bot.example.com/skills/weather
Content-Type: application/json

{
  "skill": "weather",
  "params": { "city": "London" }
}
```

Your endpoint should respond with JSON:

```json
{
  "text": "Weather in London: Cloudy, 55°F"
}
```

## Skill Definition

| Field         | Type     | Required | Description                                             |
|---------------|----------|----------|---------------------------------------------------------|
| `name`        | string   | Yes      | Human-readable skill name                               |
| `description` | string   | Yes      | What the skill does                                     |
| `trigger`     | string   | Yes      | Slash command trigger (letters, numbers, hyphens, underscores) |
| `parameters`  | array    | No       | Parameter definitions                                   |
| `endpoint`    | string   | No       | Remote URL for endpoint-based skills                    |

### Parameter Definition

| Field         | Type    | Description                              |
|---------------|---------|------------------------------------------|
| `name`        | string  | Parameter name                           |
| `type`        | string  | Data type (string, number, boolean)      |
| `required`    | boolean | Whether the parameter is required        |
| `description` | string  | Human-readable description               |

## Using Skills

### Chat Commands

Users can interact with skills through chat:

```
/skills               — List all registered skills
/skill weather city=London — Invoke the weather skill
```

### REST API

```bash
# List skills
curl http://localhost:3001/skills \
  -H "X-API-Token: your-token"

# Invoke a skill
curl -X POST http://localhost:3001/skills/invoke/weather \
  -H "Content-Type: application/json" \
  -H "X-API-Token: your-token" \
  -d '{ "city": "London" }'
```

### WebSocket

```javascript
// List skills
socket.emit('skill:list', {}, (ack) => {
  console.log('Available skills:', ack.skills);
});

// Invoke a skill
socket.emit('skill:invoke', {
  trigger: 'weather',
  params: { city: 'London' },
}, (ack) => {
  console.log('Result:', ack);
});
```

## WebSocket Events

### Events your bot sends

| Event             | Payload                                        | Description                        |
|-------------------|------------------------------------------------|------------------------------------|
| `skill:register`  | `{ name, description, trigger, parameters }`   | Register a new skill               |
| `skill:result`    | `{ requesterId, trigger, result }`             | Return result of a skill execution |

### Events your bot receives

| Event             | Payload                                        | Description                              |
|-------------------|------------------------------------------------|------------------------------------------|
| `skill:execute`   | `{ trigger, params, requesterId }`             | Interface requesting skill execution     |
| `skill:registered`| `{ id, name, trigger, ... }`                   | Broadcast when any skill is registered   |
| `skill:unregistered` | `{ socketId, count }`                       | Broadcast when a bot disconnects         |

## Skills REST API

### `GET /skills`

List all registered skills.

**Query Parameters:**
- `status` — Filter by status (`active` or `inactive`)

**Response:**
```json
{
  "skills": [
    {
      "id": "a1b2c3d4e5f6...",
      "name": "Weather Lookup",
      "description": "Get current weather for a city",
      "trigger": "weather",
      "parameters": [...],
      "status": "active",
      "registeredAt": "2026-02-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### `GET /skills/:id`

Get a specific skill by ID.

### `POST /skills`

Register a new skill.

**Request Body:**
```json
{
  "name": "Weather Lookup",
  "description": "Get current weather for a city",
  "trigger": "weather",
  "parameters": [
    { "name": "city", "type": "string", "required": true }
  ],
  "endpoint": "https://your-bot.example.com/skills/weather"
}
```

### `PATCH /skills/:id`

Update a skill (name, description, parameters, endpoint, status).

### `DELETE /skills/:id`

Remove a skill.

### `POST /skills/invoke/:trigger`

Invoke a skill by its trigger.

**Request Body:**
```json
{
  "city": "London"
}
```

## Lifecycle

1. **Bot connects** via WebSocket to the interface
2. **Bot registers skills** with `skill:register` events
3. **User discovers skills** via `/skills` chat command or REST API
4. **User invokes a skill** via `/skill <trigger>` or REST API
5. **Interface routes** the invocation to the bot via `skill:execute` event
6. **Bot processes** the request and sends result via `skill:result`
7. **Interface delivers** the result to the user
8. **Bot disconnects** — all its skills are automatically cleaned up

## Example: Complete Bot Skill

```javascript
import { io } from 'socket.io-client';

const INTERFACE_URL = process.env.INTERFACE_URL || 'http://localhost:3001';

const socket = io(INTERFACE_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  console.log('🤖 Bot connected to MasterClaw Interface');

  // Register multiple skills
  const skills = [
    {
      name: 'Dice Roll',
      description: 'Roll one or more dice',
      trigger: 'roll',
      parameters: [
        { name: 'sides', type: 'number', required: false, description: 'Number of sides (default: 6)' },
        { name: 'count', type: 'number', required: false, description: 'Number of dice (default: 1)' },
      ],
    },
    {
      name: 'Coin Flip',
      description: 'Flip a coin',
      trigger: 'flip',
    },
  ];

  for (const skill of skills) {
    socket.emit('skill:register', skill, (ack) => {
      if (ack.ok) console.log(`  ✅ Registered: /${skill.trigger}`);
      else console.error(`  ❌ Failed: ${ack.error}`);
    });
  }
});

// Handle invocations
socket.on('skill:execute', ({ trigger, params, requesterId }) => {
  let result;

  switch (trigger) {
    case 'roll': {
      const sides = parseInt(params.sides) || 6;
      const count = parseInt(params.count) || 1;
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      result = { text: `🎲 Rolled ${count}d${sides}: ${rolls.join(', ')} (total: ${rolls.reduce((a, b) => a + b, 0)})` };
      break;
    }
    case 'flip': {
      result = { text: Math.random() < 0.5 ? '🪙 Heads!' : '🪙 Tails!' };
      break;
    }
    default:
      result = { text: `Unknown skill: ${trigger}` };
  }

  socket.emit('skill:result', { requesterId, trigger, result });
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});
```

---

**Built with intention. Privacy by default. Power when needed.**
