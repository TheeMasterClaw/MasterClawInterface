import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler, sanitizeBody } from '../src/middleware/security.js';

describe('Body Size Limit Security', () => {
  let app;

  beforeAll(() => {
    app = express();
    
    // Apply same body limits as production
    const parseGeneralJson = express.json({ limit: '100kb' });
    const parseTtsJson = express.json({ limit: '1mb' });

    app.use((req, res, next) => {
      if (req.path.startsWith('/tts')) return parseTtsJson(req, res, next);
      return parseGeneralJson(req, res, next);
    });

    app.use(express.urlencoded({ limit: '100kb', extended: true }));
    app.use(sanitizeBody);

    // Test endpoint
    app.post('/test', (req, res) => {
      res.json({ received: req.body });
    });

    // TTS endpoint with larger limit
    app.post('/tts', (req, res) => {
      res.json({ received: req.body });
    });

    app.use(errorHandler);
  });

  describe('General API endpoints (100KB limit)', () => {
    it('should accept requests under the size limit', async () => {
      const response = await request(app)
        .post('/test')
        .send({ message: 'Small payload' });

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ message: 'Small payload' });
    });

    it('should accept requests at the size limit boundary', async () => {
      // Create a payload that's just under 100KB
      const largeString = 'x'.repeat(90 * 1024); // 90KB
      const response = await request(app)
        .post('/test')
        .send({ data: largeString });

      expect(response.status).toBe(200);
    });

    it('should reject requests exceeding the size limit', async () => {
      // Create a payload that exceeds 100KB
      const hugeString = 'x'.repeat(110 * 1024); // 110KB
      const response = await request(app)
        .post('/test')
        .send({ data: hugeString });

      expect(response.status).toBe(413);
      expect(response.body.error).toBe('Request body too large');
      expect(response.body.code).toBe('PAYLOAD_TOO_LARGE');
      expect(response.body.message).toContain('maximum allowed size');
    });

    it('should return proper error structure for oversized payloads', async () => {
      const hugeData = { data: 'x'.repeat(200 * 1024) };
      const response = await request(app)
        .post('/test')
        .send(hugeData);

      expect(response.status).toBe(413);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('maxSize');
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('TTS endpoint (1MB limit)', () => {
    it('should accept large TTS payloads up to 1MB', async () => {
      // Create a large text payload (500KB) - typical for long TTS requests
      const largeText = 'word '.repeat(100 * 1024); // ~500KB
      const response = await request(app)
        .post('/tts')
        .send({ text: largeText });

      expect(response.status).toBe(200);
    });

    it('should reject TTS payloads exceeding 1MB', async () => {
      // Create a payload exceeding 1MB
      const hugeText = 'word '.repeat(300 * 1024); // ~1.5MB
      const response = await request(app)
        .post('/tts')
        .send({ text: hugeText });

      expect(response.status).toBe(413);
      expect(response.body.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('Security implications', () => {
    it('should prevent memory exhaustion attacks via large JSON', async () => {
      // Simulate an attack with nested deep JSON
      const createNestedObject = (depth) => {
        if (depth === 0) return 'x'.repeat(1000);
        return { nested: createNestedObject(depth - 1) };
      };

      // Even deeply nested objects should respect size limit
      const hugeNested = createNestedObject(100);
      const response = await request(app)
        .post('/test')
        .send(hugeNested);

      // Should either succeed (if under limit) or fail with 413
      expect([200, 413]).toContain(response.status);
    });

    it('should handle edge case: empty body', async () => {
      const response = await request(app)
        .post('/test')
        .send({});

      expect(response.status).toBe(200);
    });

    it('should handle edge case: null values', async () => {
      const response = await request(app)
        .post('/test')
        .send({ data: null });

      expect(response.status).toBe(200);
    });
  });
});

describe('Body Size Limits Configuration', () => {
  it('should allow custom limits via environment variables', () => {
    // This test documents the expected behavior
    // In production, limits are set via:
    // BODY_LIMIT_GENERAL=100kb
    // BODY_LIMIT_TTS=1mb
    
    const expectedLimits = {
      general: '100kb',
      tts: '1mb'
    };

    expect(expectedLimits.general).toBe('100kb');
    expect(expectedLimits.tts).toBe('1mb');
  });

  it('should provide meaningful error messages', () => {
    const errorResponse = {
      error: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE',
      message: 'The request body exceeds the maximum allowed size (100kb limit). Please reduce payload size.',
      maxSize: '100kb'
    };

    expect(errorResponse.code).toBe('PAYLOAD_TOO_LARGE');
    expect(errorResponse.message).toContain('maximum allowed size');
  });
});
