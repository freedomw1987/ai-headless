/**
 * TDD Gate 1 — TD-513 useChatSessions hook 整合測試
 *
 * 守護 TD-508 重構（useChatStream → useReducer）後，session 管理層的行為：
 * 1. 初始狀態
 * 2. createSession（含 REGISTER_SESSION action + 自動設 active）
 * 3. setActiveId + activeSession 衍生計算
 * 4. dispatch 暴露（給 useChatStream 用）
 * 5. updateSession（stub API 兼容）
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import type { ChatSession } from '@/lib/ai/chat/chat-utils';
import { useChatSessions } from './use-chat-sessions';

// ==============================================
// 1. 初始狀態
// ==============================================

describe('TD-513 useChatSessions > initial state', () => {
  it('sessions 是空陣列', () => {
    const { result } = renderHook(() => useChatSessions());
    expect(result.current.sessions).toEqual([]);
  });

  it('activeId 是 null', () => {
    const { result } = renderHook(() => useChatSessions());
    expect(result.current.activeId).toBeNull();
  });

  it('activeSession 是 null（沒有 active id）', () => {
    const { result } = renderHook(() => useChatSessions());
    expect(result.current.activeSession).toBeNull();
  });

  it('dispatch 是 React.Dispatch 函式', () => {
    const { result } = renderHook(() => useChatSessions());
    expect(typeof result.current.dispatch).toBe('function');
  });
});

// ==============================================
// 2. createSession
// ==============================================

describe('TD-513 useChatSessions > createSession', () => {
  it('回傳新 session（含 id、title、messages: []）', () => {
    const { result } = renderHook(() => useChatSessions());

    let created!: ChatSession;
    act(() => {
      created = result.current.createSession();
    });

    expect(created).toBeDefined();
    expect(typeof created.id).toBe('string');
    expect(created.id.length).toBeGreaterThan(0);
    expect(created.title).toBe('新對話');
    expect(created.messages).toEqual([]);
    expect(typeof created.createdAt).toBe('string');
    expect(typeof created.updatedAt).toBe('string');
  });

  it('新 session 被加入 sessions 陣列', () => {
    const { result } = renderHook(() => useChatSessions());

    let created!: ChatSession;
    act(() => {
      created = result.current.createSession();
    });

    expect(result.current.sessions.length).toBe(1);
    expect(result.current.sessions[0]!.id).toBe(created.id);
  });

  it('新 session 自動成為 active', () => {
    const { result } = renderHook(() => useChatSessions());

    let created!: ChatSession;
    act(() => {
      created = result.current.createSession();
    });

    expect(result.current.activeId).toBe(created.id);
    expect(result.current.activeSession?.id).toBe(created.id);
  });

  it('建立多次 session 都會加入陣列 + 最新一次成 active', () => {
    const { result } = renderHook(() => useChatSessions());

    let first!: ChatSession;
    let second!: ChatSession;
    act(() => {
      first = result.current.createSession();
      second = result.current.createSession();
    });

    expect(result.current.sessions.length).toBe(2);
    expect(result.current.activeId).toBe(second.id);
    expect(result.current.sessions.map((s) => s.id)).toContain(first.id);
    expect(result.current.sessions.map((s) => s.id)).toContain(second.id);
  });

  it('同 id 重複 REGISTER 不會重複加入（去重機制）', () => {
    const { result } = renderHook(() => useChatSessions());

    let created!: ChatSession;
    act(() => {
      created = result.current.createSession();
    });

    // 手動 dispatch 同樣的 session（模擬外部重複註冊）
    act(() => {
      result.current.dispatch({ type: 'REGISTER_SESSION', session: created });
    });

    // 應該只有 1 個（同 id 去重）
    expect(result.current.sessions.length).toBe(1);
  });
});

// ==============================================
// 3. setActiveId + activeSession 衍生
// ==============================================

describe('TD-513 useChatSessions > setActiveId', () => {
  it('切換 activeId 後 activeSession 跟著更新', () => {
    const { result } = renderHook(() => useChatSessions());

    let s1!: ChatSession;
    let s2!: ChatSession;
    act(() => {
      s1 = result.current.createSession();
      s2 = result.current.createSession();
    });

    // 切回 s1
    act(() => {
      result.current.setActiveId(s1.id);
    });

    expect(result.current.activeId).toBe(s1.id);
    expect(result.current.activeSession?.id).toBe(s1.id);
    expect(result.current.activeSession?.id).not.toBe(s2.id);
  });

  it('設成 null 時 activeSession 也是 null', () => {
    const { result } = renderHook(() => useChatSessions());

    act(() => {
      result.current.createSession();
    });

    expect(result.current.activeSession).not.toBeNull();

    act(() => {
      result.current.setActiveId(null);
    });

    expect(result.current.activeId).toBeNull();
    expect(result.current.activeSession).toBeNull();
  });

  it('設成不存在的 id 時 activeSession 是 null（不崩潰）', () => {
    const { result } = renderHook(() => useChatSessions());

    act(() => {
      result.current.setActiveId('non-existent-id');
    });

    expect(result.current.activeId).toBe('non-existent-id');
    expect(result.current.activeSession).toBeNull();
  });
});

// ==============================================
// 4. dispatch 暴露（給 useChatStream 用）
// ==============================================

describe('TD-513 useChatSessions > dispatch exposure', () => {
  it('dispatch 能處理 sessionsReducer action（SEED_USER_AND_ASSISTANT）', () => {
    const { result } = renderHook(() => useChatSessions());

    let s1!: ChatSession;
    act(() => {
      s1 = result.current.createSession();
    });

    act(() => {
      result.current.dispatch({
        type: 'SEED_USER_AND_ASSISTANT',
        sessionId: s1.id,
        userText: '幫我做個待辦',
      });
    });

    const updated = result.current.sessions[0]!;
    expect(updated.messages.length).toBe(2); // user + empty assistant
    expect(updated.messages[0]!.content).toBe('幫我做個待辦');
    expect(updated.messages[0]!.role).toBe('user');
    expect(updated.messages[1]!.role).toBe('assistant');
    expect(updated.messages[1]!.content).toBe('');
  });

  it('dispatch 能處理 APPEND_ASSISTANT_CONTENT', () => {
    const { result } = renderHook(() => useChatSessions());

    let s1!: ChatSession;
    act(() => {
      s1 = result.current.createSession();
    });

    act(() => {
      result.current.dispatch({
        type: 'SEED_USER_AND_ASSISTANT',
        sessionId: s1.id,
        userText: 'hi',
      });
    });

    act(() => {
      result.current.dispatch({
        type: 'APPEND_ASSISTANT_CONTENT',
        sessionId: s1.id,
        mutator: (last) => ({ ...last, content: 'hello' }),
      });
    });

    const updated = result.current.sessions[0]!;
    expect(updated.messages[1]!.content).toBe('hello');
  });

  it('dispatch 對不存在的 sessionId 是 no-op', () => {
    const { result } = renderHook(() => useChatSessions());

    act(() => {
      result.current.createSession();
    });

    const before = result.current.sessions;

    act(() => {
      result.current.dispatch({
        type: 'SEED_USER_AND_ASSISTANT',
        sessionId: 'non-existent',
        userText: 'hi',
      });
    });

    // 沒變動
    expect(result.current.sessions).toBe(before);
  });
});

// ==============================================
// 5. updateSession (stub API 兼容)
// ==============================================

describe('TD-513 useChatSessions > updateSession', () => {
  it('呼叫不崩潰（stub 行為）', () => {
    const { result } = renderHook(() => useChatSessions());

    expect(() => {
      act(() => {
        result.current.updateSession({
          id: 'any',
          title: 'x',
          messages: [],
          createdAt: '',
          updatedAt: '',
        });
      });
    }).not.toThrow();
  });
});