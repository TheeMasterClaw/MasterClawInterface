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
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack })
  });
}
