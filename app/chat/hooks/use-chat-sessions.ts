'use client';

/**
 * useChatSessions — TD-501 抽出
 *
 * 管理 sessions 陣列 + active session + 純狀態 CRUD（不含串流邏輯）
 */

import { useCallback, useState } from 'react';
import {
  createChatSession,
  type ChatSession,
} from '@/lib/ai/chat/chat-utils';

export type UseChatSessions = {
  sessions: ChatSession[];
  activeId: string | null;
  activeSession: ChatSession | null;
  setActiveId: (id: string | null) => void;
  createSession: () => ChatSession;
  updateSession: (session: ChatSession) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
};

export function useChatSessions(): UseChatSessions {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const createSession = useCallback((): ChatSession => {
    const session = createChatSession({});
    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
    return session;
  }, []);

  const updateSession = useCallback((session: ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? session : s)),
    );
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  return {
    sessions,
    activeId,
    activeSession,
    setActiveId,
    createSession,
    updateSession,
    setSessions,
  };
}