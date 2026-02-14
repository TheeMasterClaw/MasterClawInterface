/**
 * Request timeout middleware for Express
 * Prevents slowloris attacks and resource exhaustion from hanging connections
 */

// Default timeout: 30 seconds for most requests
const DEFAULT_TIMEOUT_MS = 30000;

// Extended timeout for resource-intensive endpoints (TTS, file uploads)
const EXTENDED_TIMEOUT_MS = 120000;

/**
 * Creates timeout middleware with configurable duration
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {Object} options - Additional options
 * @param {string[]} options.skipPaths - Paths to skip timeout (e.g., health checks)
 * @returns {Function} Express middleware
 */
export function requestTimeout(timeoutMs = DEFAULT_TIMEOUT_MS, options = {}) {
  const { skipPaths = [] } = options;

  return (req, res, next) => {
    // Skip timeout for specified paths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Track if response has been sent
    let responded = false;

    // Guard double-writes after timeout by patching response methods.
    // This prevents "Cannot set headers after they are sent" in async handlers
    // that resolve after we already sent a timeout response.
    let isTimingOut = false;
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    res.json = (...args) => {
      if ((responded || req.timedout) && !isTimingOut) return res;
      if (res.headersSent) return res;
      return originalJson(...args);
    };

    res.send = (...args) => {
      if ((responded || req.timedout) && !isTimingOut) return res;
      if (res.headersSent) return res;
      return originalSend(...args);
    };

    res.end = (...args) => {
      if ((responded || req.timedout) && !isTimingOut) return res;
      return originalEnd(...args);
    };

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!responded) {
        responded = true;
        req.timedout = true;
        
        // Log timeout for monitoring
        console.warn(`[Timeout] Request timeout: ${req.method} ${req.path} from ${req.ip}`);
        
        // Send timeout response
        if (!res.headersSent) {
          isTimingOut = true;
          res.status(408).json({
            error: 'Request timeout',
            code: 'REQUEST_TIMEOUT',
            message: `Request exceeded ${timeoutMs}ms timeout limit`,
            suggestion: 'Try again with a smaller payload or contact support if the issue persists'
          });
          isTimingOut = false;
        }
        
      }
    }, timeoutMs);

    // Clean up timeout when response is sent
    const cleanup = () => {
      if (!responded) {
        responded = true;
        clearTimeout(timeoutId);
      }
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);

    // Attach timeout info to request for logging/debugging
    req.timeoutMs = timeoutMs;
    req.timeoutId = timeoutId;

    next();
  };
}

/**
 * Middleware factory for endpoint-specific timeouts
 * Usage: app.post('/tts', timeoutFor('tts'), handler)
 */
export function timeoutFor(endpointType) {
  const timeouts = {
    tts: EXTENDED_TIMEOUT_MS,        // TTS can take longer for large text
    upload: EXTENDED_TIMEOUT_MS,     // File uploads need more time
    default: DEFAULT_TIMEOUT_MS
  };

  const timeoutMs = timeouts[endpointType] || timeouts.default;
  return requestTimeout(timeoutMs);
}

/**
 * Health check to verify server responsiveness
 * Returns current timeout configuration
 */
export function getTimeoutStatus() {
  return {
    default: DEFAULT_TIMEOUT_MS,
    extended: EXTENDED_TIMEOUT_MS,
    description: 'Request timeout protection active'
  };
}
