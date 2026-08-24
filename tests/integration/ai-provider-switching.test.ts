/**
 * TDD Gate 1 — S4.4 AI Provider 真實串接整合測試
 *
 * 涵蓋：
 * 1. ChatStream route 接收 messages → 呼叫 Provider → 回傳 SSE
 * 2. Provider 自動切換（無 API key → mock）
 * 3. Error 情況正確回應
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('S4.4 ChatStream route + Provider 整合', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    // TD-502: mock auth 以避免 next-auth 的 next/server import
    vi.doMock('@/lib/auth/auth', () => ({
      getCurrentUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'admin' }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock('@/lib/auth/auth');
  });

  it('AI_DEFAULT_PROVIDER=mock 時呼叫 MockProvider（不發 API 請求）', async () => {
    vi.stubEnv('AI_DEFAULT_PROVIDER', 'mock');

    const { POST } = await import('@/app/api/chat/stream/route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: '幫我做待辦' }],
      }),
    });

    const response = await POST(req as never);
    const text = await response.text();

    expect(mockFetch).not.toHaveBeenCalled(); // Mock 不發 API
    expect(text).toContain('data:'); // SSE 格式
    expect(text).toContain('[DONE]');
  }, 30000); // Mock stream 需 ~9s

  it('AI_DEFAULT_PROVIDER=openai + 有 key → 呼叫 OpenAI API', async () => {
    vi.stubEnv('AI_DEFAULT_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'sk-test');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n'),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

    const { POST } = await import('@/app/api/chat/stream/route');
    const req = new Request('http://localhost/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    const response = await POST(req as never);
    await response.text();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
  });

  it('OpenAI API 失敗時 SSE 回傳 error', async () => {
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
    const text = await response.text();

    expect(text).toContain('"error"');
    expect(text).toContain('Invalid API key');
  });
});