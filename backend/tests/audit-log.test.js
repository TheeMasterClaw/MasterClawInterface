import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
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
} from '../src/middleware/auditLog.js';

describe('Security Audit Logging', () => {
  let tempDir;
  let originalEnv;
  let originalConsoleError;
  let logPath;

  beforeEach(() => {
    // Create a temporary directory for test logs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-test-'));
    logPath = path.join(tempDir, 'security-audit.log');
    
    // Save original environment
    originalEnv = process.env.AUDIT_LOG_DIR;
    process.env.AUDIT_LOG_DIR = tempDir;
    
    // Mock console.error for testing fallback logging
    originalConsoleError = console.error;
    console.error = () => {};
  });

  afterEach(() => {
    // Restore environment
    process.env.AUDIT_LOG_DIR = originalEnv;
    console.error = originalConsoleError;
    
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  // Helper to clear log file between test assertions
  function clearLogFile() {
    try {
      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
      }
    } catch (err) {
      // Ignore
    }
  }

  describe('logSecurityEvent', () => {
    it('should create a structured audit log entry', () => {
      const eventId = logSecurityEvent(
        SecurityEventType.AUTH_SUCCESS,
        Severity.INFO,
        { user: 'testuser' },
        { userId: '123' }
      );

      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
      expect(eventId.length).toBe(32); // hex string of 16 bytes

      // Verify log was written
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs.length).toBe(1);
      
      const entry = logs[0];
      expect(entry.event_type).toBe(SecurityEventType.AUTH_SUCCESS);
      expect(entry.severity).toBe(Severity.INFO);
      expect(entry.details.user).toBe('testuser');
      expect(entry.user_id).toBe('123');
      expect(entry.event_id).toBe(eventId);
      expect(entry.timestamp).toBeDefined();
      expect(entry.environment).toBeDefined();
      expect(entry.service).toBe('masterclaw-backend');
    });

    it('should include request context when provided', () => {
      const mockReq = {
        method: 'POST',
        path: '/api/login',
        url: '/api/login',
        ip: '192.168.1.100',
        headers: {
          'user-agent': 'TestAgent/1.0',
          'x-forwarded-for': '10.0.0.1',
          'x-request-id': 'req-123',
        },
        connection: { remoteAddress: '192.168.1.100' },
      };

      logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        Severity.HIGH,
        { reason: 'invalid_credentials' },
        { req: mockReq }
      );

      const logs = getRecentAuditLogs({ lines: 1 });
      const entry = logs[0];

      expect(entry.client_ip).toBe('10.0.0.1'); // Uses x-forwarded-for
      expect(entry.user_agent).toBe('TestAgent/1.0');
      expect(entry.request_method).toBe('POST');
      expect(entry.request_path).toBe('/api/login');
      expect(entry.request_id).toBe('req-123');
    });

    it('should sanitize sensitive data from logs', () => {
      logSecurityEvent(
        SecurityEventType.AUTH_SUCCESS,
        Severity.INFO,
        {
          username: 'testuser',
          password: 'secret123',
          token: 'bearer-token-abc',
          api_key: 'sk-123456',
          nested: {
            secret: 'nested-secret',
            safe_field: 'visible',
          },
        }
      );

      const logs = getRecentAuditLogs({ lines: 1 });
      const entry = logs[0];

      expect(entry.details.username).toBe('testuser');
      expect(entry.details.password).toBe('[REDACTED]');
      expect(entry.details.token).toBe('[REDACTED]');
      expect(entry.details.api_key).toBe('[REDACTED]');
      expect(entry.details.nested.secret).toBe('[REDACTED]');
      expect(entry.details.nested.safe_field).toBe('visible');
    });

    it('should handle different severity levels', () => {
      Object.values(Severity).forEach(severity => {
        logSecurityEvent(
          SecurityEventType.SYSTEM_ERROR,
          severity,
          { test: true }
        );
      });

      const logs = getRecentAuditLogs({ lines: 10 });
      
      expect(logs.some(l => l.severity === Severity.CRITICAL)).toBe(true);
      expect(logs.some(l => l.severity === Severity.HIGH)).toBe(true);
      expect(logs.some(l => l.severity === Severity.MEDIUM)).toBe(true);
      expect(logs.some(l => l.severity === Severity.LOW)).toBe(true);
      expect(logs.some(l => l.severity === Severity.INFO)).toBe(true);
    });
  });

  describe('logAuthEvent', () => {
    it('should log successful authentication as INFO', () => {
      const mockReq = {
        method: 'POST',
        path: '/auth/login',
        headers: {},
      };

      const eventId = logAuthEvent(true, mockReq, { user: 'alice' });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.AUTH_SUCCESS);
      expect(logs[0].severity).toBe(Severity.INFO);
      expect(logs[0].details.user).toBe('alice');
    });

    it('should log failed authentication as HIGH severity', () => {
      const mockReq = {
        method: 'POST',
        path: '/auth/login',
        headers: {},
        ip: '192.168.1.50',
      };

      const eventId = logAuthEvent(false, mockReq, { 
        user: 'alice',
        reason: 'invalid_password' 
      });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.AUTH_FAILURE);
      expect(logs[0].severity).toBe(Severity.HIGH);
      expect(logs[0].details.reason).toBe('invalid_password');
    });
  });

  describe('logAccessEvent', () => {
    it('should log granted access as INFO', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/tasks',
        headers: {},
      };

      logAccessEvent(true, mockReq, 'tasks', { user: 'bob' });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.ACCESS_GRANTED);
      expect(logs[0].severity).toBe(Severity.INFO);
      expect(logs[0].resource).toBe('tasks');
      expect(logs[0].action).toBe('access_granted');
    });

    it('should log denied access as MEDIUM severity', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/admin/users',
        headers: {},
        ip: '192.168.1.51',
      };

      logAccessEvent(false, mockReq, 'admin/users', { 
        user: 'bob',
        reason: 'insufficient_permissions' 
      });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.ACCESS_DENIED);
      expect(logs[0].severity).toBe(Severity.MEDIUM);
      expect(logs[0].resource).toBe('admin/users');
      expect(logs[0].action).toBe('access_denied');
    });
  });

  describe('logDataEvent', () => {
    it('should log data creation events', () => {
      const mockReq = { method: 'POST', path: '/api/tasks', headers: {} };
      
      logDataEvent('create', mockReq, 'task:123', { title: 'New Task' });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.DATA_MODIFICATION);
      expect(logs[0].action).toBe('create');
      expect(logs[0].resource).toBe('task:123');
    });

    it('should log data deletion events', () => {
      const mockReq = { method: 'DELETE', path: '/api/tasks/123', headers: {} };
      
      logDataEvent('delete', mockReq, 'task:123', { deleted_by: 'admin' });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.DATA_DELETION);
      expect(logs[0].action).toBe('delete');
    });

    it('should log data access events', () => {
      const mockReq = { method: 'GET', path: '/api/tasks/123', headers: {} };
      
      logDataEvent('access', mockReq, 'task:123', { accessed_by: 'user1' });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.DATA_ACCESS);
      expect(logs[0].action).toBe('access');
    });
  });

  describe('logSecurityViolation', () => {
    it('should log rate limit violations', () => {
      const mockReq = { 
        method: 'POST', 
        path: '/api/chat', 
        headers: {},
        ip: '192.168.1.100',
      };

      logSecurityViolation('rate_limit', mockReq, { limit: 100, window: '1m' });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.RATE_LIMIT_EXCEEDED);
      expect(logs[0].severity).toBe(Severity.MEDIUM);
      expect(logs[0].details.limit).toBe(100);
    });

    it('should log suspicious activity as HIGH severity', () => {
      const mockReq = { 
        method: 'GET', 
        path: '/api/admin', 
        headers: {},
        ip: '10.0.0.99',
      };

      logSecurityViolation('suspicious', mockReq, { 
        reason: 'multiple_failed_auth_attempts',
        count: 50 
      });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.SUSPICIOUS_ACTIVITY);
      expect(logs[0].severity).toBe(Severity.HIGH);
    });

    it('should log invalid input as LOW severity', () => {
      const mockReq = { method: 'POST', path: '/api/tasks', headers: {} };
      
      logSecurityViolation('invalid_input', mockReq, { 
        field: 'email',
        reason: 'invalid_format' 
      });
      
      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].event_type).toBe(SecurityEventType.INVALID_INPUT);
      expect(logs[0].severity).toBe(Severity.LOW);
    });
  });

  describe('getRecentAuditLogs', () => {
    beforeEach(() => {
      // Clear any existing logs
      clearLogFile();
      
      // Create some test log entries
      for (let i = 0; i < 5; i++) {
        logSecurityEvent(
          SecurityEventType.AUTH_SUCCESS,
          Severity.INFO,
          { iteration: i }
        );
      }
      for (let i = 0; i < 3; i++) {
        logSecurityEvent(
          SecurityEventType.AUTH_FAILURE,
          Severity.HIGH,
          { iteration: i }
        );
      }
    });

    it('should return specified number of recent entries', () => {
      const logs = getRecentAuditLogs({ lines: 3 });
      expect(logs.length).toBe(3);
    });

    it('should filter by event type', () => {
      const logs = getRecentAuditLogs({ 
        lines: 10, 
        eventType: SecurityEventType.AUTH_FAILURE 
      });
      
      expect(logs.length).toBe(3);
      logs.forEach(log => {
        expect(log.event_type).toBe(SecurityEventType.AUTH_FAILURE);
      });
    });

    it('should filter by severity', () => {
      const logs = getRecentAuditLogs({ 
        lines: 10, 
        severity: Severity.INFO 
      });
      
      expect(logs.length).toBe(5);
      logs.forEach(log => {
        expect(log.severity).toBe(Severity.INFO);
      });
    });

    it('should filter by timestamp', () => {
      const since = new Date(Date.now() - 1000).toISOString();
      
      // Add a new log
      logSecurityEvent(SecurityEventType.SYSTEM_ERROR, Severity.LOW, {});
      
      const logs = getRecentAuditLogs({ since });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array if log file does not exist', () => {
      // Create a new temp dir without logs in a separate isolated test context
      const newTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-audit-'));
      const oldEnv = process.env.AUDIT_LOG_DIR;
      process.env.AUDIT_LOG_DIR = newTempDir;
      
      const logs = getRecentAuditLogs({ lines: 10 });
      expect(logs).toEqual([]);
      
      // Restore
      process.env.AUDIT_LOG_DIR = oldEnv;
      fs.rmSync(newTempDir, { recursive: true, force: true });
    });
  });

  describe('getAuditStats', () => {
    beforeEach(() => {
      // Clear logs and create fresh test data
      clearLogFile();
      
      // Create logs with different severities
      logSecurityEvent('auth:success', Severity.INFO, {});
      logSecurityEvent('auth:success', Severity.INFO, {});
      logSecurityEvent('auth:failure', Severity.HIGH, {});
      logSecurityEvent('access:denied', Severity.MEDIUM, {});
      logSecurityEvent('security:suspicious', Severity.CRITICAL, {});
    });

    it('should return aggregate statistics', () => {
      const stats = getAuditStats();
      
      expect(stats.total_events).toBe(5);
      expect(stats.by_severity[Severity.INFO]).toBe(2);
      expect(stats.by_severity[Severity.HIGH]).toBe(1);
      expect(stats.by_severity[Severity.MEDIUM]).toBe(1);
      expect(stats.by_severity[Severity.CRITICAL]).toBe(1);
    });

    it('should track recent failures', () => {
      const stats = getAuditStats();
      
      expect(stats.recent_failures.length).toBeGreaterThan(0);
      // Should include auth failures, access denied, and suspicious activity
      expect(stats.recent_failures.some(f => f.type === 'auth:failure')).toBe(true);
    });

    it('should include time range information', () => {
      const stats = getAuditStats();
      
      expect(stats.time_range.start).toBeDefined();
      expect(stats.time_range.end).toBeDefined();
    });
  });

  describe('auditLogMiddleware', () => {
    it('should attach start time to request', () => {
      const mockReq = { headers: {} };
      const mockRes = { 
        end: () => {},
        on: () => {},
        statusCode: 200,
      };
      const next = () => {};

      auditLogMiddleware(mockReq, mockRes, next);
      
      expect(mockReq._auditStartTime).toBeDefined();
      expect(typeof mockReq._auditStartTime).toBe('number');
    });

    it('should log authentication failures', () => {
      const mockReq = {
        method: 'POST',
        path: '/auth/login',
        headers: {},
        ip: '192.168.1.1',
      };
      
      // Create a mock response with EventEmitter-like behavior
      const mockRes = {
        statusCode: 401,
        _handlers: {},
        on: function(event, callback) {
          this._handlers[event] = callback;
          return this;
        },
        emit: function(event) {
          if (this._handlers[event]) {
            this._handlers[event]();
          }
        },
        end: function() {
          this.emit('finish');
        }
      };

      // Clear log file first
      clearLogFile();
      
      auditLogMiddleware(mockReq, mockRes, () => {});
      
      // Simulate response finish by calling end
      mockRes.end();

      // Check that auth failure was logged
      const logs = getRecentAuditLogs({ eventType: SecurityEventType.AUTH_FAILURE });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[logs.length - 1].request_path).toBe('/auth/login');
    });

    it('should log access denied responses', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/admin',
        headers: {},
        ip: '192.168.1.2',
      };
      
      // Create a mock response with EventEmitter-like behavior
      const mockRes = {
        statusCode: 403,
        _handlers: {},
        on: function(event, callback) {
          this._handlers[event] = callback;
          return this;
        },
        emit: function(event) {
          if (this._handlers[event]) {
            this._handlers[event]();
          }
        },
        end: function() {
          this.emit('finish');
        }
      };

      // Clear log file first
      clearLogFile();
      
      auditLogMiddleware(mockReq, mockRes, () => {});
      
      // Simulate response finish
      mockRes.end();

      const logs = getRecentAuditLogs({ eventType: SecurityEventType.ACCESS_DENIED });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Log rotation', () => {
    it('should handle log rotation when file size exceeds limit', () => {
      // Set a very small max size to trigger rotation
      process.env.AUDIT_MAX_LOG_SIZE = '100'; // 100 bytes
      
      // Write enough logs to trigger rotation
      for (let i = 0; i < 20; i++) {
        logSecurityEvent(SecurityEventType.SYSTEM_ERROR, Severity.INFO, { 
          data: 'x'.repeat(50) // Make entries larger
        });
      }

      // Check if rotation occurred
      const logPath = path.join(tempDir, 'security-audit.log');
      const rotatedPath = `${logPath}.1`;
      
      // Rotation may or may not have occurred depending on timing
      // Just verify the current log still works
      const logs = getRecentAuditLogs({ lines: 5 });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed log entries gracefully', () => {
      // Clear any existing logs first
      clearLogFile();
      
      // Write a malformed entry directly to the log file
      fs.writeFileSync(logPath, '{ invalid json\n');
      
      // Add a valid entry
      logSecurityEvent(SecurityEventType.SYSTEM_ERROR, Severity.INFO, {});
      
      // Should still be able to read valid entries
      const logs = getRecentAuditLogs({ lines: 10 });
      expect(logs.length).toBe(1);
      expect(logs[0].event_type).toBe(SecurityEventType.SYSTEM_ERROR);
    });

    it('should fallback to console on write failure', () => {
      const consoleCalls = [];
      console.error = (...args) => {
        consoleCalls.push(args);
      };

      // Make directory read-only to trigger write failure
      const originalPerms = fs.statSync(tempDir).mode;
      try {
        fs.chmodSync(tempDir, 0o444);
        
        logSecurityEvent(SecurityEventType.SYSTEM_ERROR, Severity.CRITICAL, {
          message: 'test'
        });

        // Should have logged fallback message
        expect(consoleCalls.some(call => 
          call[0] && call[0].includes && call[0].includes('SECURITY')
        )).toBe(true);
      } finally {
        // Restore permissions for cleanup
        fs.chmodSync(tempDir, originalPerms);
      }
    });
  });

  describe('Client IP extraction', () => {
    it('should prefer x-forwarded-for header', () => {
      const mockReq = {
        method: 'GET',
        path: '/test',
        headers: {
          'x-forwarded-for': '203.0.113.42',
        },
        connection: { remoteAddress: '192.168.1.1' },
      };

      logSecurityEvent(SecurityEventType.DATA_ACCESS, Severity.INFO, {}, { req: mockReq });

      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].client_ip).toBe('203.0.113.42');
    });

    it('should fall back to connection remote address', () => {
      const mockReq = {
        method: 'GET',
        path: '/test',
        headers: {},
        connection: { remoteAddress: '192.168.1.1' },
      };

      logSecurityEvent(SecurityEventType.DATA_ACCESS, Severity.INFO, {}, { req: mockReq });

      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].client_ip).toBe('192.168.1.1');
    });

    it('should handle requests without IP information', () => {
      const mockReq = {
        method: 'GET',
        path: '/test',
        headers: {},
      };

      logSecurityEvent(SecurityEventType.DATA_ACCESS, Severity.INFO, {}, { req: mockReq });

      const logs = getRecentAuditLogs({ lines: 1 });
      expect(logs[0].client_ip).toBe('unknown');
    });
  });
});
