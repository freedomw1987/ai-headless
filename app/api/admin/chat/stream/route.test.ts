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

  it('route 應使用 streamChatMessages (Sprint 46 pi-agent-sdk 重構)', () => {
    const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');
    expect(source, '應使用 streamChatMessages (pi-agent-sdk wrapper)').toMatch(/streamChatMessages/);
    // Sprint 46 重構: 不再直接呼叫 createProviderFromDB
    expect(source, '不應再 import createProviderFromDB (Sprint 46 重構)').not.toMatch(/createProviderFromDB/);
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

  it('useChatStream 應呼叫 /api/admin/chat/stream', () => {
    // S45-B 重構: fetch 邏輯移入 useChatStream hook
    const candidates = [
      'app/admin/_components/use-chat-stream.ts',
      'app/admin/_components/use-chat-stream.tsx',
    ];
    const found = candidates.some((p) => existsSync(p));
    expect(found, 'useChatStream 應存在').toBe(true);
    const path = candidates.find((p) => existsSync(p))!;
    const source = readFileSync(path, 'utf-8');
    expect(source, '應呼叫 admin endpoint').toMatch(/\/api\/admin\/chat\/stream/);
  });
});

/**
 * Sprint 47 Commit 3 (Stage 47-2) — Vision 端到端守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.3 (FR-3.1 ~ FR-3.4)
 *
 * 目的 (static source code check):
 * - route 接受 RequestBody.images 參數 (ImageContent[])
 * - route 將 images 傳給 streamChatMessages
 * - route 不再 base64+prompt 自組（交 SDK 原生）
 */
describe('S47-2 — /api/admin/chat/stream Vision images', () => {
  const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');

  it('route 應接受 RequestBody.images 型別', () => {
    expect(source, '應有 images?: ImageContent[] 欄位').toMatch(/images\?:.*ImageContent|mages\?:\s*Array<.*image/i);
  });

  it('route 應將 images 傳給 streamChatMessages', () => {
    // 驗證 streamChatMessages({ ..., images, ... })
    expect(source, '應傳 images 參數給 streamChatMessages').toMatch(/streamChatMessages\s*\(\s*\{[\s\S]*?images\s*,/);
  });

  it('route 不應再以 base64 文字方式拼 prompt（被 SDK 原生取代）', () => {
    // Sprint 47-2 改用 PromptOptions.images，原 Sprint 46 的 base64 拼 prompt 邏輯
    // 不應在 stream route 出現 (readAttachmentImage 仍在 attachment-reader 內)
    expect(source, '不應再 base64+prompt 自組').not.toMatch(/base64.*data:.*image|prompt.*images\.join/i);
  });
});

/**
 * Sprint 47 Commit 7 (Stage 47-6) — Session Ownership 守護測試 (FR-7.2, FR-7.3)
 *
 * 驗證 stream route 接收 sessionId 後會 call requireSessionOwnership
 * 防止 user A 透過 body 傳 user B 的 sessionId 取得附件
 *
 * 安全背景: Sprint 46 reflection P2 風險揭露
 */
describe('S47-6 — /api/admin/chat/stream Session Ownership', () => {
  const source = readFileSync('app/api/admin/chat/stream/route.ts', 'utf-8');

  it('route 應 import requireSessionOwnership', () => {
    expect(source, '應 import requireSessionOwnership').toMatch(/requireSessionOwnership/);
  });

  it('route 應 import SessionOwnershipError', () => {
    expect(source, '應 import SessionOwnershipError').toMatch(/SessionOwnershipError/);
  });

  it('route 應在 sessionId 存在時呼叫 requireSessionOwnership', () => {
    // 驗證程式碼邏輯: if (sessionId) { await requireSessionOwnership(...) }
    expect(
      source,
      '應有 sessionId 存在時呼叫 ownership check',
    ).toMatch(/if\s*\(\s*sessionId\s*\)\s*\{[\s\S]*?requireSessionOwnership/);
  });

  it('route 應捕獲 SessionOwnershipError 並回傳 status', () => {
    // 驗證: catch (err) { if (err instanceof SessionOwnershipError) { return status: err.status } }
    expect(
      source,
      '應捕獲 SessionOwnershipError 並回對應 status',
    ).toMatch(/instanceof\s+SessionOwnershipError[\s\S]*?err\.status/);
  });

  it('session-ownership helper 檔案應存在', () => {
    expect(
      existsSync('lib/auth/session-ownership.ts'),
      'lib/auth/session-ownership.ts 應存在',
    ).toBe(true);
  });

  it('session-ownership helper 應 export SessionOwnershipError class', () => {
    const helperSource = readFileSync('lib/auth/session-ownership.ts', 'utf-8');
    expect(helperSource, '應 export class SessionOwnershipError').toMatch(
      /export\s+class\s+SessionOwnershipError/,
    );
  });

  it('session-ownership helper 應 export requireSessionOwnership function', () => {
    const helperSource = readFileSync('lib/auth/session-ownership.ts', 'utf-8');
    expect(helperSource, '應 export function requireSessionOwnership').toMatch(
      /export\s+async\s+function\s+requireSessionOwnership/,
    );
  });
});