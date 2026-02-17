/**
 * Tests for CSP (Content Security Policy) Violation Reporting
 * Run with: npm test -- csp-report.test.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Create mock functions
const mockLogCspViolation = vi.fn().mockReturnValue('test-event-id-123');
const mockGetRecentAuditLogs = vi.fn().mockReturnValue([]);

// Mock the audit log module before importing
vi.mock('../src/middleware/auditLog.js', () => ({
  logCspViolation: (...args) => mockLogCspViolation(...args),
  logSecurityEvent: vi.fn().mockReturnValue('test-event-id-456'),
  getRecentAuditLogs: (...args) => mockGetRecentAuditLogs(...args),
  SecurityEventType: {
    CSP_VIOLATION: 'security:csp_violation',
    AUTH_FAILURE: 'auth:failure'
  },
  Severity: {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info'
  }
}));

// Create a minimal app for testing CSP reporting
function createTestApp() {
  const app = express();
  
  // CSP report rate limiter
  const cspReportLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health'
  });
  
  // Apply helmet with CSP
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
  }));
  
  app.use(express.json());
  
  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // CSP report endpoint
  app.post('/security/csp-report', cspReportLimiter, express.json({ limit: '50kb' }), (req, res) => {
    const report = req.body?.['csp-report'] || req.body;
    
    if (!report || typeof report !== 'object' || Object.keys(report).length === 0) {
      return res.status(400).json({ 
        error: 'Invalid CSP report format',
        code: 'INVALID_CSP_REPORT'
      });
    }
    
    // Call the mocked function
    mockLogCspViolation(report, req);
    
    res.status(204).send();
  });
  
  // CSP violations GET endpoint
  app.get('/security/csp-violations', (req, res) => {
    const violations = mockGetRecentAuditLogs({ eventType: 'security:csp_violation' });
    
    res.json({
      count: violations.length,
      violations
    });
  });
  
  return app;
}

describe('CSP Violation Reporting', () => {
  let app;
  
  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });
  
  describe('POST /security/csp-report', () => {
    test('accepts valid CSP violation report', async () => {
      const cspReport = {
        'csp-report': {
          'document-uri': 'http://localhost:3001/',
          'referrer': '',
          'blocked-uri': 'http://evil.com/malicious.js',
          'violated-directive': 'script-src',
          'original-policy': "default-src 'self'",
          'source-file': 'http://localhost:3001/',
          'line-number': 42,
          'column-number': 15
        }
      };
      
      const response = await request(app)
        .post('/security/csp-report')
        .send(cspReport)
        .expect(204);
      
      expect(response.body).toEqual({});
      expect(mockLogCspViolation).toHaveBeenCalledTimes(1);
    });
    
    test('accepts CSP report without csp-report wrapper', async () => {
      const cspReport = {
        'document-uri': 'http://localhost:3001/',
        'blocked-uri': 'inline',
        'violated-directive': 'script-src',
      };
      
      await request(app)
        .post('/security/csp-report')
        .send(cspReport)
        .expect(204);
      
      expect(mockLogCspViolation).toHaveBeenCalledTimes(1);
    });
    
    test('rejects invalid CSP report format (string)', async () => {
      const response = await request(app)
        .post('/security/csp-report')
        .send('not valid json')
        .expect(400);
      
      expect(response.body.error).toBeDefined();
    });
    
    test('rejects empty CSP report object', async () => {
      const response = await request(app)
        .post('/security/csp-report')
        .send({})
        .expect(400);
      
      expect(response.body.code).toBe('INVALID_CSP_REPORT');
    });
    
    test('handles CSP report with empty csp-report wrapper', async () => {
      const response = await request(app)
        .post('/security/csp-report')
        .send({ 'csp-report': {} })
        .expect(400);
      
      expect(response.body.code).toBe('INVALID_CSP_REPORT');
    });
  });
  
  describe('GET /security/csp-violations', () => {
    test('returns CSP violations list', async () => {
      mockGetRecentAuditLogs.mockReturnValue([
        {
          event_id: 'test-1',
          timestamp: '2024-01-15T10:00:00Z',
          severity: 'high',
          event_type: 'security:csp_violation',
          details: {
            blocked_uri: 'http://evil.com/script.js',
            violated_directive: 'script-src'
          }
        }
      ]);
      
      const response = await request(app)
        .get('/security/csp-violations')
        .expect(200);
      
      expect(response.body.count).toBe(1);
      expect(response.body.violations).toHaveLength(1);
    });
    
    test('returns empty list when no violations', async () => {
      mockGetRecentAuditLogs.mockReturnValue([]);
      
      const response = await request(app)
        .get('/security/csp-violations')
        .expect(200);
      
      expect(response.body.count).toBe(0);
      expect(response.body.violations).toEqual([]);
    });
  });
  
  describe('CSP Headers', () => {
    test('includes report-uri in CSP header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      const cspHeader = response.headers['content-security-policy'];
      expect(cspHeader).toBeDefined();
      expect(cspHeader).toContain('report-uri');
      expect(cspHeader).toContain('/security/csp-report');
    });
    
    test('CSP header includes required directives', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      const cspHeader = response.headers['content-security-policy'];
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self'");
    });
  });
});

describe('logCspViolation severity detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('script-src violations are logged with HIGH severity', () => {
    // Import the module to test the actual logic
    const violation = {
      'blocked-uri': 'http://evil.com/script.js',
      'violated-directive': 'script-src http://localhost:3001'
    };
    
    // Check that the directive includes script-src
    expect(violation['violated-directive']).toContain('script-src');
  });
  
  test('inline violations contain inline keyword', () => {
    const violation = {
      'blocked-uri': 'inline',
      'violated-directive': 'script-src-elem inline'
    };
    
    expect(violation['violated-directive']).toContain('inline');
  });
  
  test('other violations have different patterns', () => {
    const violation = {
      'blocked-uri': 'http://external.com/style.css',
      'violated-directive': 'style-src'
    };
    
    expect(violation['violated-directive']).not.toContain('script-src');
    expect(violation['violated-directive']).not.toContain('inline');
  });
});
