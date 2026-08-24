/**
 * TDD Gate 1 — TD-502 Route ↔ Audit 整合測試
 *
 * 涵蓋：
 * 1. 未登入 → 401 + 1 筆 chat.unauthorized audit
 * 2. 已登入 + 超過 rate limit → 429 + 1 筆 chat.rate_limited audit
 * 3. 已登入 + 正常 → 200 + 1 筆 chat.start + 1 筆 chat.success audit
 * 4. Provider 錯誤 → SSE error + 1 筆 chat.error audit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('TD-502 ChatStream route + audit 整合', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // 重置 audit log + rate limit（確保每個測試乾淨）
    const { resetAuditLog } = await import('@/lib/ai/chat/chat-audit');
    const { resetChatRateLimit } = await import(
      '@/lib/ai/chat/chat-rate-limit'
    );
    resetAuditLog();
    resetChatRateLimit();

    // mock auth
    vi.doMock('@/lib/auth/auth', () => ({
      getCurrentUser: vi.fn().mockResolvedValue({
        id: 'user-audit',
        role: 'admin',
      }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock('@/lib/auth/auth');
  });

  it('未登入 → 401 + 1 筆 chat.unauthorized audit', async () => {
    vi.doMock('@/lib/auth/auth', () => ({
      getCurrentUser: vi.fn().mockResolvedValue(null),
    }));

    const { POST } = await import('@/app/api/chat/stream/route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    const response = await POST(req as never);

    expect(response.status).toBe(401);

    const { getAuditLog } = await import('@/lib/ai/chat/chat-audit');
    const events = getAuditLog();
    expect(events).toHaveLength(1);
    expect(events[0]!.action).toBe('chat.unauthorized');
  });

  it('超過 rate limit → 429 + 1 筆 chat.rate_limited audit', async () => {
    // 先打 20 次用光限額（CHAT_RATE_LIMIT = 20）
    const { checkChatRateLimit } = await import(
      '@/lib/ai/chat/chat-rate-limit'
    );
    for (let i = 0; i < 20; i++) {
      checkChatRateLimit('user-audit', { limit: 20, windowMs: 60_000 });
    }

    const { POST } = await import('@/app/api/chat/stream/route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    const response = await POST(req as never);

    expect(response.status).toBe(429);

    const { getAuditLog } = await import('@/lib/ai/chat/chat-audit');
    const rateEvents = getAuditLog().filter(
      (e) => e.action === 'chat.rate_limited',
    );
    expect(rateEvents).toHaveLength(1);
    expect(rateEvents[0]!.userId).toBe('user-audit');
  });

  it('正常回應 → 1 筆 chat.start + 1 筆 chat.success', async () => {
    vi.stubEnv('AI_DEFAULT_PROVIDER', 'mock');

    const { POST } = await import('@/app/api/chat/stream/route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    const response = await POST(req as never);
    await response.text();

    const { getAuditLog } = await import('@/lib/ai/chat/chat-audit');
    const events = getAuditLog();
    expect(events.map((e) => e.action)).toContain('chat.start');
    expect(events.map((e) => e.action)).toContain('chat.success');
  }, 30000);

  it('Provider 錯誤 → 1 筆 chat.start + 1 筆 chat.error', async () => {
    vi.stubEnv('AI_DEFAULT_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    const { POST } = await import('@/app/api/chat/stream/route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    const response = await POST(req as never);
    await response.text();

    const { getAuditLog } = await import('@/lib/ai/chat/chat-audit');
    const events = getAuditLog();
    expect(events.map((e) => e.action)).toContain('chat.start');
    expect(events.map((e) => e.action)).toContain('chat.error');
    const errorEvent = events.find((e) => e.action === 'chat.error');
    expect(errorEvent?.metadata).toMatchObject({ errorMessage: expect.any(String) });
  });
});
