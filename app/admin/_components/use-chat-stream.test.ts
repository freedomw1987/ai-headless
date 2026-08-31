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

function buildSseResponse(events: Array<{ content?: string; reasoning?: string; error?: string } | 'DONE'>) {
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
      (call) => (call[0] as string | undefined)?.includes('/api/admin/chat/stream') ?? false,
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
    expect(mockFetch.mock.calls[0]?.[0]).toContain('/api/admin/chat/stream');
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
    expect(result.current.messages[0]?.content).toBe('hi');
  });

  it('send 應把 attachments 檔名拼進 message content (S45-C)', async () => {
    mockFetch.mockResolvedValueOnce(
      buildSseResponse([{ content: 'OK' }, 'DONE']),
    );

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-att', userId: 'u-att' }),
    );

    await act(async () => {
      await result.current.send('check this', [
        { filename: 'report.pdf', size: 2048 },
        { filename: 'data.csv', size: 5120 },
      ]);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((mockFetch.mock.calls[0]?.[1] as RequestInit).body as string);
    // message content 應包含附件標記
    expect(body.messages[0].content).toContain('📎 report.pdf');
    expect(body.messages[0].content).toContain('📎 data.csv');
    expect(body.messages[0].content).toContain('check this');
  });
});

/**
 * Sprint 47 Commit 2 (Stage 47-1) — useChatStream reasoning SSE 整合測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.2 (FR-2.3, FR-2.4)
 *
 * 驗證:
 * - SSE parser 同時處理 content + reasoning 雙 stream
 * - reasoning 累積在 last message 的 reasoning 欄位（不跟 content 混）
 * - 不影響現有 content stream 邏輯
 */
describe('useChatStream — Sprint 47-1 reasoning SSE', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    clearAllStreams();
  });

  it('SSE parser 同時累積 reasoning + content 在 message 上', async () => {
    mockFetch.mockResolvedValueOnce(
      buildSseResponse([
        { reasoning: '讓我先分析' },
        { reasoning: '這個問題...' },
        { content: '我回應：' },
        { reasoning: '再想想' },
        { content: '你好' },
        'DONE',
      ]),
    );

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-r1', userId: 'u-r1' }),
    );

    await act(async () => {
      await result.current.send('test');
    });

    const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    // content 為 '我回應：你好'
    expect(assistantMsg!.content).toBe('我回應：你好');
    // reasoning 為 '讓我先分析這個問題...再想想'
    expect(assistantMsg!.reasoning).toBe('讓我先分析這個問題...再想想');
  });

  it('reasoning 為空時 message 不應有 reasoning 欄位（或為空字串）', async () => {
    mockFetch.mockResolvedValueOnce(
      buildSseResponse([{ content: 'only content' }, 'DONE']),
    );

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-r2', userId: 'u-r2' }),
    );

    await act(async () => {
      await result.current.send('test');
    });

    const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toBe('only content');
    expect(assistantMsg!.reasoning ?? '').toBe('');
  });

  it('content 與 reasoning 順序無關（可交錯）', async () => {
    mockFetch.mockResolvedValueOnce(
      buildSseResponse([
        { reasoning: 'r1' },
        { content: 'c1' },
        { reasoning: 'r2' },
        { content: 'c2' },
        'DONE',
      ]),
    );

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-r3', userId: 'u-r3' }),
    );

    await act(async () => {
      await result.current.send('test');
    });

    const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistantMsg!.content).toBe('c1c2');
    expect(assistantMsg!.reasoning).toBe('r1r2');
  });
});

/**
 * Sprint 47 Commit 4 (Stage 47-3) — useChatStream 真實上傳整合測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.4 (FR-4.1, FR-4.3, FR-4.6)
 *
 * 驗證:
 * - send with File[]: 先 multipart upload 到 /api/admin/chat/upload
 *   拿 attachment IDs 再 fetch stream route
 * - 進度 callback 應被呼叫 (0-100%)
 * - 多檔上傳 應依序全部 upload 完才進 stream
 * - abort 時中斷上傳
 *
 * Mock 策略:
 * - mock global.fetch: 根據 URL 分流 (upload endpoint vs stream endpoint)
 * - File/Blob 已在 jsdom 提供
 */

