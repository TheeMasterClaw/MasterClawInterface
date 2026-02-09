import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { calendarRouter } from './routes/calendar.js';
import { tasksRouter } from './routes/tasks.js';
import { ttsRouter } from './routes/tts.js';
import { chatRouter } from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Initialize database
await initDb();

// Routes
app.use('/tasks', tasksRouter);
app.use('/calendar', calendarRouter);
app.use('/tts', ttsRouter);
app.use('/chat', chatRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MC Backend API',
    status: 'running',
    endpoints: ['/tasks', '/calendar', '/tts', '/health']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MC Backend running on port ${PORT}`);
  console.log(`🔒 Privacy-first. Self-hosted. Yours alone.`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
