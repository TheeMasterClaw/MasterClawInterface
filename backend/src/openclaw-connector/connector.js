#!/usr/bin/env node
/**
 * OpenClaw App Connector
 * Bridges OpenClaw agent to your custom application
 * 
 * Your app <--WebSocket--> This Connector <--stdio--> OpenClaw Agent
 */

const { spawn } = require('child_process');
const WebSocket = require('ws');

class OpenClawConnector {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.agent = null;
    this.messageQueue = [];
    this.isReady = false;
  }

  async start() {
    console.log(`🜁 ${this.config.name} v${this.config.version}`);
    console.log(`Connecting OpenClaw agent "${this.config.config.agentName}" to your app...\n`);

    // Start the OpenClaw agent
    this.startAgent();
    
    // Connect to your app
    this.connectToApp();
  }

  startAgent() {
    console.log('📟 Starting OpenClaw agent...');
    
    // Spawn OpenClaw CLI in stdio mode
    this.agent = spawn('openclaw', ['run', '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, OPENCLAW_AGENT_NAME: this.config.config.agentName }
    });

    let buffer = '';
    
    this.agent.stdout.on('data', (data) => {
      buffer += data.toString();
      
      // Process newline-delimited JSON
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          this.handleAgentMessage(line.trim());
        }
      }
    });

    this.agent.stderr.on('data', (data) => {
      console.log(`[Agent stderr] ${data.toString().trim()}`);
    });

    this.agent.on('close', (code) => {
      console.log(`Agent exited with code ${code}`);
      process.exit(code);
    });

    this.agent.on('error', (err) => {
      console.error('Failed to start agent:', err.message);
      console.log('\n💡 Make sure OpenClaw is installed:');
      console.log('   npm install -g openclaw');
      process.exit(1);
    });
  }

  connectToApp() {
    const endpoint = this.config.config.appEndpoint;
    console.log(`🔗 Connecting to your app at ${endpoint}...`);

    this.ws = new WebSocket(endpoint, {
      handshakeTimeout: 10000,
      rejectUnauthorized: false
    });

    this.ws.on('open', () => {
      console.log('✅ Connected to your app!\n');
      this.isReady = true;
      
      // Flush queued messages
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        this.ws.send(JSON.stringify(msg));
      }

      // Start heartbeat
      this.startHeartbeat();
      
      // Announce ready
      this.ws.send(JSON.stringify({
        type: 'connected',
        agent: this.config.config.agentName,
        timestamp: new Date().toISOString()
      }));
    });

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        this.handleAppMessage(msg);
      } catch (err) {
        console.log('📨 Raw from app:', data.toString());
      }
    });

    this.ws.on('error', (err) => {
      console.error('❌ App connection error:', err.message);
    });

    this.ws.on('close', () => {
      console.log('\n🔌 Disconnected from app');
      this.isReady = false;
      setTimeout(() => this.connectToApp(), this.config.config.reconnectInterval);
    });
  }

  handleAgentMessage(line) {
    try {
      const msg = JSON.parse(line);
      
      // Forward agent responses to your app
      if (this.isReady && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'agent_response',
          from: this.config.config.agentName,
          data: msg,
          timestamp: new Date().toISOString()
        }));
      } else {
        this.messageQueue.push({
          type: 'agent_response',
          from: this.config.config.agentName,
          data: msg,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      // Not JSON, treat as text output
      if (this.isReady && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'agent_output',
          from: this.config.config.agentName,
          content: line,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  handleAppMessage(msg) {
    console.log('📨 From app:', msg.type || 'message');
    
    switch (msg.type) {
      case 'chat':
      case 'message':
        // Send user message to agent
        this.sendToAgent(msg.content || msg.text || msg.message);
        break;
        
      case 'command':
        // Execute a tool command
        this.sendToAgent(`/tool ${msg.tool} ${JSON.stringify(msg.params || {})}`);
        break;
        
      case 'ping':
        this.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
        
      default:
        // Forward raw to agent
        this.sendToAgent(JSON.stringify(msg));
    }
  }

  sendToAgent(content) {
    if (this.agent && this.agent.stdin) {
      const msg = typeof content === 'string' ? content : JSON.stringify(content);
      this.agent.stdin.write(msg + '\n');
      console.log('📤 To agent:', msg.substring(0, 100));
    }
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'heartbeat',
          agent: this.config.config.agentName,
          timestamp: new Date().toISOString()
        }));
      }
    }, this.config.config.heartbeatInterval);
  }
}

// Load config
const config = require('./connector.json');
const connector = new OpenClawConnector(config);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  if (connector.ws) connector.ws.close();
  if (connector.agent) connector.agent.kill();
  process.exit(0);
});

connector.start().catch(err => {
  console.error('Connector failed:', err);
  process.exit(1);
});