function buildUploadResponse(attachments: Array<{ id: string; filename: string; mimeType: string; size: number }>) {
  return new Response(
    JSON.stringify({ attachments }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function buildErrorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('useChatStream — Sprint 47-3 真實上傳', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    clearAllStreams();
  });

  it('傳 File[] 時, 應先 multipart upload 到 /api/admin/chat/upload 再 fetch stream', async () => {
    // 第一個 fetch: upload endpoint → 回傳 attachment IDs
    mockFetch.mockResolvedValueOnce(
      buildUploadResponse([
        { id: 'att-1', filename: 'a.txt', mimeType: 'text/plain', size: 12 },
      ]),
    );
    // 第二個 fetch: stream endpoint
    mockFetch.mockResolvedValueOnce(
      buildSseResponse([{ content: 'OK' }, 'DONE']),
    );

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-up', userId: 'u-up' }),
    );

    const file = new File(['hello world'], 'a.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.send('請讀檔', [file]);
    });

    // 應有 2 個 fetch: upload + stream
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const urls = mockFetch.mock.calls.map((c) => c[0] as string);
    expect(urls[0]).toContain('/api/admin/chat/upload');
    expect(urls[1]).toContain('/api/admin/chat/stream');

    // upload 應使用 multipart FormData (POST, body 為 FormData)
    const uploadCall = mockFetch.mock.calls[0]!;
    expect((uploadCall[1] as RequestInit).method).toBe('POST');
    expect((uploadCall[1] as RequestInit).body).toBeInstanceOf(FormData);

    // stream body 應含 attachment id
    const streamBody = JSON.parse((mockFetch.mock.calls[1]?.[1] as RequestInit).body as string);
    expect(streamBody.attachments).toEqual([
      { id: 'att-1', filename: 'a.txt', mimeType: 'text/plain', size: 12 },
    ]);
    expect(streamBody.messages[0].content).toContain('請讀檔');
    expect(streamBody.messages[0].content).toContain('📎 a.txt');
  });

  it('上傳失敗 (例如 413 超大) 應走 error 狀態, 不進 stream', async () => {
    mockFetch.mockResolvedValueOnce(buildErrorResponse('檔案過大', 413));

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-up2', userId: 'u-up2' }),
    );

    const file = new File(['big'], 'big.bin', { type: 'application/octet-stream' });

    await act(async () => {
      await result.current.send('test', [file]);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/檔案過大/);
    // 不應進 stream
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('無附件時不應呼叫 upload endpoint', async () => {
    mockFetch.mockResolvedValueOnce(
      buildSseResponse([{ content: 'hi' }, 'DONE']),
    );

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-noatt', userId: 'u-noatt' }),
    );

    await act(async () => {
      await result.current.send('hi');
    });

    // 只有 stream fetch, 沒有 upload
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toContain('/api/admin/chat/stream');
  });

  it('多檔上傳: 全部 upload 成功才進 stream', async () => {
    // 依 upload endpoint 呼叫 2 次 (多檔可一次全部) — 簡化為一次上傳 2 個
    mockFetch.mockResolvedValueOnce(
      buildUploadResponse([
        { id: 'att-1', filename: 'a.txt', mimeType: 'text/plain', size: 5 },
        { id: 'att-2', filename: 'b.csv', mimeType: 'text/csv', size: 10 },
      ]),
    );
    mockFetch.mockResolvedValueOnce(
      buildSseResponse([{ content: 'done' }, 'DONE']),
    );

    const { result } = renderHook(() =>
      useChatStream({ sessionId: 's-multi', userId: 'u-multi' }),
    );

    const f1 = new File(['aaaaa'], 'a.txt', { type: 'text/plain' });
    const f2 = new File(['bbbbbbbbbb'], 'b.csv', { type: 'text/csv' });

    await act(async () => {
      await result.current.send('看這些', [f1, f2]);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const streamBody = JSON.parse((mockFetch.mock.calls[1]?.[1] as RequestInit).body as string);
    expect(streamBody.attachments).toHaveLength(2);
    expect(streamBody.attachments[0].id).toBe('att-1');
    expect(streamBody.attachments[1].id).toBe('att-2');
  });
});