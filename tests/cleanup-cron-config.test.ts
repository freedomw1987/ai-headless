/**
 * Sprint 47 Commit 6 (Stage 47-5) — Cleanup Cron 配置守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.6 (FR-6.1, FR-6.3, FR-6.5)
 *
 * 驗證:
 * - vercel.json 存在且 crons 設定正確 (path + schedule)
 * - pnpm cleanup:once script 已設定
 * - .env.example 含 CRON_SECRET 範例
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S47-5 — Cleanup Cron 配置守護', () => {
  describe('vercel.json (FR-6.1)', () => {
    it('vercel.json 應存在', () => {
      expect(existsSync('vercel.json'), 'vercel.json 不存在').toBe(true);
    });

    it('vercel.json 應有 crons 設定', () => {
      const content = readFileSync('vercel.json', 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
      const config = JSON.parse(content);
      expect(config.crons).toBeTruthy();
      expect(Array.isArray(config.crons)).toBe(true);
      expect(config.crons.length).toBeGreaterThan(0);
    });

    it('vercel.json 應設定 cleanup-attachments cron (每日 03:00 UTC)', () => {
      const config = JSON.parse(readFileSync('vercel.json', 'utf-8'));
      const cleanupCron = config.crons.find(
        (c: { path: string }) => c.path === '/api/cron/cleanup-attachments',
      );
      expect(cleanupCron, '應有 cleanup-attachments cron 設定').toBeTruthy();
      expect(cleanupCron.schedule).toBe('0 3 * * *'); // 每日 03:00 UTC
    });
  });

  describe('pnpm cleanup:once script (FR-6.3)', () => {
    it('package.json 應有 cleanup:once script', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      expect(pkg.scripts['cleanup:once'], '應有 cleanup:once script').toBeTruthy();
      expect(pkg.scripts['cleanup:once']).toMatch(/scripts\/cleanup-attachments-once\.ts/);
    });

    it('cleanup-attachments-once.ts 應存在', () => {
      expect(existsSync('scripts/cleanup-attachments-once.ts')).toBe(true);
    });

    it('cleanup-attachments-once.ts 應呼叫 cleanupOldAttachments', () => {
      const source = readFileSync('scripts/cleanup-attachments-once.ts', 'utf-8');
      expect(source).toMatch(/cleanupOldAttachments/);
    });
  });

  describe('.env.example (FR-6.5)', () => {
    it('.env.example 應含 CRON_SECRET 範例', () => {
      const content = readFileSync('.env.example', 'utf-8');
      expect(content, '應含 CRON_SECRET').toMatch(/CRON_SECRET/);
    });
  });
});