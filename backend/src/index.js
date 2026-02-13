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
import { timeRouter } from './routes/time.js';
import { errorHandler, sanitizeBody, authenticateApiToken } from './middleware/security.js';
import { requestTimeout, timeoutFor } from './middleware/timeout.js';
import { auditLogMiddleware, getRecentAuditLogs, getAuditStats, logSecurityEvent, SecurityEventType, Severity } from './middleware/auditLog.js';
import { createSocketServer } from './socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Audit: Log all requests for security monitoring
// Must be applied early to capture all requests
app.use(auditLogMiddleware);

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

// Security: Body size limits to prevent DoS via large payloads
// 100KB for general API requests, 1MB for TTS (text can be large)
const GENERAL_BODY_LIMIT = process.env.BODY_LIMIT_GENERAL || '100kb';
const TTS_BODY_LIMIT = process.env.BODY_LIMIT_TTS || '1mb';

app.use(express.json({ 
  limit: GENERAL_BODY_LIMIT,
  verify: (req, res, buf) => {
    // Store raw body for potential signature verification
    req.rawBody = buf;
  }
}));

// TTS endpoint needs larger body limit for long text
app.use('/tts', express.json({ limit: TTS_BODY_LIMIT }));

app.use(sanitizeBody); // Apply body sanitization globally

// Security: Request timeout to prevent slowloris attacks and resource exhaustion
// 30s default, skipped for health checks to allow monitoring
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
app.use(requestTimeout(REQUEST_TIMEOUT_MS, { skipPaths: ['/health'] }));

// Apply API token authentication to all routes except health
app.use(authenticateApiToken);

await initDb();

// Apply stricter rate limiting to chat routes
app.use('/chat', chatLimiter);

app.use('/tasks', tasksRouter);
app.use('/calendar', calendarRouter);
app.use('/time', timeRouter);
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

// Security audit log endpoints
app.get('/security/audit/logs', (req, res) => {
  const { lines = 100, eventType, severity, since } = req.query;
  
  const options = {
    lines: parseInt(lines, 10) || 100,
    eventType,
    severity,
    since
  };
  
  const logs = getRecentAuditLogs(options);
  res.json({
    count: logs.length,
    logs,
    filters: { eventType, severity, since }
  });
});

app.get('/security/audit/stats', (req, res) => {
  const { since } = req.query;
  const stats = getAuditStats(since);
  res.json(stats);
});

// Log system startup for security audit
logSecurityEvent(
  SecurityEventType.SYSTEM_STARTUP,
  Severity.INFO,
  { port: PORT, version: process.env.npm_package_version || 'unknown' }
);

app.get('/', (req, res) => {
  res.json({
    message: 'MC Backend API',
    status: 'running',
    endpoints: ['/tasks', '/calendar', '/time', '/tts', '/health', '/chat'],
    realtime: 'socket.io enabled',
    security: {
      rateLimiting: true,
      securityHeaders: true,
      apiAuth: !!process.env.MASTERCLAW_API_TOKEN,
      bodySizeLimit: GENERAL_BODY_LIMIT,
      requestTimeout: REQUEST_TIMEOUT_MS,
      auditLogging: true
    },
    audit: {
      endpoints: ['/security/audit', '/security/audit/logs', '/security/audit/stats'],
      description: 'Security audit logging and monitoring'
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
