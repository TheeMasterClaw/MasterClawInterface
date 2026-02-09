import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import { calendarRouter } from './routes/calendar.js';
import { tasksRouter } from './routes/tasks.js';
import { ttsRouter } from './routes/tts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
await initDb();

// Routes
app.use('/calendar', calendarRouter);
app.use('/tasks', tasksRouter);
app.use('/tts', ttsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MC Backend running on port ${PORT}`);
  console.log(`🔒 Privacy-first. Self-hosted. Yours alone.`);
});
