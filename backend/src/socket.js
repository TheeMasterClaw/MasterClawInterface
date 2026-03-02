import { Server } from 'socket.io';
import { setIOServer } from './services/chatGateway.js';
import {
  registerSkill,
  listSkills,
  removeSkillsBySocket,
  invokeSkill,
} from './services/skillRegistry.js';
import { initSwarmBridge, getSwarmBridge } from './services/swarmBridge.js';
import { mapSwarmToInbound, extractMessageText } from './services/swarmMapper.js';

// Shared allowed origins - must match backend CORS config
const ALLOWED_ORIGINS = [
  'https://master-claw-interface.vercel.app',
  'https://master-claw-interface-git-main-rex-deus-projects.vercel.app',
  'https://master-claw-interface-fcsw1431m-yeeeee.vercel.app',
  'https://www.offmarketproperties.xyz',
  'https://offmarketproperties.xyz',
  'https://masterclaw-interface.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:3001',
  // Allow skill connections from any origin (for OpenClaw skills)
  '*',
];

// Helper to check if origin is allowed (including Vercel preview deployments)
function isOriginAllowed(origin) {
  // Allow all origins for skill connections during development
  if (process.env.NODE_ENV === 'development' || process.env.ALLOW_ALL_ORIGINS === 'true') {
    return true;
  }

  if (!origin) return true; // Allow non-browser clients (skills)
  if (ALLOWED_ORIGINS.includes('*')) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Allow Vercel preview deployments (they have random hashes)
  if (origin?.match(/^https:\/\/master-claw-interface-[a-z0-9]+-yeeeee\.vercel\.app$/)) return true;
  if (origin?.match(/^https:\/\/masterclaw-interface-[a-z0-9]+-yeeeee\.vercel\.app$/)) return true;

  return false;
}

