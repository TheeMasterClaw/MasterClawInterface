#!/usr/bin/env node
/**
 * Example App Server
 * Demonstrates how your app receives/sends messages to OpenClaw agent
 * 
 * Run this first: npm run test:server
 * Then in another terminal: npm start
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = 3000;

// Simple HTTP server (optional - for health checks, etc.)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    service: 'MyApp with OpenClaw',
    agentConnected: wss.clients.size > 0
  }));
});

// WebSocket server for OpenClaw connector
const wss = new WebSocket.Server({ 
  server,
  path: '/openclaw'  // OpenClaw connects here
});

console.log('🚀 Example App Server');
console.log('═══════════════════════\n');
console.log(`WebSocket endpoint: ws://localhost:${PORT}/openclaw`);
console.log(`Health check: http://localhost:${PORT}/\n`);

wss.on('connection', (ws, req) => {
  console.log('✅ OpenClaw agent connected!\n');
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(ws, msg);
    } catch (err) {
      console.log('📨 Raw:', data.toString());
    }
  });
  
  ws.on('close', () => {
    console.log('\n🔌 OpenClaw agent disconnected');
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'connected':
      console.log(`🤖 Agent "${msg.agent}" is ready!`);
      console.log('   Send messages by typing below\n');
      break;
      
    case 'agent_response':
      console.log('\n💬 Agent says:');
      console.log('   ', JSON.stringify(msg.data, null, 2));
      break;
      
    case 'agent_output':
      console.log('\n📝 Agent output:', msg.content);
      break;
      
    case 'heartbeat':
      // Silent heartbeat
      break;
      
    case 'pong':
      // Pong response
      break;
      
    default:
      console.log('\n📦 Message:', msg.type);
      console.log('   ', JSON.stringify(msg, null, 2));
  }
}

// Readline for interactive testing
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You > '
});

rl.prompt();

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    rl.prompt();
    return;
  }
  
  // Send to all connected agents
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat',
        content: trimmed,
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  console.log('   (sent to agent)\n');
  rl.prompt();
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}\n`);
  console.log('Waiting for OpenClaw agent to connect...');
  console.log('(Run "npm start" in another terminal)\n');
});
