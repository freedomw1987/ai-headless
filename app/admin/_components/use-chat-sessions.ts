'use client';

/**
 * useChatSessions — Admin chat sessions CRUD hook (S44-G2)
 *
 * - 載入 user 自己的 sessions
 * - 建立新 session
 * - 切換 active session (載入 messages)
 * - 刪除 session
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';

export type SessionSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
};

export type SessionDetail = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export function useChatSessions(userId: string) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // 載入 sessions 列表
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/chat/sessions');
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: SessionSummary[] };
      setSessions(data.sessions);
    } catch {
      // network / parse error (e.g. test env 沒 server)
      // 不 throw, 讓 UI 顯示空狀態
    } finally {
      setLoading(false);
    }
  }, []);

  // 載入單 session detail (含 messages)
  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/chat/sessions/${id}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { session: SessionDetail };
    setActiveSession(data.session);
    return data.session;
  }, []);

  // 切換 active session
  const selectSession = useCallback(
    async (id: string) => {
      setActiveId(id);
      await loadSession(id);
    },
    [loadSession],
  );

  // 建立新 session
  const createSession = useCallback(async (): Promise<SessionDetail | null> => {
    const res = await fetch('/api/admin/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '新對話' }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { session: SessionDetail };
    await refresh(); // reload list
    setActiveId(data.session.id);
    setActiveSession(data.session);
    return data.session;
  }, [refresh]);

  // 刪除 session
  const removeSession = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/chat/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) return;
      if (activeId === id) {
        setActiveId(null);
        setActiveSession(null);
      }
      await refresh();
    },
    [activeId, refresh],
  );

  // 初次載入
  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  return {
    sessions,
    activeId,
    activeSession,
    loading,
    refresh,
    selectSession,
    createSession,
    removeSession,
  };
}