/**
 * Request Context Tests — Sprint 57 R6
 */

import { describe, it, expect } from 'vitest';
import {
  generateRequestId,
  readOrGenerateRequestId,
  withRequestContext,
  getRequestContext,
  getRequestIdOr,
  REQUEST_ID_HEADER_NAME,
} from './request-context';

describe('generateRequestId', () => {
  it('returns a valid UUID v4', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
    expect(ids.size).toBe(100);
  });
});

describe('readOrGenerateRequestId', () => {
  it('uses incoming header if valid', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        [REQUEST_ID_HEADER_NAME]: 'incoming-trace-id-12345',
      },
    });
    expect(readOrGenerateRequestId(req)).toBe('incoming-trace-id-12345');
  });

  it('generates new ID if no header', () => {
    const req = new Request('http://localhost/api/test');
    const id = readOrGenerateRequestId(req);
    expect(id).toMatch(/^[0-9a-f]{8}-/);
  });

  it('rejects header too short and generates new', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { [REQUEST_ID_HEADER_NAME]: 'abc' },
    });
    const id = readOrGenerateRequestId(req);
    expect(id).not.toBe('abc');
    expect(id).toMatch(/^[0-9a-f]{8}-/);
  });

  it('rejects header too long', () => {
    const tooLong = 'x'.repeat(200);
    const req = new Request('http://localhost/api/test', {
      headers: { [REQUEST_ID_HEADER_NAME]: tooLong },
    });
    const id = readOrGenerateRequestId(req);
    expect(id).not.toBe(tooLong);
  });

  it('rejects header with invalid chars', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { [REQUEST_ID_HEADER_NAME]: 'has spaces and !@#' },
    });
    const id = readOrGenerateRequestId(req);
    expect(id).not.toContain(' ');
  });
});

describe('withRequestContext / getRequestContext', () => {
  it('provides context inside callback', async () => {
    await withRequestContext({ requestId: 'test-123', method: 'GET' }, async () => {
      const ctx = getRequestContext();
      expect(ctx?.requestId).toBe('test-123');
      expect(ctx?.method).toBe('GET');
    });
  });

  it('returns undefined outside callback', async () => {
    const ctx = getRequestContext();
    expect(ctx).toBeUndefined();
  });

  it('isolates context between parallel calls', async () => {
    const results = await Promise.all([
      withRequestContext({ requestId: 'A' }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        return getRequestContext()?.requestId;
      }),
      withRequestContext({ requestId: 'B' }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        return getRequestContext()?.requestId;
      }),
    ]);
    expect(results).toEqual(['A', 'B']);
  });
});

describe('getRequestIdOr', () => {
  it('returns request id from context', async () => {
    await withRequestContext({ requestId: 'ctx-id' }, async () => {
      expect(getRequestIdOr()).toBe('ctx-id');
    });
  });

  it('returns fallback when no context', () => {
    expect(getRequestIdOr('fallback-x')).toBe('fallback-x');
  });
});
