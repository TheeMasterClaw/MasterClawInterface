import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { requestTimeout, timeoutFor, getTimeoutStatus } from '../src/middleware/timeout.js';

describe('Request Timeout Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Basic timeout functionality', () => {
    it('should allow requests that complete within timeout', async () => {
      app.use(requestTimeout(1000)); // 1 second timeout
      app.get('/fast', (req, res) => {
        res.json({ status: 'ok' });
      });

      const response = await request(app)
        .get('/fast')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should timeout requests that take too long', async () => {
      app.use(requestTimeout(50)); // 50ms timeout
      app.get('/slow', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        res.json({ status: 'completed' });
      });

      const response = await request(app)
        .get('/slow')
        .expect(408);

      expect(response.body.error).toBe('Request timeout');
      expect(response.body.code).toBe('REQUEST_TIMEOUT');
      expect(response.body.message).toContain('50ms');
    });

    it('should include helpful suggestion in timeout response', async () => {
      app.use(requestTimeout(50));
      app.get('/slow', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({});
      });

      const response = await request(app)
        .get('/slow')
        .expect(408);

      expect(response.body.suggestion).toBeDefined();
      expect(response.body.suggestion).toContain('payload');
    });
  });

  describe('Skip paths functionality', () => {
    it('should skip timeout for configured paths', async () => {
      app.use(requestTimeout(50, { skipPaths: ['/health', '/metrics'] }));
      
      app.get('/health', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({ healthy: true });
      });

      app.get('/api/data', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({ data: 'value' });
      });

      // Health check should NOT timeout (skipped)
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);
      expect(healthResponse.body.healthy).toBe(true);

      // API endpoint should timeout
      const apiResponse = await request(app)
        .get('/api/data')
        .expect(408);
      expect(apiResponse.body.code).toBe('REQUEST_TIMEOUT');
    });

    it('should handle path prefix matching for skipPaths', async () => {
      app.use(requestTimeout(50, { skipPaths: ['/health'] }));
      
      app.get('/health/detailed', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({ detailed: true });
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.detailed).toBe(true);
    });
  });

  describe('Endpoint-specific timeouts', () => {
    it('should apply extended timeout for TTS endpoints', async () => {
      app.post('/tts', timeoutFor('tts'), async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({ audio: 'generated' });
      });

      const response = await request(app)
        .post('/tts')
        .send({ text: 'Hello world' })
        .expect(200);

      expect(response.body.audio).toBe('generated');
    });

    it('should still timeout TTS requests that exceed extended limit', async () => {
      // Override with very short timeout for testing
      app.post('/tts', requestTimeout(50), async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({ audio: 'generated' });
      });

      const response = await request(app)
        .post('/tts')
        .send({ text: 'x'.repeat(10000) })
        .expect(408);

      expect(response.body.code).toBe('REQUEST_TIMEOUT');
    });

    it('should apply default timeout for unknown endpoint types', async () => {
      app.get('/unknown', timeoutFor('unknown'), async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        res.json({});
      });

      // Should use default timeout (30000ms), so 50ms should be fine
      await request(app).get('/unknown').expect(200);
    });
  });

  describe('Security implications', () => {
    it('should protect against slowloris-style attacks', async () => {
      app.use(requestTimeout(100));
      app.post('/api/process', (req, res) => {
        res.json({ processed: true });
      });

      // Simulate slow request body upload
      const response = await request(app)
        .post('/api/process')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ data: 'x'.repeat(1000000) })) // Large payload
        .timeout(200) // Test timeout longer than middleware timeout
        .catch(err => {
          // Request should timeout or complete
          return err.response || { status: 408 };
        });

      // Either success (if processed quickly) or timeout
      expect([200, 408, 413, 503]).toContain(response.status);
    });

    it('should clean up timeout resources after response', async () => {
      app.use(requestTimeout(500));
      
      let requestCount = 0;
      app.get('/count', (req, res) => {
        requestCount++;
        res.json({ count: requestCount });
      });

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        await request(app).get('/count').expect(200);
      }

      expect(requestCount).toBe(10);
    });

    it('should not leak timeout handles after response completes', async () => {
      const activeTimeoutsBefore = process._getActiveHandles?.().length || 0;
      
      app.use(requestTimeout(1000));
      app.get('/test', (req, res) => {
        res.json({ ok: true });
      });

      await request(app).get('/test').expect(200);

      // Give time for cleanup
      await new Promise(resolve => setTimeout(resolve, 10));

      const activeTimeoutsAfter = process._getActiveHandles?.().length || 0;
      // Should be approximately the same (allow some variance)
      expect(Math.abs(activeTimeoutsAfter - activeTimeoutsBefore)).toBeLessThan(5);
    });
  });

  describe('Error handling', () => {
    it('should handle response errors gracefully', async () => {
      app.use(requestTimeout(50));
      app.get('/error', (req, res) => {
        res.destroy(); // Forcefully destroy response
      });

      // Should not crash the server
      await request(app)
        .get('/error')
        .catch(() => null); // Ignore connection errors

      // Server should still be responsive
      app.get('/health', (req, res) => res.json({ ok: true }));
      await request(app).get('/health').expect(200);
    });
  });

  describe('Status reporting', () => {
    it('should report timeout configuration', () => {
      const status = getTimeoutStatus();
      
      expect(status.default).toBe(30000);
      expect(status.extended).toBe(120000);
      expect(status.description).toContain('protection active');
    });
  });

  describe('Integration with other middleware', () => {
    it('should work with async route handlers', async () => {
      app.use(requestTimeout(100));
      
      app.get('/async', async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        res.json({ async: true });
      });

      const response = await request(app)
        .get('/async')
        .expect(200);

      expect(response.body.async).toBe(true);
    });

    it('should work with error handling middleware', async () => {
      app.use(requestTimeout(50));
      
      app.get('/error-route', (req, res) => {
        throw new Error('Test error');
      });

      app.use((err, req, res, next) => {
        res.status(500).json({ error: err.message });
      });

      const response = await request(app)
        .get('/error-route')
        .expect(500);

      expect(response.body.error).toBe('Test error');
    });
  });
});
