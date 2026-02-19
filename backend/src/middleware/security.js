import crypto from 'crypto';
import { getTask, getEvent } from '../db.js';

/**
 * Validates that a string is a safe ID format (hexadecimal, 24 chars max)
 * Prevents NoSQL injection attacks via malicious ID parameters
 */
export function isValidId(id) {
  if (typeof id !== 'string') return false;
  // Allow hex strings up to 24 characters (matches crypto.randomBytes(12).toString('hex'))
  return /^[a-f0-9]{1,24}$/i.test(id);
}

/**
 * Middleware to validate ID parameter in routes
 * Usage: router.get('/:id', validateIdParam, (req, res) => { ... })
 */
export function validateIdParam(req, res, next) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ 
      error: 'ID parameter is required',
      code: 'MISSING_ID'
    });
  }
  
  if (!isValidId(id)) {
    return res.status(400).json({ 
      error: 'Invalid ID format',
      code: 'INVALID_ID_FORMAT',
      details: 'ID must be a valid hexadecimal string'
    });
  }
  
  next();
}

/**
 * Middleware to sanitize and validate request body fields
 * Prevents prototype pollution and injection attacks
 */
export function sanitizeBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  // Remove dangerous prototype pollution keys
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous keys
      if (dangerousKeys.includes(key)) {
        console.warn(`[Security] Blocked dangerous key: ${key}`);
        continue;
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = typeof value === 'object' ? sanitizeObject(value) : value;
    }
    return sanitized;
  }
  
  req.body = sanitizeObject(req.body);
  next();
}

/**
 * Middleware to validate task ID exists before processing
 * Combines ID format validation with existence check
 */
export function validateTaskExists(req, res, next) {
  const { id } = req.params;
  
  if (!isValidId(id)) {
    return res.status(400).json({
      error: 'Invalid task ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  const task = getTask(id);
  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      code: 'TASK_NOT_FOUND',
      id
    });
  }
  
  // Attach task to request for downstream use
  req.task = task;
  next();
}

/**
 * Middleware to validate event ID exists before processing
 */
export function validateEventExists(req, res, next) {
  const { id } = req.params;
  
  if (!isValidId(id)) {
    return res.status(400).json({
      error: 'Invalid event ID format',
      code: 'INVALID_ID_FORMAT'
    });
  }
  
  const event = getEvent(id);
  if (!event) {
    return res.status(404).json({
      error: 'Event not found',
      code: 'EVENT_NOT_FOUND',
      id
    });
  }
  
  req.event = event;
  next();
}

/**
 * Validates and sanitizes query parameters
 * Prevents injection attacks via query strings
 * 
 * @param {Object} schema - Validation schema: { paramName: { type: 'string'|'number'|'date'|'enum', enum?: string[], maxLength?: number } }
 * @returns {Function} Express middleware
 */
export function validateQueryParams(schema) {
  return (req, res, next) => {
    const errors = [];
    const sanitized = {};
    
    for (const [key, rules] of Object.entries(schema)) {
      let value = req.query[key];
      
      // Skip undefined values unless required
      if (value === undefined) {
        continue;
      }
      
      // Convert arrays to single value (prevent array injection)
      if (Array.isArray(value)) {
        errors.push({ param: key, error: 'Array values not allowed for this parameter' });
        continue;
      }
      
      // Validate string type
      if (rules.type === 'string') {
        if (typeof value !== 'string') {
          errors.push({ param: key, error: 'Must be a string' });
          continue;
        }
        
        // Check max length
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({ param: key, error: `Must not exceed ${rules.maxLength} characters` });
          continue;
        }
        
        // Check pattern (alphanumeric with common safe chars only)
        if (rules.pattern) {
          if (!rules.pattern.test(value)) {
            errors.push({ param: key, error: 'Contains invalid characters' });
            continue;
          }
        }
        
        sanitized[key] = value.trim();
      }
      
      // Validate enum type
      if (rules.type === 'enum') {
        if (typeof value !== 'string') {
          errors.push({ param: key, error: 'Must be a string' });
          continue;
        }
        
        const normalizedValue = value.toLowerCase().trim();
        if (!rules.enum.includes(normalizedValue)) {
          errors.push({ 
            param: key, 
            error: `Must be one of: ${rules.enum.join(', ')}`,
            received: value
          });
          continue;
        }
        
        sanitized[key] = normalizedValue;
      }
      
      // Validate number type
      if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({ param: key, error: 'Must be a valid number' });
          continue;
        }
        
        // Check min/max bounds
        if (rules.min !== undefined && num < rules.min) {
          errors.push({ param: key, error: `Must be at least ${rules.min}` });
          continue;
        }
        if (rules.max !== undefined && num > rules.max) {
          errors.push({ param: key, error: `Must not exceed ${rules.max}` });
          continue;
        }
        
        sanitized[key] = num;
      }
      
      // Validate date type (ISO 8601)
      if (rules.type === 'date') {
        if (typeof value !== 'string') {
          errors.push({ param: key, error: 'Must be a string' });
          continue;
        }
        
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push({ param: key, error: 'Must be a valid ISO 8601 date' });
          continue;
        }
        
        sanitized[key] = value;
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        code: 'INVALID_QUERY_PARAMS',
        errors
      });
    }
    
    // Attach sanitized values to request
    req.sanitizedQuery = { ...req.query, ...sanitized };
    next();
  };
}

