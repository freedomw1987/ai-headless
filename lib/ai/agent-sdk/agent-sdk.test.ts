/**
 * Sprint 47 Commit 2 (Stage 47-1) — agent-sdk thinking_delta 處理單元測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.2 (FR-2.1, FR-2.2)
 * 對應 Plan Gate: docs/sprint47-plan-gate.md Q2 (Sources 降階)
 *
 * 目的:
 * - 驗證 session.subscribe 收到 thinking_delta 時累積到 reasoningContent
 * - 驗證 onReasoningDelta callback 被呼叫且傳遞正確字串
 * - 驗證完整 reasoning (thinking_start → thinking_delta* → thinking_end) 拼接正確
 *
 * 設計:
 * - Mock createChatSession 回傳 fake session with subscribe API
 * - Mock DB / readAttachmentText 避免相依
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    aIConfig: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Mock decrypt (避免相依 crypto module)
vi.mock('@/lib/ai/providers/providers', () => ({
  decrypt: vi.fn().mockReturnValue('mock-api-key'),
}));

// Mock attachment reader
vi.mock('@/lib/ai/chat/attachment-reader', () => ({
  readAttachmentText: vi.fn().mockResolvedValue('mock text content'),
}));

// Mock pi-coding-agent (createAgentSession, ModelRuntime, SessionManager)
vi.mock('@earendil-works/pi-coding-agent', () => ({
  createAgentSession: vi.fn(),
  ModelRuntime: {
    create: vi.fn().mockResolvedValue({
      getAvailable: vi.fn().mockResolvedValue([
        { id: 'mock-model', provider: 'openai' },
      ]),
      setRuntimeApiKey: vi.fn().mockResolvedValue(undefined),
      getModel: vi.fn().mockReturnValue({ id: 'mock-model' }),
    }),
  },
  SessionManager: {
    inMemory: vi.fn().mockReturnValue({}),
  },
}));

import { streamChatMessages } from './agent-sdk';
import { createAgentSession } from "@earendil-works/pi-coding-agent";

interface FakeSubscriberCallback {
  (event: { type: string; assistantMessageEvent?: unknown }): void;
}

interface FakeSession {
  subscribe: ReturnType<typeof vi.fn>;
  prompt: ReturnType<typeof vi.fn>;
  waitForIdle: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  setModel: ReturnType<typeof vi.fn>;
}

/**
 * 工具：建立可手動觸發事件的 fake session
 */
