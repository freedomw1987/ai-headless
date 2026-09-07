/**
 * Sentry Config Test (Sprint 57 P0-3)
 *
 * 驗證：
 * - DSN 缺失時 silent no-op（不 throw）
 * - config 檔存在且結構正確
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Sentry Config', () => {
  const ROOT = process.cwd();

  describe('silent no-op when DSN missing', () => {
    it('server config uses if (dsn) guard', () => {
      const config = readFileSync(
        join(ROOT, 'sentry.server.config.ts'),
        'utf-8',
      );
      expect(config).toMatch(/const\s+dsn\s*=\s*process\.env\.SENTRY_DSN/);
      expect(config).toMatch(/if\s*\(\s*dsn\s*\)/);
    });

    it('edge config uses if (dsn) guard', () => {
      const config = readFileSync(
        join(ROOT, 'sentry.edge.config.ts'),
        'utf-8',
      );
      expect(config).toMatch(/if\s*\(\s*dsn\s*\)/);
    });

    it('instrumentation registers both runtimes', () => {
      const inst = readFileSync(
        join(ROOT, 'instrumentation.ts'),
        'utf-8',
      );
      expect(inst).toContain('NEXT_RUNTIME');
      expect(inst).toContain('nodejs');
      expect(inst).toContain('edge');
    });
  });

  describe('PII protection', () => {
    it('server config filters user.email / ip / username', () => {
      const config = readFileSync(
        join(ROOT, 'sentry.server.config.ts'),
        'utf-8',
      );
      expect(config).toMatch(/delete\s+event\.user\.email/);
      expect(config).toMatch(/delete\s+event\.user\.ip_address/);
      expect(config).toMatch(/delete\s+event\.user\.username/);
    });
  });
});