/**
 * Async error wrapper for route handlers
 * Eliminates need for try/catch in every route
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 * Standardizes error responses across the API
 */
export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Handle payload too large (body size exceeded)
  if (err.type === 'entity.too.large' || err.status === 413 || err.message?.includes('payload too large')) {
    const limit = err.limit ? ` (${err.limit} limit)` : '';
    return res.status(413).json({
      error: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE',
      message: `The request body exceeds the maximum allowed size${limit}. Please reduce payload size.`,
      maxSize: err.limit || 'varies by endpoint'
    });
  }

  // Handle specific error types
  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Resource not found',
      code: 'NOT_FOUND'
    });
  }

  // Default server error
  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = err.status || err.statusCode || 500;
  
  // Don't leak internal errors in production
  const isInternalError = statusCode >= 500;
  const message = (isInternalError && !isDev) 
    ? 'Internal server error' 
    : (err.message || 'Internal server error');
  
  res.status(statusCode).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack })
  });
}

/**
 * API Token Authentication Middleware
 * Validates X-API-Token header against MASTERCLAW_API_TOKEN env var
 * Protects all sensitive endpoints from unauthorized access
 */
export function authenticateApiToken(req, res, next) {
  // Skip auth for health checks (monitoring needs this)
  if (req.path === '/health') {
    return next();
  }

  const configuredToken = process.env.MASTERCLAW_API_TOKEN;

  // If no token is configured, warn but allow (backward compatibility for dev)
  // In production, this should be enforced
  if (!configuredToken) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Security] MASTERCLAW_API_TOKEN not set in production!');
      return res.status(500).json({
        error: 'Server misconfiguration: API token not set',
        code: 'SERVER_MISCONFIG'
      });
    }
    // Development mode: warn but continue
    console.warn('[Security] Warning: MASTERCLAW_API_TOKEN not set. API is unprotected!');
    return next();
  }

  // Get token from header
  const providedToken = req.headers['x-api-token'];

  if (!providedToken) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
      message: 'Provide API token in X-API-Token header'
    });
  }

  // Constant-time comparison to prevent timing attacks
  try {
    const configuredBuffer = Buffer.from(configuredToken);
    const providedBuffer = Buffer.from(providedToken);

    if (configuredBuffer.length !== providedBuffer.length) {
      return res.status(401).json({
        error: 'Invalid API token',
        code: 'AUTH_FAILED'
      });
    }

    const match = crypto.timingSafeEqual(configuredBuffer, providedBuffer);

    if (!match) {
      console.warn(`[Security] Invalid API token attempt from ${req.ip} to ${req.path}`);
      return res.status(401).json({
        error: 'Invalid API token',
        code: 'AUTH_FAILED'
      });
    }

    // Token valid, attach minimal auth info to request
    req.auth = { authenticated: true, timestamp: new Date().toISOString() };
    next();
  } catch (err) {
    console.error('[Security] Token comparison error:', err.message);
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

