/**
 * Sprint 44 Commit F — /api/admin/chat/stream API 守護測試
 *
 * 設計 (S44 Plan Gate Commit F):
 * - /api/admin/chat/stream: admin-only SSE streaming chat
 * - 複用 Sprint 43 createProviderFromDB (Custom URL 支援)
 * - 複用既有 SSE streaming pattern (參考 /api/chat/stream)
 * - admin-only auth check
 *
 * 注意:
 * - 真實串流驗證交給 e2e (S44-H)
 * - 此守護測試是 pattern + filesystem check
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S44-F — /api/admin/chat/stream API', () => {
  it('應有 /api/admin/chat/stream/route.ts 檔案', () => {
    expect(
      existsSync('app/api/admin/chat/stream/route.ts'),
      '/api/admin/chat/stream route 不存在'
    ).toBe(true);
  });

  it('route 應 export POST handler (SSE streaming)', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    expect(source, '應有 export async function POST').toMatch(/export\s+(async\s+)?function\s+POST/);
  });

  it('route 應有 admin-only auth check', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    // 應有 role check 或 requireAdminAuth
    const hasAdminCheck =
      /role.*admin|requireAdminAuth|admin.*only|requireAdmin/i.test(source);
    expect(hasAdminCheck, '應有 admin-only 權限檢查').toBe(true);
  });

  it('route 應使用 createProviderFromDB (Sprint 43 Custom URL 支援)', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    expect(source, '應使用 createProviderFromDB').toMatch(/createProviderFromDB/);
  });

  it('route 應回傳 text/event-stream SSE response', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    expect(source, '應有 text/event-stream header').toMatch(/text\/event-stream/);
  });

  it('route 應有 try/catch 包串流 (失敗不回傳 500)', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    expect(source, '應有 try/catch 處理串流錯誤').toMatch(/try\s*\{[\s\S]*catch/);
  });

  it('route 應有 SSE data: [DONE] 結尾訊號', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    expect(source, '應有 [DONE] 結尾訊號').toMatch(/\[DONE\]/);
  });

  it('AdminChatPanel 應呼叫 /api/admin/chat/stream', () => {
    const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
    expect(source, 'AdminChatPanel 應呼叫 admin endpoint').toMatch(/\/api\/admin\/chat\/stream/);
  });
});