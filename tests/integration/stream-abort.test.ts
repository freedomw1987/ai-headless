/**
 * TDD Gate 1 — S5.2 TD-503 SSE Abort 整合測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamChatWithRetry } from '@/lib/ai/stream-client';
import { createStreamController, abortStream } from '@/lib/ai/stream-controller';

describe('S5.2 TD-503 Stream Abort 整合', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetch 收到 signal，abort 後拋 AbortError', async () => {
    const controller = new AbortController();

    // mock fetch 拋 AbortError
    mockFetch.mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    // 啟動串流
    const promise = (async () => {
      const chunks: string[] = [];
      for await (const c of streamChatWithRetry(
        [{ role: 'user', content: 'hi' }],
        { signal: controller.signal, maxRetries: 0 },
      )) {
        chunks.push(c);
      }
      return chunks;
    })();

    // 等待 fetch 開始
    await new Promise((r) => setTimeout(r, 10));

    // abort
    controller.abort();

    await expect(promise).rejects.toThrow(/AbortError|aborted/i);
  });

  it('AbortError 不 retry（避免重複請求）', async () => {
    const controller = createStreamController('abort-test');

    mockFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(async () => {
      for await (const _ of streamChatWithRetry(
        [{ role: 'user', content: 'hi' }],
        { signal: controller.signal, maxRetries: 2 },
      )) {
        // consume
      }
    }).rejects.toThrow();

    // 只呼叫一次（沒 retry）
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});