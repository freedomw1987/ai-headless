/**
 * ==============================================
 *  Sprint 57 Cross-cutting Guard Test
 * ==============================================
 *
 * 守護測試：確保 R6 request id + R4 CSRF + P0-3 Sentry 檔案結構完整
 *
 * 對應 docs/sprint57-plan-gate.md §6
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

describe('Sprint 57 Cross-cutting Guard', () => {
  describe('R6 Request ID', () => {
    it('has lib/request-context.ts', () => {
      expect(existsSync(join(ROOT, 'lib/request-context.ts'))).toBe(true);
    });

    it('middleware injects x-request-id', () => {
      const mw = readFileSync(join(ROOT, 'middleware.ts'), 'utf-8');
      expect(mw).toContain('x-request-id');
      expect(mw).toContain('readOrGenerateRequestId');
    });

    it('middleware matcher covers /api/*', () => {
      const mw = readFileSync(join(ROOT, 'middleware.ts'), 'utf-8');
      expect(mw).toMatch(/matcher:.*\/api/);
    });
  });

  describe('R4 CSRF', () => {
    it('has lib/csrf.ts', () => {
      expect(existsSync(join(ROOT, 'lib/csrf.ts'))).toBe(true);
    });

    it('has lib/csrf.test.ts', () => {
      expect(existsSync(join(ROOT, 'lib/csrf.test.ts'))).toBe(true);
    });

    it('has /api/csrf endpoint', () => {
      expect(existsSync(join(ROOT, 'app/api/csrf/route.ts'))).toBe(true);
    });

    it('has lib/api-client.ts (client-side interceptor)', () => {
      expect(existsSync(join(ROOT, 'lib/api-client.ts'))).toBe(true);
    });

    it('middleware blocks state-changing without CSRF', () => {
      const mw = readFileSync(join(ROOT, 'middleware.ts'), 'utf-8');
      expect(mw).toContain('isValidCsrfRequest');
      expect(mw).toContain('CSRF_ALLOWLIST');
    });
  });

  describe('P0-3 Sentry', () => {
    it('has sentry.server.config.ts', () => {
      expect(existsSync(join(ROOT, 'sentry.server.config.ts'))).toBe(true);
    });

    it('has sentry.edge.config.ts', () => {
      expect(existsSync(join(ROOT, 'sentry.edge.config.ts'))).toBe(true);
    });

    it('has instrumentation.ts', () => {
      expect(existsSync(join(ROOT, 'instrumentation.ts'))).toBe(true);
    });

    it('next.config.ts uses withSentryConfig', () => {
      const config = readFileSync(join(ROOT, 'next.config.ts'), 'utf-8');
      expect(config).toContain('withSentryConfig');
      expect(config).toContain('@sentry/nextjs');
    });

    it('Sentry config is silent no-op when DSN missing', () => {
      const config = readFileSync(join(ROOT, 'sentry.server.config.ts'), 'utf-8');
      expect(config).toContain("const dsn = process.env.SENTRY_DSN");
      expect(config).toContain('if (dsn)');
    });

    it('.env.example documents SENTRY_DSN', () => {
      const env = readFileSync(join(ROOT, '.env.example'), 'utf-8');
      expect(env).toContain('SENTRY_DSN');
      expect(env).toContain('SENTRY_AUTH_TOKEN');
    });
  });
});
