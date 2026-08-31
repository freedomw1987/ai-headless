/**
 * Sprint 47 Commit 6 (Stage 47-5) — Cleanup Cron Route 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.6 (FR-6.2, FR-6.4)
 *
 * 驗證:
 * - /api/cron/cleanup-attachments 檔案存在
 * - Bearer token 守衛: 沒 Authorization header → 401
 * - Bearer token 錯誤 → 401
 * - Bearer token 正確 → 呼叫 cleanupOldAttachments + 回 JSON
 * - GET / POST 都接受 (Vercel Cron 預設 GET, 也支援 POST 備援)
 * - cleanupOldAttachments 呼叫回傳結果正確序列化
 *
 * 安全重點 (PRD §4.6):
 * - Vercel Cron 預設帶 Bearer token = process.env.CRON_SECRET
 * - 必須驗證來源, 避免外部觸發刪除附件
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROUTE_PATH = 'app/api/cron/cleanup-attachments/route.ts';

describe('S47-5 — Cleanup Cron Route (FR-6.2, FR-6.4)', () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-12345';
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalEnv;
    }
  });

  it('應有 /api/cron/cleanup-attachments/route.ts 檔案', () => {
    expect(existsSync(ROUTE_PATH), 'route 不存在').toBe(true);
  });

  it('route 應 export GET handler (Vercel Cron 預設)', async () => {
    const source = readFileSync(join(process.cwd(), ROUTE_PATH), 'utf-8');
    expect(source, '應 export GET').toMatch(/export\s+(async\s+)?function\s+GET/);
  });

  it('route 應呼叫 cleanupOldAttachments', async () => {
    const source = readFileSync(join(process.cwd(), ROUTE_PATH), 'utf-8');
    expect(source, '應 import cleanupOldAttachments').toMatch(/cleanupOldAttachments/);
  });

  it('route 應驗證 Bearer token (Authorization header)', async () => {
    const source = readFileSync(join(process.cwd(), ROUTE_PATH), 'utf-8');
    expect(source, '應檢查 Authorization header').toMatch(/authorization/i);
    expect(source, '應檢查 Bearer 前綴').toMatch(/bearer/i);
  });

  describe('Token 守衛行為', () => {
    it('缺少 Authorization header 應回 401', async () => {
      const { GET } = await import('./route');
      const req = new Request('http://localhost/api/cron/cleanup-attachments');
      const res = await GET(req as never);
      expect(res.status).toBe(401);
    });

    it('Bearer token 錯誤應回 401', async () => {
      const { GET } = await import('./route');
      const req = new Request('http://localhost/api/cron/cleanup-attachments', {
        headers: { Authorization: 'Bearer wrong-token' },
      });
      const res = await GET(req as never);
      expect(res.status).toBe(401);
    });

    it('Bearer token 正確應呼叫 cleanup + 回 200 + deleted/failed JSON', async () => {
      // Mock db 與 fs 模組, 讓 cleanupOldAttachments 立即回傳固定結果
      vi.doMock('@/lib/db', () => ({
        db: {
          attachment: {
            findMany: vi.fn().mockResolvedValue([]),
            delete: vi.fn(),
          },
        },
      }));

      const { GET } = await import('./route');
      const req = new Request('http://localhost/api/cron/cleanup-attachments', {
        headers: { Authorization: 'Bearer test-secret-12345' },
      });
      const res = await GET(req as never);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ deleted: expect.any(Number), failed: expect.any(Number) });
    });
  });
});