function makeFakeSession(): {
  session: FakeSession;
  emitEvent: (eventType: string, subType: string, delta?: string) => void;
  emitAssistantMessageEvent: (sub: unknown) => void;
} {
  const subscribers: FakeSubscriberCallback[] = [];
  const session: FakeSession = {
    subscribe: vi.fn((cb: FakeSubscriberCallback) => {
      subscribers.push(cb);
      return () => {
        const idx = subscribers.indexOf(cb);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    }),
    prompt: vi.fn().mockResolvedValue(undefined),
    waitForIdle: vi.fn().mockImplementation(async () => {
      // 模擬 LLM idle：什麼都不做，測試手動 emit
    }),
    dispose: vi.fn(),
    setModel: vi.fn().mockResolvedValue(undefined),
  };

  return {
    session,
    emitEvent: (eventType: string, subType: string, delta?: string) => {
      const sub = delta !== undefined ? { type: subType, delta } : { type: subType };
      for (const cb of subscribers) {
        cb({ type: eventType, assistantMessageEvent: sub });
      }
    },
    emitAssistantMessageEvent: (sub: unknown) => {
      for (const cb of subscribers) {
        cb({ type: 'message_update', assistantMessageEvent: sub });
      }
    },
  };
}

describe('agent-sdk — Sprint 47-1 thinking_delta 處理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('session.subscribe 收到 thinking_delta 時累積 reasoning 字串', async () => {
    const fake = makeFakeSession();
    // 讓 waitForIdle 等待使用者手動 resolve（才不會先 unsub）
    let resolveIdle: () => void = () => {};
    fake.session.waitForIdle = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveIdle = r; }),
    );
    vi.mocked(createAgentSession).mockResolvedValue({ session: fake.session } as never);

    const onDelta = vi.fn();
    const onReasoningDelta = vi.fn();
    const onComplete = vi.fn();

    const promise = streamChatMessages({
      messages: [{ role: 'user', content: 'Hello' }],
      onDelta,
      onComplete,
      onReasoningDelta,
    });

    // 等 subscribe 註冊完成（waitForIdle 被呼叫代表 setup 完成）
    await new Promise((r) => setTimeout(r, 10));

    // Emit 一連串 thinking_delta
    fake.emitAssistantMessageEvent({ type: 'thinking_start', contentIndex: 0 });
    fake.emitAssistantMessageEvent({
      type: 'thinking_delta',
      contentIndex: 0,
      delta: '讓我先',
    });
    fake.emitAssistantMessageEvent({
      type: 'thinking_delta',
      contentIndex: 0,
      delta: '分析這個問題',
    });
    fake.emitAssistantMessageEvent({
      type: 'thinking_delta',
      contentIndex: 0,
      delta: '...完整思考...',
    });
    fake.emitAssistantMessageEvent({ type: 'thinking_end', contentIndex: 0, content: '...完整思考...' });

    // 觸發 waitForIdle 完成
    resolveIdle();
    await promise;

    expect(onReasoningDelta).toHaveBeenCalledTimes(3);
    expect(onReasoningDelta).toHaveBeenNthCalledWith(1, '讓我先');
    expect(onReasoningDelta).toHaveBeenNthCalledWith(2, '分析這個問題');
    expect(onReasoningDelta).toHaveBeenNthCalledWith(3, '...完整思考...');
  });

  it('混合 text_delta + thinking_delta 時，兩個 callback 各自獨立累積', async () => {
    const fake = makeFakeSession();
    let resolveIdle: () => void = () => {};
    fake.session.waitForIdle = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveIdle = r; }),
    );
    vi.mocked(createAgentSession).mockResolvedValue({ session: fake.session } as never);

    const onDelta = vi.fn();
    const onReasoningDelta = vi.fn();

    const promise = streamChatMessages({
      messages: [{ role: 'user', content: 'Test' }],
      onDelta,
      onComplete: vi.fn(),
      onReasoningDelta,
    });

    await new Promise((r) => setTimeout(r, 10));

    fake.emitAssistantMessageEvent({ type: 'thinking_start', contentIndex: 0 });
    fake.emitAssistantMessageEvent({
      type: 'thinking_delta',
      contentIndex: 0,
      delta: '思考中...',
    });
    fake.emitAssistantMessageEvent({
      type: 'text_delta',
      delta: '我回應',
    });
    fake.emitAssistantMessageEvent({
      type: 'thinking_delta',
      contentIndex: 0,
      delta: '繼續想',
    });
    fake.emitAssistantMessageEvent({
      type: 'text_delta',
      delta: '你好',
    });
    fake.emitAssistantMessageEvent({ type: 'thinking_end', contentIndex: 0 });

    resolveIdle();
    await promise;

    expect(onReasoningDelta).toHaveBeenCalledTimes(2);
    expect(onReasoningDelta).toHaveBeenNthCalledWith(1, '思考中...');
    expect(onReasoningDelta).toHaveBeenNthCalledWith(2, '繼續想');

    expect(onDelta).toHaveBeenCalledTimes(2);
    expect(onDelta).toHaveBeenNthCalledWith(1, '我回應');
    expect(onDelta).toHaveBeenNthCalledWith(2, '你好');
  });

  it('沒傳 onReasoningDelta 時不 crash（向後相容 Sprint 46）', async () => {
    const fake = makeFakeSession();
    let resolveIdle: () => void = () => {};
    fake.session.waitForIdle = vi.fn().mockImplementation(
      () => new Promise<void>((r) => { resolveIdle = r; }),
    );
    vi.mocked(createAgentSession).mockResolvedValue({ session: fake.session } as never);

    const onDelta = vi.fn();
    const onComplete = vi.fn();

    const promise = streamChatMessages({
      messages: [{ role: 'user', content: 'Test' }],
      onDelta,
      onComplete,
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(() => {
      fake.emitAssistantMessageEvent({
        type: 'thinking_delta',
        contentIndex: 0,
        delta: '這不該 crash',
      });
    }).not.toThrow();

    fake.emitAssistantMessageEvent({ type: 'text_delta', delta: 'hi' });

    resolveIdle();
    await promise;

    expect(onDelta).toHaveBeenCalledWith('hi');
    expect(onComplete).toHaveBeenCalledWith('hi');
  });
});
