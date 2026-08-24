'use client';

/**
 * useChatSessions — TD-501 抽出 + TD-508 增強
 *
 * 管理 sessions 陣列 + active session + 純狀態 CRUD（不含串流邏輯）
 *
 * TD-508 改動：
 * - sessions 改用 useReducer 管理（搭配 use-chat-stream.ts 的 sessionsReducer）
 * - 暴露 `dispatch` 給 useChatStream 使用（取代 setSessions）
 * - 新增 REGISTER_SESSION action（讓 createSession 走 reducer）
 */

import { useCallback, useReducer, useState } from 'react';
import {
  createChatSession,
  type ChatSession,
} from '@/lib/ai/chat/chat-utils';
import {
  sessionsReducer,
  type SessionsAction,
} from './use-chat-stream';

// ==============================================
// 擴展 sessionsReducer 加入 REGISTER_SESSION
// （在這個檔定義 action，避免循環依賴 use-chat-stream.ts）
// ==============================================

type LocalSessionAction =
  | SessionsAction
  | {
      type: 'REGISTER_SESSION';
      session: ChatSession;
    };

function localReducer(
  state: ChatSession[],
  action: LocalSessionAction,
): ChatSession[] {
  switch (action.type) {
    case 'REGISTER_SESSION': {
      // 去重（同 id 不重複加入）
      if (state.some((s) => s.id === action.session.id)) return state;
      return [...state, action.session];
    }
    default:
      return sessionsReducer(state, action);
  }
}

export type UseChatSessions = {
  sessions: ChatSession[];
  activeId: string | null;
  activeSession: ChatSession | null;
  setActiveId: (id: string | null) => void;
  createSession: () => ChatSession;
  updateSession: (session: ChatSession) => void;
  /** TD-508：給 useChatStream 用的 reducer dispatch */
  dispatch: React.Dispatch<LocalSessionAction>;
};

export function useChatSessions(): UseChatSessions {
  const [sessions, dispatch] = useReducer(localReducer, []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const createSession = useCallback((): ChatSession => {
    const session = createChatSession({});
    dispatch({ type: 'REGISTER_SESSION', session });
    setActiveId(session.id);
    return session;
  }, []);

  const updateSession = useCallback((session: ChatSession) => {
    // 此 action 在 chat-page-client.tsx 也未被使用 — 保留 stub 以維持 API 兼容
    void session;
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  return {
    sessions,
    activeId,
    activeSession,
    setActiveId,
    createSession,
    updateSession,
    dispatch,
  };
}