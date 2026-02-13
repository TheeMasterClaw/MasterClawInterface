import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initDb } from './db.js';
import { calendarRouter } from './routes/calendar.js';
import { tasksRouter } from './routes/tasks.js';
import { ttsRouter } from './routes/tts.js';
import { chatRouter } from './routes/chat.js';
import { errorHandler, sanitizeBody } from './middleware/security.js';
import { createSocketServer } from './socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(sanitizeBody); // Apply body sanitization globally

await initDb();

app.use('/tasks', tasksRouter);
app.use('/calendar', calendarRouter);
app.use('/tts', ttsRouter);
app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'MC Backend API',
    status: 'running',
    endpoints: ['/tasks', '/calendar', '/tts', '/health', '/chat'],
    realtime: 'socket.io enabled'
  });
});

<<<<<<< HEAD
// Global error handler - must be last
app.use(errorHandler);

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MC Backend running on port ${PORT}`);
  console.log('🔌 Socket.IO server enabled');
  console.log('🔒 Privacy-first. Self-hosted. Yours alone.');
  console.log(`📍 URL: http://localhost:${PORT}`);
});
