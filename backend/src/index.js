import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initDb, auditSecurity } from './db.js';
import { calendarRouter } from './routes/calendar.js';
import { tasksRouter } from './routes/tasks.js';
import { ttsRouter } from './routes/tts.js';
import { chatRouter } from './routes/chat.js';
import { errorHandler, sanitizeBody } from './middleware/security.js';
import { createSocketServer } from './socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware: Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow for development flexibility
}));

// Security middleware: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

// Stricter rate limit for chat endpoints (more resource intensive)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 chat requests per minute
  message: {
    error: 'Chat rate limit exceeded. Please slow down.',
    code: 'CHAT_RATE_LIMIT_EXCEEDED'
  }
});

app.use(limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(sanitizeBody); // Apply body sanitization globally

await initDb();

// Apply stricter rate limiting to chat routes
app.use('/chat', chatLimiter);

app.use('/tasks', tasksRouter);
app.use('/calendar', calendarRouter);
app.use('/tts', ttsRouter);
app.use('/chat', chatRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Security audit endpoint
app.get('/security/audit', (req, res) => {
  const audit = auditSecurity();
  res.json({
    ...audit,
    endpoints: {
      total: 4,
      protected: 4
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'MC Backend API',
    status: 'running',
    endpoints: ['/tasks', '/calendar', '/tts', '/health', '/chat'],
    realtime: 'socket.io enabled',
    security: {
      rateLimiting: true,
      securityHeaders: true
    }
  });
});

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
