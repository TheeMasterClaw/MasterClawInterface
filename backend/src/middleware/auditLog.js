/**
 * Security Audit Logging Module
 * 
 * Provides structured logging for security events including:
 * - Authentication attempts (success/failure)
 * - Access control violations
 * - Sensitive data access
 * - Configuration changes
 * - Security policy violations
 * 
 * Logs are written in structured JSON format for easy ingestion
 * into SIEM systems and security monitoring tools.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default configuration
const DEFAULT_LOG_DIR = path.join(__dirname, '../../logs');
const DEFAULT_LOG_FILE = 'security-audit.log';
const DEFAULT_MAX_LOG_SIZE = 10485760; // 10MB
const DEFAULT_MAX_LOG_FILES = 5;

// Getters for configuration (allows runtime changes for testing)
function getAuditLogDir() {
  return process.env.AUDIT_LOG_DIR || DEFAULT_LOG_DIR;
}

function getAuditLogFile() {
  return process.env.AUDIT_LOG_FILE || DEFAULT_LOG_FILE;
}

function getMaxLogSize() {
  return parseInt(process.env.AUDIT_MAX_LOG_SIZE || DEFAULT_MAX_LOG_SIZE, 10);
}

function getMaxLogFiles() {
  return parseInt(process.env.AUDIT_MAX_LOG_FILES || DEFAULT_MAX_LOG_FILES, 10);
}

// Ensure audit log directory exists with secure permissions
function ensureAuditLogDir() {
  const dir = getAuditLogDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Secure permissions: owner read/write/execute only
  try {
    fs.chmodSync(dir, 0o700);
  } catch (err) {
    console.error(`[Security Audit] Failed to set secure permissions on log directory: ${err.message}`);
  }
}

ensureAuditLogDir();

/**
 * Security event types
 */
export const SecurityEventType = {
  // Authentication events
  AUTH_SUCCESS: 'auth:success',
  AUTH_FAILURE: 'auth:failure',
  AUTH_LOGOUT: 'auth:logout',
  
  // Access control events
  ACCESS_DENIED: 'access:denied',
  ACCESS_GRANTED: 'access:granted',
  
  // Data access events
  DATA_ACCESS: 'data:access',
  DATA_MODIFICATION: 'data:modification',
  DATA_DELETION: 'data:deletion',
  
  // Security violations
  RATE_LIMIT_EXCEEDED: 'security:rate_limit_exceeded',
  INVALID_INPUT: 'security:invalid_input',
  SUSPICIOUS_ACTIVITY: 'security:suspicious_activity',
  CSP_VIOLATION: 'security:csp_violation',
  
  // Configuration events
  CONFIG_CHANGE: 'config:change',
  
  // System events
  SYSTEM_ERROR: 'system:error',
  SYSTEM_STARTUP: 'system:startup',
};

/**
 * Severity levels for security events
 */
export const Severity = {
  CRITICAL: 'critical',  // Immediate action required (breach, data leak)
  HIGH: 'high',          // Significant security concern
  MEDIUM: 'medium',      // Policy violation, suspicious activity
  LOW: 'low',            // Routine security events
  INFO: 'info',          // Informational (successful auth)
};

/**
 * Get the full path to the current audit log file
 */
function getAuditLogPath() {
  return path.join(getAuditLogDir(), getAuditLogFile());
}

/**
 * Rotate log files if current log exceeds max size
 */
function rotateLogsIfNeeded() {
  const logPath = getAuditLogPath();
  const maxFiles = getMaxLogFiles();
  
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      if (stats.size >= getMaxLogSize()) {
        // Rotate existing log files
        for (let i = maxFiles - 1; i > 0; i--) {
          const oldPath = `${logPath}.${i}`;
          const newPath = `${logPath}.${i + 1}`;
          
          if (fs.existsSync(oldPath)) {
            if (i === maxFiles - 1) {
              // Delete oldest log
              fs.unlinkSync(oldPath);
            } else {
              fs.renameSync(oldPath, newPath);
            }
          }
        }
        
        // Move current log to .1
        fs.renameSync(logPath, `${logPath}.1`);
      }
    }
  } catch (err) {
    console.error(`[Security Audit] Log rotation failed: ${err.message}`);
  }
}

/**
 * Sanitize sensitive data from log entries
 * Removes passwords, tokens, and other sensitive fields
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'api_key', 'apikey', 
    'authorization', 'auth', 'credential', 'private_key',
    'x-api-token', 'x-api-key', 'cookie'
  ];
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Generate a unique event ID for correlation
 */
function generateEventId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Get client IP address from request
 */
