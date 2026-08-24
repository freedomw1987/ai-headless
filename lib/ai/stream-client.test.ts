/**
 * TDD Gate 1 — TD-406 Stream Chat Retry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamChatWithRetry } from './stream-client';

// Mock parseStreamChunk
vi.mock('@/lib/ai/chat/chat-utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/chat/chat-utils')>(
    '@/lib/ai/chat/chat-utils',
  );
  return actual;
});

// Helper: 建立 mock ReadableStream
function makeMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    async pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]!));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('TD-406 streamChatWithRetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('成功串流直接輸出', async () => {
    const stream = makeMockStream([
      'data: {"content":"hello"}\n\n',
      'data: {"content":" world"}\n\n',
      'data: [DONE]\n\n',
    ]);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    }));

    const chunks: string[] = [];
    for await (const content of streamChatWithRetry(
      [{ role: 'user', content: 'hi' }],
    )) {
      chunks.push(content);
    }

    expect(chunks.join('')).toBe('hello world');
  });

  it('網絡錯誤自動 retry', async () => {
    const stream = makeMockStream([
      'data: {"content":"after-retry"}\n\n',
      'data: [DONE]\n\n',
    ]);

    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, body: stream });

    vi.stubGlobal('fetch', fetchMock);

    const onRetry = vi.fn();
    const chunks: string[] = [];
    for await (const content of streamChatWithRetry(
      [{ role: 'user', content: 'hi' }],
      { maxRetries: 2, onRetry },
    )) {
      chunks.push(content);
    }

    expect(chunks.join('')).toBe('after-retry');
    expect(onRetry).toHaveBeenCalledWith(1);
  });

  it('達到 maxRetries 後拋錯', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));

    vi.stubGlobal('fetch', fetchMock);

    const onRetry = vi.fn();

    await expect(async () => {
      for await (const _ of streamChatWithRetry(
        [{ role: 'user', content: 'hi' }],
        { maxRetries: 2, onRetry },
      )) {
        // consume
      }
    }).rejects.toThrow('Network error');

    // 初次 + 2 retries = 3 次
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('HTTP 4xx 不 retry 直接拋錯', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    }));

    await expect(async () => {
      for await (const _ of streamChatWithRetry(
        [{ role: 'user', content: 'hi' }],
        { maxRetries: 2 },
      )) {
        // consume
      }
    }).rejects.toThrow('401');
  });

  it('HTTP 5xx 自動 retry', async () => {
    const stream = makeMockStream(['data: {"content":"ok"}\n\n', 'data: [DONE]\n\n']);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' })
      .mockResolvedValueOnce({ ok: true, body: stream });

    vi.stubGlobal('fetch', fetchMock);

    const chunks: string[] = [];
    for await (const content of streamChatWithRetry(
      [{ role: 'user', content: 'hi' }],
      { maxRetries: 2 },
    )) {
      chunks.push(content);
    }

    expect(chunks.join('')).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});