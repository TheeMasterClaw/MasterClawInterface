import { Server } from 'socket.io';
import { processChatMessage } from './services/chatGateway.js';
import {
  registerSkill,
  listSkills,
  removeSkillsBySocket,
  invokeSkill,
} from './services/skillRegistry.js';

// Shared allowed origins - must match backend CORS config
const ALLOWED_ORIGINS = [
  'https://master-claw-interface.vercel.app',
  'https://master-claw-interface-git-main-rex-deus-projects.vercel.app',
  'https://master-claw-interface-fcsw1431m-yeeeee.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
];

// Helper to check if origin is allowed (including Vercel preview deployments)
function isOriginAllowed(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Allow Vercel preview deployments (they have random hashes)
  if (origin?.match(/^https:\/\/master-claw-interface-[a-z0-9]+-yeeeee\.vercel\.app$/)) return true;
  
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

  // Log connection errors for debugging
  io.engine.on('connection_error', (err) => {
    console.log('[Socket.IO] Connection error:', {
      code: err.code,
      message: err.message,
      context: err.context
    });
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`, {
      origin: socket.handshake.headers.origin,
      transport: socket.conn.transport.name,
      address: socket.handshake.address
    });

    socket.emit('gateway:status', { status: 'connected' });

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
      console.log(`🔌 Socket disconnected (${socket.id}): ${reason}`);
    });
  });

  return io;
}