// Add FRONTEND_URL env var origins if provided
if (process.env.FRONTEND_URL) {
  const envOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
  envOrigins.forEach(origin => {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      ALLOWED_ORIGINS.push(origin);
    }
  });
}

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST']
    },
    // Enable both websocket and polling transports for compatibility
    transports: ['websocket', 'polling'],
    // Ping configuration for connection stability
    pingTimeout: 60000,
    pingInterval: 25000,
    // Connection state recovery
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    }
  });

  // Provide the IO server to the chat gateway so it can route
  // messages to skill providers (federated, inbound agents).
  setIOServer(io);

  // Log connection errors for debugging
  io.engine.on('connection_error', (err) => {
    console.log('[Socket.IO] Connection error:', {
      code: err.code,
      message: err.message,
      context: err.context
    });
  });

  io.on('connection', (socket) => {
    const agentId = socket.handshake.auth?.agentId || null;
    console.log(`🔌 Socket connected: ${socket.id}`, {
      origin: socket.handshake.headers.origin,
      transport: socket.conn.transport.name,
      address: socket.handshake.address,
      agentId
    });

    socket.emit('gateway:status', { status: 'connected' });

    // Notify all clients that an agent connected
    if (agentId) {
      io.emit('agent:connected', { socketId: socket.id, agentId });
    }

    socket.on('chat:message', async (payload = {}, ack) => {
      try {
        const { message, saveHistory = true } = payload;
        const result = await processChatMessage({ message, saveHistory });

        socket.emit('chat:response', result);
        if (typeof ack === 'function') ack({ ok: true, ...result });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        const payloadError = error.payload || { error: 'Socket message failed', text: error.message };

        socket.emit('chat:error', payloadError);
        if (typeof ack === 'function') ack({ ok: false, statusCode, ...payloadError });
      }
    });

    // Skill registration via WebSocket
    socket.on('skill:register', (payload = {}, ack) => {
      try {
        const skill = registerSkill({ ...payload, socketId: socket.id });
        console.log(`🧩 Skill registered: ${skill.name} (/${skill.trigger}) by ${socket.id}`);
        io.emit('skill:registered', skill);
        if (typeof ack === 'function') ack({ ok: true, skill });
      } catch (error) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: error.message });
        }
      }
    });

    // List skills via WebSocket
    socket.on('skill:list', (payload = {}, ack) => {
      const skills = listSkills(payload);
      if (typeof ack === 'function') ack({ ok: true, skills });
    });

    // Invoke a skill via WebSocket
    socket.on('skill:invoke', async (payload = {}, ack) => {
      try {
        const { trigger, params = {} } = payload;
        const result = await invokeSkill(trigger, params);

        // If the skill is socket-based, forward the invocation to the bot
        if (result.type === 'socket' && result.socketId) {
          const targetSocket = io.sockets.sockets.get(result.socketId);
          if (targetSocket) {
            targetSocket.emit('skill:execute', {
              trigger: result.skill,
              params: result.params,
              requesterId: socket.id,
            });
          } else {
            if (typeof ack === 'function') {
              ack({ ok: false, error: 'Skill provider is disconnected' });
            }
            return;
          }
        }

        if (typeof ack === 'function') ack({ ok: true, ...result });
      } catch (error) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: error.message });
        }
      }
    });

    // Skill execution result (sent by the bot after processing)
    socket.on('skill:result', (payload = {}) => {
      const { requesterId, trigger, result } = payload;
      if (requesterId) {
        const requester = io.sockets.sockets.get(requesterId);
        if (requester) {
          requester.emit('skill:response', { trigger, result });
        }
      }
    });

    socket.on('ping', () => {
      socket.emit('pong', { ts: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      // Clean up skills registered by this socket
      const removed = removeSkillsBySocket(socket.id);
      if (removed > 0) {
        console.log(`🧩 Removed ${removed} skill(s) from disconnected socket ${socket.id}`);
        io.emit('skill:unregistered', { socketId: socket.id, count: removed });
      }

      // Notify all clients that an agent disconnected
      if (agentId) {
        io.emit('agent:disconnected', { socketId: socket.id, agentId, reason });
      }

      console.log(`🔌 Socket disconnected (${socket.id}): ${reason}`);
    });
  });

  // =========================================================================
  // Swarm WebSocket Bridge — outbound connection to Swarm Hub
  // =========================================================================
  const bridge = initSwarmBridge();
  if (bridge) {
    // When the bridge receives a Swarm message, inject it into the chat pipeline
    bridge.on('message', (swarmMsg) => {
      try {
        const inbound = mapSwarmToInbound(swarmMsg);
        const messageText = extractMessageText(inbound);

        if (messageText) {
          // Broadcast that a Swarm message arrived (for frontend display)
          io.emit('swarm:message', {
            channel: 'swarm',
            sender: inbound.sender,
            text: messageText,
            timestamp: inbound.message.timestamp,
            swarm_channel_id: inbound.swarm_channel_id,
            swarm_message_id: inbound.swarm_message_id,
          });

          console.log(`[Swarm] Message from ${inbound.sender.name}: ${messageText.slice(0, 80)}…`);
        }
      } catch (err) {
        console.error('[Swarm] Failed to process message:', err);
      }
    });

    bridge.on('connected', () => {
      io.emit('swarm:status', { state: 'connected' });
    });

    bridge.on('live', () => {
      io.emit('swarm:status', { state: 'live' });
      console.log('[Swarm] Bridge is live — streaming real-time messages');
    });

    bridge.on('disconnected', ({ code, reason }) => {
      io.emit('swarm:status', { state: 'disconnected', code, reason });
    });

    bridge.on('reconnecting', ({ attempt, delay }) => {
      io.emit('swarm:status', { state: 'reconnecting', attempt, delay });
    });

    bridge.on('error', (err) => {
      console.error('[Swarm] Bridge error:', err.message);
      io.emit('swarm:status', { state: 'error', error: err.message });
    });

    // Auto-connect on startup
    bridge.connect().catch((err) => {
      console.error('[Swarm] Initial connect failed:', err.message);
    });

    console.log('🌐 Swarm bridge initialised');
  }

  return io;
}
