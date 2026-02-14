import { Server } from 'socket.io';
import { processChatMessage } from './services/chatGateway.js';

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.FRONTEND_URL?.split(',').map((origin) => origin.trim()) || '*',
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

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


    socket.on('ping', () => {
      socket.emit('pong', { ts: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected (${socket.id}): ${reason}`);
    });
  });

  return io;
}