function getClientIp(req) {
  return req.headers?.['x-forwarded-for'] || 
         req.headers?.['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip ||
         'unknown';
}

/**
 * Write audit log entry to file
 */
function writeAuditLog(entry) {
  rotateLogsIfNeeded();
  
  const logLine = JSON.stringify(entry) + '\n';
  
  try {
    fs.appendFileSync(getAuditLogPath(), logLine, { mode: 0o600 });
  } catch (err) {
    console.error(`[Security Audit] Failed to write audit log: ${err.message}`);
    // Fallback to console - never lose security events
    console.error('[SECURITY AUDIT FALLBACK]', entry);
  }
}

/**
 * Log a security event
 * 
 * @param {string} eventType - Type of security event (use SecurityEventType constants)
 * @param {string} severity - Severity level (use Severity constants)
 * @param {Object} details - Event details (will be sanitized)
 * @param {Object} options - Additional options
 * @param {Request} options.req - Express request object for auto-extracting context
 * @param {string} options.userId - ID of user performing the action
 * @param {string} options.resource - Resource being accessed/modified
 * @param {string} options.action - Action being performed
 * @param {Object} options.metadata - Additional metadata
 */
export function logSecurityEvent(eventType, severity, details = {}, options = {}) {
  const eventId = generateEventId();
  const timestamp = new Date().toISOString();
  
  const entry = {
    event_id: eventId,
    timestamp,
    event_type: eventType,
    severity,
    details: sanitizeData(details),
  };
  
  // Add request context if provided
  if (options.req) {
    entry.client_ip = getClientIp(options.req);
    entry.user_agent = options.req.headers?.['user-agent'] || 'unknown';
    entry.request_method = options.req.method;
    entry.request_path = options.req.path || options.req.url;
    entry.request_id = options.req.headers?.['x-request-id'] || options.req.id;
  }
  
  // Add optional fields
  if (options.userId) entry.user_id = options.userId;
  if (options.resource) entry.resource = options.resource;
  if (options.action) entry.action = options.action;
  if (options.metadata) entry.metadata = sanitizeData(options.metadata);
  
  // Add environment info
  entry.environment = process.env.NODE_ENV || 'development';
  entry.service = 'masterclaw-backend';
  
  writeAuditLog(entry);
  
  // Also log critical/high severity events to console for immediate visibility
  if (severity === Severity.CRITICAL || severity === Severity.HIGH) {
    console.error(`[SECURITY ${severity.toUpperCase()}] ${eventType}: ${JSON.stringify(sanitizeData(details))}`);
  }
  
  return eventId;
}

/**
 * Convenience method for logging authentication events
 */
export function logAuthEvent(success, req, details = {}) {
  const eventType = success ? SecurityEventType.AUTH_SUCCESS : SecurityEventType.AUTH_FAILURE;
  const severity = success ? Severity.INFO : Severity.HIGH;
  
  return logSecurityEvent(eventType, severity, details, { req });
}

/**
 * Convenience method for logging access control events
 */
export function logAccessEvent(granted, req, resource, details = {}) {
  const eventType = granted ? SecurityEventType.ACCESS_GRANTED : SecurityEventType.ACCESS_DENIED;
  const severity = granted ? Severity.INFO : Severity.MEDIUM;
  
  return logSecurityEvent(eventType, severity, details, { 
    req, 
    resource,
    action: granted ? 'access_granted' : 'access_denied'
  });
}

/**
 * Convenience method for logging data modification events
 */
export function logDataEvent(action, req, resource, details = {}) {
  let eventType;
  switch (action) {
    case 'create':
    case 'update':
      eventType = SecurityEventType.DATA_MODIFICATION;
      break;
    case 'delete':
      eventType = SecurityEventType.DATA_DELETION;
      break;
    case 'access':
    default:
      eventType = SecurityEventType.DATA_ACCESS;
  }
  
  return logSecurityEvent(eventType, Severity.LOW, details, {
    req,
    resource,
    action
  });
}

/**
 * Convenience method for logging security violations
 */
export function logSecurityViolation(violationType, req, details = {}) {
  let eventType;
  let severity = Severity.MEDIUM;
  
  switch (violationType) {
    case 'rate_limit':
      eventType = SecurityEventType.RATE_LIMIT_EXCEEDED;
      break;
    case 'invalid_input':
      eventType = SecurityEventType.INVALID_INPUT;
      severity = Severity.LOW;
      break;
    case 'suspicious':
    default:
      eventType = SecurityEventType.SUSPICIOUS_ACTIVITY;
      severity = Severity.HIGH;
  }
  
  return logSecurityEvent(eventType, severity, details, { req });
}

/**
 * Get recent audit log entries
 * Useful for admin dashboards and security monitoring
 * 
 * @param {Object} options - Query options
 * @param {number} options.lines - Number of recent lines to return (default: 100)
 * @param {string} options.eventType - Filter by event type
 * @param {string} options.severity - Filter by severity
 * @param {string} options.since - ISO timestamp to get entries since
 * @returns {Array} Array of audit log entries
 */
export function getRecentAuditLogs(options = {}) {
  const { lines = 100, eventType, severity, since } = options;
  
  try {
    const logPath = getAuditLogPath();
    if (!fs.existsSync(logPath)) {
      return [];
    }
    
    const content = fs.readFileSync(logPath, 'utf-8');
    const allLines = content.trim().split('\n').filter(line => line);
    
    // Parse and filter entries
    let entries = allLines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    // Apply filters
    if (eventType) {
      entries = entries.filter(e => e.event_type === eventType);
    }
    if (severity) {
      entries = entries.filter(e => e.severity === severity);
    }
    if (since) {
      const sinceDate = new Date(since);
      entries = entries.filter(e => new Date(e.timestamp) >= sinceDate);
    }
    
    // Return most recent entries
    return entries.slice(-lines);
  } catch (err) {
    console.error(`[Security Audit] Failed to read audit logs: ${err.message}`);
    return [];
  }
}

/**
 * Express middleware to log all requests for security audit
 * Should be applied early in the middleware chain
 */
export function auditLogMiddleware(req, res, next) {
  // Store start time for calculating request duration
  req._auditStartTime = Date.now();
  
  // Capture response finish for logging
  const originalEnd = res.end;
  res.end = function(...args) {
    res.end = originalEnd;
    res.end.apply(res, args);
    
    // Determine if this was an error response
    const isError = res.statusCode >= 400;
    const isAuthEndpoint = req.path.includes('/auth') || req.path.includes('/login');
    
    // Log authentication failures
    if (isAuthEndpoint && isError) {
      logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        Severity.HIGH,
        { status_code: res.statusCode, path: req.path },
        { req }
      );
    }
    
    // Log access denied responses
    if (res.statusCode === 403) {
      logSecurityEvent(
        SecurityEventType.ACCESS_DENIED,
        Severity.MEDIUM,
        { status_code: res.statusCode },
        { req }
      );
    }
  };
  
  next();
}

