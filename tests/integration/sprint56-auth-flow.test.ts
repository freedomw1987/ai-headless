/**
 * ==============================================
 *  Sprint 56 Auth Flow Guard Test
 * ==============================================
 *
 * 守護測試：確保 sprint 56 完成的 email verification + password reset 流程存在
 * - 沒檔案 → 失敗
 * - 改了刪掉 → 失敗
 *
 * 對應 docs/sprint56-plan-gate.md §4
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

describe('Sprint 56 Auth Flow Guard', () => {
  describe('Email Service (R2)', () => {
    it('has lib/email.ts', () => {
      expect(existsSync(join(ROOT, 'lib/email.ts'))).toBe(true);
    });
    it('has lib/email.test.ts', () => {
      expect(existsSync(join(ROOT, 'lib/email.test.ts'))).toBe(true);
    });
    it('.env.example has SMTP_HOST', () => {
      const env = require('fs').readFileSync(
        join(ROOT, '.env.example'),
        'utf-8',
      );
      expect(env).toContain('SMTP_HOST');
      expect(env).toContain('SMTP_USER');
      expect(env).toContain('SMTP_PASS');
      expect(env).toContain('SMTP_FROM');
    });
  });

  describe('Email Verification (P0-1)', () => {
    it('has verification template', () => {
      expect(
        existsSync(join(ROOT, 'lib/email-templates/verification.tsx')),
      ).toBe(true);
    });
    it('has verification token helper', () => {
      expect(
        existsSync(join(ROOT, 'lib/auth/verification-token.ts')),
      ).toBe(true);
    });
    it('has verify API route', () => {
      expect(
        existsSync(join(ROOT, 'app/api/auth/verify/route.ts')),
      ).toBe(true);
    });
  });

  describe('Password Reset (P0-2)', () => {
    it('has password reset template', () => {
      expect(
        existsSync(join(ROOT, 'lib/email-templates/password-reset.tsx')),
      ).toBe(true);
    });
    it('has password reset token helper', () => {
      expect(
        existsSync(join(ROOT, 'lib/auth/password-reset-token.ts')),
      ).toBe(true);
    });
    it('has forgot-password API route', () => {
      expect(
        existsSync(join(ROOT, 'app/api/auth/forgot-password/route.ts')),
      ).toBe(true);
    });
    it('has reset-password API route', () => {
      expect(
        existsSync(join(ROOT, 'app/api/auth/reset-password/route.ts')),
      ).toBe(true);
    });
    it('has forgot-password page', () => {
      expect(
        existsSync(join(ROOT, 'app/(public)/admin/forgot-password/page.tsx')),
      ).toBe(true);
    });
    it('has reset-password page', () => {
      expect(
        existsSync(join(ROOT, 'app/(public)/admin/reset-password/page.tsx')),
      ).toBe(true);
    });
  });

  describe('Middleware allows public auth routes', () => {
    it('middleware.ts excludes forgot-password', () => {
      const mw = require('fs').readFileSync(
        join(ROOT, 'middleware.ts'),
        'utf-8',
      );
      expect(mw).toContain('/admin/forgot-password');
      expect(mw).toContain('/admin/reset-password');
      expect(mw).toContain('/api/auth/verify');
    });
  });
});
