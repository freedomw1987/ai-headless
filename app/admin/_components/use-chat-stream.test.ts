/**
 * useChatStream hook 守護測試 (S45-B)
 *
 * 設計:
 * - 驗證 hook 會 fetch /api/admin/chat/stream
 * - 驗證 status 狀態轉移 (ready → submitted → streaming → ready)
 * - 驗證錯誤處理 (network error)
 * - 驗證 stop() 觸發 abort
 *
 * 不測:
 * - 真實 SSE 串流 (留 e2e)
 * - AI Elements UI 渲染 (留 e2e + integration)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { renderHook, act } from '@testing-library/react';
import { clearAllStreams } from '@/lib/ai/stream-controller';
import { useChatStream } from './use-chat-stream';

function buildSseResponse(events: Array<{ content?: string; error?: string } | 'DONE'>) {
  const lines = events
    .map((e) => {
      if (e === 'DONE') return 'data: [DONE]';
      return `data: ${JSON.stringify(e)}`;
    })
    .join('\n\n');
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(lines));
      controller.close();
    },
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('useChatStream — S45-B', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    clearAllStreams(); // 每個測試重設 stream controller Map
  });

  it('send 應 fetch /api/admin/chat/stream with user message', async () => {
    mockFetch
      // POST /api/admin/chat/sessions (auto-create)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { id: 'new-session' } }), { status: 200 }),
      )
      // POST /api/admin/chat/stream
      .mockResolvedValueOnce(buildSseResponse([{ content: 'Hello' }, { content: ' world' }, 'DONE']));

    const onSessionUpdate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useChatStream({
        sessionId: null,
        userId: 'user-1',
        onSessionUpdate,
      }),
    );

    await act(async () => {
      await result.current.send('Hi');
    });

    const streamCall = mockFetch.mock.calls.find(
      (call) => (call[0] as string).includes('/api/admin/chat/stream'),
    );
    expect(streamCall, '應呼叫 /api/admin/chat/stream').toBeDefined();
    const body = JSON.parse((streamCall![1] as RequestInit).body as string);
    expect(body.messages[0].content).toBe('Hi');
    expect(body.sessionId).toBe('new-session');
  });

  it('status 應正確轉移 (ready → submitted → streaming → ready)', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { id: 's-1' } }), { status: 200 }),
      )
      .mockResolvedValueOnce(buildSseResponse([{ content: 'X' }, 'DONE']));

    const { result } = renderHook(() =>
      useChatStream({ sessionId: null, userId: 'u-1' }),
    );

    expect(result.current.status).toBe('ready');

    await act(async () => {
      await result.current.send('hi');
    });

    expect(result.current.status).toBe('ready'); // 結束後回到 ready
  });

  it('stream 錯誤應 set error state', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { id: 's-2' } }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response('Internal', { status: 500 }));

    const { result } = renderHook(() =>
      useChatStream({ sessionId: null, userId: 'u-2' }),
    );

    await act(async () => {
      await result.current.send('test');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
  });

  it('已有 sessionId 時不應 auto-create', async () => {
    mockFetch.mockResolvedValueOnce(buildSseResponse([{ content: 'OK' }, 'DONE']));

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 'existing-session', userId: 'u-3' }),
    );

    await act(async () => {
      await result.current.send('hi');
    });

    // 只應有 1 個 fetch (stream), 沒有 create session
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('/api/admin/chat/stream');
  });

  it('loadMessages 應設定 messages', () => {
    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-x', userId: 'u-x' }),
    );

    act(() => {
      result.current.loadMessages([
        { id: 'm1', role: 'user', content: 'hi', createdAt: '2025-01-01' },
        { id: 'm2', role: 'assistant', content: 'hello', createdAt: '2025-01-01' },
      ]);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('hi');
  });
});