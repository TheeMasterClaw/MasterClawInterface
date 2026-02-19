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
import { skillsRouter } from './routes/skills.js';
import { snippetsRouter } from './routes/snippets.js';
import { skillsTrackerRouter } from './routes/skillsTracker.js';
import systemRouter from './routes/system.js';
import projectsRouter from './routes/projects.js';
import resourcesRouter from './routes/resources.js';
import contactsRouter from './routes/contacts.js';
import todayRouter from './routes/today.js';
import { errorHandler, sanitizeBody, authenticateApiToken } from './middleware/security.js';
import { requestTimeout, timeoutFor } from './middleware/timeout.js';
import { auditLogMiddleware, getRecentAuditLogs, getAuditStats, logSecurityEvent, logCspViolation, SecurityEventType, Severity } from './middleware/auditLog.js';
import { createSocketServer } from './socket.js';

dotenv.config();

const app = express();

// Trust proxy headers from Railway/load balancer (required for express-rate-limit)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;

// Security Audit: Log all requests for security monitoring
// Must be applied early to capture all requests
app.use(auditLogMiddleware);

// Security middleware: Helmet for security headers
// CSP report-uri is configured to enable browsers to report violations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      reportUri: '/security/csp-report',
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

// CSP report rate limiter - more permissive but still protected against abuse
// Browsers can send many reports, so we allow more requests
const cspReportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 CSP reports per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'CSP report rate limit exceeded.',
    code: 'CSP_REPORT_RATE_LIMIT_EXCEEDED'
  },
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

app.use(limiter);

// =============================================================================
// CORS Configuration
// =============================================================================
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

// CORS middleware with explicit origin validation
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (non-browser clients, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin} not in allowed list`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors(corsOptions));

// Security: Body size limits to prevent DoS via large payloads
// 100KB for general API requests, 1MB for TTS (text can be large)
const GENERAL_BODY_LIMIT = process.env.BODY_LIMIT_GENERAL || '100kb';
const TTS_BODY_LIMIT = process.env.BODY_LIMIT_TTS || '1mb';

const parseGeneralJson = express.json({
  limit: GENERAL_BODY_LIMIT,
  verify: (req, res, buf) => {
    // Store raw body for potential signature verification
    req.rawBody = buf;
  }
});

const parseTtsJson = express.json({
  limit: TTS_BODY_LIMIT,
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
});

// Choose parser by route so /tts is not constrained by the general body limit
app.use((req, res, next) => {
  if (req.path.startsWith('/tts')) {
    return parseTtsJson(req, res, next);
  }
  return parseGeneralJson(req, res, next);
});

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
app.use('/skills', skillsRouter);
app.use('/snippets', snippetsRouter);
app.use('/system', systemRouter);
app.use('/skills-tracker', skillsTrackerRouter);
app.use('/projects', projectsRouter);
app.use('/resources', resourcesRouter);
app.use('/contacts', contactsRouter);
app.use('/today', todayRouter);

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

// =============================================================================
// CSP (Content Security Policy) Violation Reporting
// =============================================================================

/**
 * POST /security/csp-report
 * Receive CSP violation reports from browsers
 * Browsers automatically send reports when CSP violations occur
 * This helps detect XSS attacks and misconfigurations
 */
app.post('/security/csp-report', cspReportLimiter, express.json({ limit: '50kb' }), (req, res) => {
  // Browsers send CSP reports with a 'csp-report' field
  const report = req.body?.['csp-report'] || req.body;
  
  if (!report || typeof report !== 'object') {
    return res.status(400).json({ 
      error: 'Invalid CSP report format',
      code: 'INVALID_CSP_REPORT'
    });
  }
  
  // Log the CSP violation
  const eventId = logCspViolation(report, req);
  
  // Return 204 No Content - browsers don't expect a response body
  res.status(204).send();
});

/**
 * GET /security/csp-violations
 * Retrieve recent CSP violations for security monitoring
 * Filterable by severity and time range
 */
app.get('/security/csp-violations', (req, res) => {
  const { lines = 100, severity, since, blockedUri } = req.query;
  
  const options = {
    lines: parseInt(lines, 10) || 100,
    eventType: SecurityEventType.CSP_VIOLATION,
    severity,
    since
  };
  
  let violations = getRecentAuditLogs(options);
  
  // Additional filter for blocked URI pattern
  if (blockedUri) {
    violations = violations.filter(v => 
      v.details?.blocked_uri?.includes(blockedUri)
    );
  }
  
  // Calculate summary statistics
  const summary = {
    total: violations.length,
    by_severity: {},
    by_directive: {},
    common_blocked_uris: {}
  };
  
  for (const v of violations) {
    const sev = v.severity;
    const directive = v.details?.violated_directive || 'unknown';
    const blockedUri = v.details?.blocked_uri || 'unknown';
    
    summary.by_severity[sev] = (summary.by_severity[sev] || 0) + 1;
    summary.by_directive[directive] = (summary.by_directive[directive] || 0) + 1;
    summary.common_blocked_uris[blockedUri] = (summary.common_blocked_uris[blockedUri] || 0) + 1;
  }
  
  res.json({
    count: violations.length,
    summary,
    violations: violations.map(v => ({
      event_id: v.event_id,
      timestamp: v.timestamp,
      severity: v.severity,
      document_uri: v.details?.document_uri,
      blocked_uri: v.details?.blocked_uri,
      violated_directive: v.details?.violated_directive,
      source_file: v.details?.source_file,
      line_number: v.details?.line_number,
      client_ip: v.client_ip,
      user_agent: v.user_agent
    })),
    filters: { severity, since, blockedUri }
  });
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
    endpoints: ['/tasks', '/calendar', '/time', '/tts', '/health', '/chat', '/skills', '/snippets', '/projects', '/resources', '/contacts', '/today'],
    realtime: 'socket.io enabled',
    security: {
      rateLimiting: true,
      securityHeaders: true,
      apiAuth: !!process.env.MASTERCLAW_API_TOKEN,
      bodySizeLimit: GENERAL_BODY_LIMIT,
      requestTimeout: REQUEST_TIMEOUT_MS,
      auditLogging: true,
      cspReporting: true
    },
    audit: {
      endpoints: [
        '/security/audit',
        '/security/audit/logs',
        '/security/audit/stats',
        '/security/csp-report',
        '/security/csp-violations'
      ],
      description: 'Security audit logging, CSP violation reporting, and monitoring'
    }
  });
});

// 404 handler - return JSON for API requests, prevents HTML 404 pages
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
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
  console.log(`🌐 CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