/**
 * Get security audit statistics
 * Useful for dashboards and monitoring
 */
export function getAuditStats(since = null) {
  const logs = getRecentAuditLogs({ lines: 10000, since });
  
  const stats = {
    total_events: logs.length,
    by_severity: {},
    by_type: {},
    recent_failures: [],
    time_range: {
      start: logs.length > 0 ? logs[0].timestamp : null,
      end: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
    }
  };
  
  for (const log of logs) {
    // Count by severity
    stats.by_severity[log.severity] = (stats.by_severity[log.severity] || 0) + 1;
    
    // Count by type
    stats.by_type[log.event_type] = (stats.by_type[log.event_type] || 0) + 1;
    
    // Track recent failures (auth/access/security)
    if ([SecurityEventType.AUTH_FAILURE, SecurityEventType.ACCESS_DENIED, SecurityEventType.SUSPICIOUS_ACTIVITY].includes(log.event_type)) {
      if (stats.recent_failures.length < 10) {
        stats.recent_failures.push({
          timestamp: log.timestamp,
          type: log.event_type,
          client_ip: log.client_ip,
          path: log.request_path,
        });
      }
    }
  }
  
  return stats;
}

/**
 * Log a CSP (Content Security Policy) violation
 * CSP violations indicate potential XSS attacks or resource loading issues
 * 
 * @param {Object} violation - CSP violation report from browser
 * @param {Object} req - Express request object
 * @returns {string} Event ID
 */
export function logCspViolation(violation, req) {
  // Determine severity based on violation type
  let severity = Severity.LOW;
  
  // Blocked scripts are higher severity (potential XSS)
  if (violation['blocked-uri']?.includes('script') || 
      violation['violated-directive']?.includes('script-src')) {
    severity = Severity.HIGH;
  }
  
  // Inline script violations are suspicious
  if (violation['violated-directive']?.includes('inline')) {
    severity = Severity.MEDIUM;
  }
  
  return logSecurityEvent(
    SecurityEventType.CSP_VIOLATION,
    severity,
    {
      document_uri: violation['document-uri'],
      referrer: violation['referrer'],
      blocked_uri: violation['blocked-uri'],
      violated_directive: violation['violated-directive'],
      original_policy: violation['original-policy'],
      source_file: violation['source-file'],
      line_number: violation['line-number'],
      column_number: violation['column-number'],
    },
    { req }
  );
}

export default {
  logSecurityEvent,
  logAuthEvent,
  logAccessEvent,
  logDataEvent,
  logSecurityViolation,
  getRecentAuditLogs,
  getAuditStats,
  auditLogMiddleware,
  SecurityEventType,
  Severity,
};
