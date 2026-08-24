/**
 * TDD Gate 1 — TD-505 SSE Usage 整合測試
 *
 * 涵蓋：
 * 1. /api/chat/stream 結尾送 usage 事件（MockProvider 提供估算 usage）
 * 2. chat-audit 紀錄 chat.usage 事件 + usage metadata
 * 3. parseStreamChunk 能解析 usage chunk
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseStreamChunk } from '@/lib/ai/chat/chat-utils';

describe('TD-505 SSE Usage 整合', () => {
  describe('parseStreamChunk usage 解析', () => {
    it('解析 data: {"usage":{...}} 事件', () => {
      const chunk = `data: ${JSON.stringify({
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      })}\n\n`;

      const parsed = parseStreamChunk(chunk);

      expect(parsed).not.toBeNull();
      expect(parsed!.content).toBe('');
      expect(parsed!.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('普通 content chunk 不帶 usage', () => {
      const chunk = `data: ${JSON.stringify({ content: 'hello' })}\n\n`;
      const parsed = parseStreamChunk(chunk);

      expect(parsed!.content).toBe('hello');
      expect(parsed!.usage).toBeUndefined();
    });

    it('無效的 usage 物件(缺欄位)當作普通 chunk 處理', () => {
      const chunk = `data: ${JSON.stringify({ usage: { foo: 'bar' } })}\n\n`;
      const parsed = parseStreamChunk(chunk);

      expect(parsed!.content).toBe('');
      expect(parsed!.usage).toBeUndefined();
    });

    it('[DONE] 事件不帶 usage', () => {
      const chunk = 'data: [DONE]\n\n';
      const parsed = parseStreamChunk(chunk);

      expect(parsed!.done).toBe(true);
      expect(parsed!.usage).toBeUndefined();
    });
  });

  describe('/api/chat/stream SSE 端對端', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const { resetAuditLog } = await import('@/lib/ai/chat/chat-audit');
      const { resetChatRateLimit } = await import(
        '@/lib/ai/chat/chat-rate-limit'
      );
      resetAuditLog();
      resetChatRateLimit();

      vi.doMock('@/lib/auth/auth', () => ({
        getCurrentUser: vi.fn().mockResolvedValue({
          id: 'user-td505',
          role: 'admin',
        }),
      }));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.resetModules();
      vi.doUnmock('@/lib/auth/auth');
    });

    it('正常回應 → SSE 結尾含 usage 事件 + chat.usage audit', async () => {
      vi.stubEnv('AI_DEFAULT_PROVIDER', 'mock');

      const { POST } = await import('@/app/api/chat/stream/route');
      const req = new Request('http://localhost/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: '幫我做個待辦' }],
        }),
      });

      const response = await POST(req as never);

      // 讀整個 SSE stream
      const text = await response.text();

      // 應該有 usage 事件
      const lines = text.split('\n').filter((l) => l.startsWith('data:'));
      const usageLine = lines.find((l) => l.includes('"usage"'));
      expect(usageLine).toBeDefined();

      const usageData = JSON.parse(usageLine!.slice(5).trim());
      expect(usageData.usage).toMatchObject({
        promptTokens: expect.any(Number),
        completionTokens: expect.any(Number),
        totalTokens: expect.any(Number),
      });

      // 應該有 [DONE]
      expect(text).toContain('[DONE]');

      // chat.usage audit 應存在
      const { getAuditLog } = await import('@/lib/ai/chat/chat-audit');
      const usageEvents = getAuditLog().filter((e) => e.action === 'chat.usage');
      expect(usageEvents).toHaveLength(1);
      expect(usageEvents[0]!.userId).toBe('user-td505');
      expect(usageEvents[0]!.metadata).toMatchObject({
        usage: expect.objectContaining({
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalTokens: expect.any(Number),
        }),
        provider: 'mock',
      });
    }, 30000);

    it('Provider 失敗 → 不送 usage 事件、不寫 chat.usage audit', async () => {
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

      // 不應該有 usage 事件
      expect(text).not.toMatch(/"usage":\{/);

      // chat.usage audit 不應存在
      const { getAuditLog } = await import('@/lib/ai/chat/chat-audit');
      const usageEvents = getAuditLog().filter((e) => e.action === 'chat.usage');
      expect(usageEvents).toHaveLength(0);
    });
  });
});