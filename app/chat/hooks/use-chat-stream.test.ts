/**
 * TDD Gate 1 — TD-508 sessionsReducer 純函式測試
 *
 * sessionsReducer 是純函式（無 React 依賴），可獨立測試。
 * 守護 reducer 行為不退步 + 文件化 action 語意。
 */

import { describe, it, expect } from 'vitest';
import {
  sessionsReducer,
  type SessionsAction,
} from './use-chat-stream';
import type { ChatSession } from '@/lib/ai/chat/chat-utils';

// ==============================================
// Helpers
// ==============================================

function makeSession(id: string, messages: ChatSession['messages'] = []): ChatSession {
  return {
    id,
    title: 'test',
    messages,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

function makeMessage(role: 'user' | 'assistant', content: string): ChatSession['messages'][number] {
  return {
    id: `msg-${Math.random()}`,
    role,
    content,
    createdAt: '2025-01-01T00:00:00Z',
  };
}

// ==============================================
// 1. SEED_USER_AND_ASSISTANT
// ==============================================

describe('TD-508 sessionsReducer > SEED_USER_AND_ASSISTANT', () => {
  it('加入 user 訊息 + 空 assistant placeholder', () => {
    const session = makeSession('s1', [makeMessage('user', 'hi')]);
    const state = [session];

    const action: SessionsAction = {
      type: 'SEED_USER_AND_ASSISTANT',
      sessionId: 's1',
      userText: 'help',
    };
    const next = sessionsReducer(state, action);

    expect(next).not.toBe(state);
    const updated = next[0]!;
    expect(updated.messages.length).toBe(3);
    expect(updated.messages[1]!.content).toBe('help');
    expect(updated.messages[2]!.role).toBe('assistant');
    expect(updated.messages[2]!.content).toBe('');
  });

  it('不影響其他 sessions', () => {
    const s1 = makeSession('s1');
    const s2 = makeSession('s2');
    const state = [s1, s2];

    const next = sessionsReducer(state, {
      type: 'SEED_USER_AND_ASSISTANT',
      sessionId: 's1',
      userText: 'help',
    });

    expect(next[1]).toBe(s2); // unchanged
  });

  // TD-513: 對不存在的 sessionId 應是 no-op（回傳原 reference）
  it('對不存在的 sessionId 回傳原 state reference（no-op 優化）', () => {
    const s1 = makeSession('s1');
    const state = [s1];

    const next = sessionsReducer(state, {
      type: 'SEED_USER_AND_ASSISTANT',
      sessionId: 'non-existent',
      userText: 'help',
    });

    expect(next).toBe(state); // reference equality — 避免無謂 re-render
  });
});

// ==============================================
// 2. APPEND_ASSISTANT_CONTENT
// ==============================================

describe('TD-508 sessionsReducer > APPEND_ASSISTANT_CONTENT', () => {
  it('mutator 套用最後一條 assistant', () => {
    const session = makeSession('s1', [
      makeMessage('user', 'hi'),
      makeMessage('assistant', 'hel'),
    ]);
    const state = [session];

    const next = sessionsReducer(state, {
      type: 'APPEND_ASSISTANT_CONTENT',
      sessionId: 's1',
      mutator: (last) => ({ ...last, content: last.content + 'lo' }),
    });

    const updated = next[0]!;
    expect(updated.messages[1]!.content).toBe('hello');
  });

  it('若 mutator 回傳原物件（no-op），回傳原 state reference', () => {
    const assistantMsg = makeMessage('assistant', 'hi');
    const session = makeSession('s1', [assistantMsg]);
    const state = [session];

    const next = sessionsReducer(state, {
      type: 'APPEND_ASSISTANT_CONTENT',
      sessionId: 's1',
      mutator: (last) => last, // no-op
    });

    expect(next).toBe(state); // reference equality
  });

  it('若最後不是 assistant，跳過不動', () => {
    const userMsg = makeMessage('user', 'hi');
    const session = makeSession('s1', [userMsg]);
    const state = [session];

    const next = sessionsReducer(state, {
      type: 'APPEND_ASSISTANT_CONTENT',
      sessionId: 's1',
      mutator: (last) => ({ ...last, content: 'modified' }),
    });

    expect(next).toBe(state); // 沒變
  });
});

// ==============================================
// 3. unknown action — exhaustive check
// ==============================================

describe('TD-508 sessionsReducer > exhaustive check', () => {
  it('unknown action 回傳原 state', () => {
    const state: ChatSession[] = [makeSession('s1')];
    const next = sessionsReducer(state, {} as SessionsAction);
    expect(next).toBe(state);
  });
});