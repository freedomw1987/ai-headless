/**
 * Sprint 58 Onboarding + Legal — Integration Guard Tests
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

describe('Sprint 58 — Onboarding + Legal (file guards)', () => {
  describe('P0-7 Onboarding', () => {
    it('register API route exists', () => {
      expect(existsSync(join(ROOT, 'app/api/auth/register/route.ts'))).toBe(true);
    });

    it('onboarding API route exists', () => {
      expect(existsSync(join(ROOT, 'app/api/user/onboarding/route.ts'))).toBe(true);
    });

    it('register page exists', () => {
      expect(existsSync(join(ROOT, 'app/(public)/admin/register/page.tsx'))).toBe(
        true,
      );
      expect(
        existsSync(join(ROOT, 'app/(public)/admin/register/register-form.tsx')),
      ).toBe(true);
    });

    it('onboarding page exists', () => {
      expect(
        existsSync(join(ROOT, 'app/(admin)/admin/onboarding/page.tsx')),
      ).toBe(true);
    });

    it('onboarding components exist', () => {
      expect(
        existsSync(join(ROOT, 'components/admin/onboarding-banner.tsx')),
      ).toBe(true);
      expect(
        existsSync(join(ROOT, 'components/admin/onboarding-wizard.tsx')),
      ).toBe(true);
    });

    it('register form uses apiFetch for CSRF protection', () => {
      const form = readFileSync(
        join(ROOT, 'app/(public)/admin/register/register-form.tsx'),
        'utf-8',
      );
      expect(form).toContain('apiFetch');
      expect(form).toContain('ensureCsrfToken');
    });

    it('onboarding wizard handles skip action', () => {
      const wiz = readFileSync(
        join(ROOT, 'components/admin/onboarding-wizard.tsx'),
        'utf-8',
      );
      expect(wiz).toContain("action: 'skip'");
      expect(wiz).toContain("action: 'advance'");
      expect(wiz).toContain("action: 'complete'");
    });
  });

  describe('P0-8 ToS / Privacy', () => {
    it('legal pages exist', () => {
      expect(
        existsSync(join(ROOT, 'app/(public)/legal/terms/page.tsx')),
      ).toBe(true);
      expect(
        existsSync(join(ROOT, 'app/(public)/legal/privacy/page.tsx')),
      ).toBe(true);
    });

    it('4 legal markdown files exist', () => {
      expect(
        existsSync(join(ROOT, 'content/legal/terms.zh-TW.md')),
      ).toBe(true);
      expect(existsSync(join(ROOT, 'content/legal/terms.en.md'))).toBe(true);
      expect(
        existsSync(join(ROOT, 'content/legal/privacy.zh-TW.md')),
      ).toBe(true);
      expect(existsSync(join(ROOT, 'content/legal/privacy.en.md'))).toBe(
        true,
      );
    });

    it('_meta.json exists with version', () => {
      const meta = JSON.parse(
        readFileSync(join(ROOT, 'content/legal/_meta.json'), 'utf-8'),
      );
      expect(meta.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(meta.terms['zh-TW'].version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(meta.privacy.en.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('legal loader lib exists', () => {
      expect(existsSync(join(ROOT, 'lib/legal.ts'))).toBe(true);
    });
  });

  describe('Schema migration', () => {
    it('Sprint 58 migration exists with required fields', () => {
      const sql = readFileSync(
        join(
          ROOT,
          'prisma/migrations/20260905180000_sprint58_user_legal/migration.sql',
        ),
        'utf-8',
      );
      expect(sql).toContain('onboardingStep');
      expect(sql).toContain('acceptedTosVersion');
      expect(sql).toContain('acceptedPrivacyVersion');
      expect(sql).toContain('tosAcceptedAt');
    });

    it('User model in prisma schema has new fields', () => {
      const schema = readFileSync(join(ROOT, 'prisma/schema.prisma'), 'utf-8');
      expect(schema).toMatch(/onboardingStep\s+Int\s+@default\(0\)/);
      expect(schema).toContain('acceptedTosVersion');
      expect(schema).toContain('acceptedPrivacyVersion');
      expect(schema).toContain('tosAcceptedAt');
    });
  });

  describe('Middleware updated', () => {
    it('register route is public', () => {
      const mw = readFileSync(join(ROOT, 'middleware.ts'), 'utf-8');
      expect(mw).toContain("'/admin/register'");
    });
  });
});