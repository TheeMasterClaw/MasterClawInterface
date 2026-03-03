# OpenClaw App Connector

Connect an OpenClaw agent to your custom application via WebSocket.

## Architecture

```
Your App <--------WebSocket--------> Connector <--------stdio--------> OpenClaw Agent
        (ws://localhost:3000)              (openclaw run --stdio)
```

## Quick Start

### 1. Install dependencies

```bash
cd my-app-connector
npm install
```

### 2. Start the example app server

```bash
npm run test:server
```

This starts a WebSocket server on `ws://localhost:3000/openclaw`

### 3. Connect the OpenClaw agent

In another terminal:

```bash
npm start
```

This launches the connector which spawns OpenClaw and connects it to your app.

### 4. Chat with the agent

Type messages in the example server terminal — they'll be sent to the OpenClaw agent.

## Configuration

Edit `connector.json`:

```json
{
  "config": {
    "agentName": "Deciple1",           // Which OpenClaw agent to spawn
    "appEndpoint": "ws://localhost:3000/openclaw",
    "reconnectInterval": 5000,         // Reconnect after 5s if disconnected
    "heartbeatInterval": 30000         // Send heartbeat every 30s
  }
}
```

## Message Protocol

### From Your App → OpenClaw Agent

```json
{
  "type": "chat",
  "content": "Hello agent!",
  "timestamp": "2026-03-03T08:10:00.000Z"
}
```

### From OpenClaw Agent → Your App

```json
{
  "type": "agent_response",
  "from": "Deciple1",
  "data": { /* OpenClaw response */ },
  "timestamp": "2026-03-03T08:10:01.000Z"
}
```

## Integration in Your App

Just add a WebSocket server at `/openclaw`:

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server, path: '/openclaw' });

wss.on('connection', (ws) => {
  // Agent connected
  ws.send(JSON.stringify({ type: 'chat', content: 'Hello!' }));
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    // Handle agent responses
  });
});
```

## Customizing

### Change the agent

Edit `connector.json`:
```json
"agentName": "Deciple2"
```

### Use a different endpoint

```json
"appEndpoint": "wss://your-production-server.com/openclaw"
```

### Add authentication

Modify `connector.js` to send auth headers/tokens during connection.
