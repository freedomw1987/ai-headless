'use client';

/**
 * AdminChatPanel — Admin AI Chat 對話內容 (S44-E/F/G2)
 *
 * 功能:
 * - 訊息列表 (複用既有 MessageBubble)
 * - Chat input (複用既有 ChatInput)
 * - Streaming indicator
 * - Markdown 渲染 (透過 MessageBubble.renderMarkdown)
 * - 跟 admin user session 綁定 (S44 Plan Gate: user-scoped sessions)
 * - 持久化 messages 到 ChatSession/ChatMessage (S44-G2)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { createStreamController } from '@/lib/ai/stream-controller';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';
import { useChatSessions, type SessionDetail } from './use-chat-sessions';

type Props = {
  userId: string;
  activeSessionId: string | null;
  activeSession: SessionDetail | null;
  onSwitch: (id: string | null) => void;
};

export function AdminChatPanel({ userId, activeSessionId, activeSession, onSwitch }: Props) {
  const { createSession, refresh: _refresh, loading } = useChatSessions(userId);
  const [streaming, setStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動捲到底
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, streaming]);

  const handleSend = useCallback(
    async (text: string) => {
      // 1. 取得或建立 session
      let sessionId = activeSessionId;
      if (!sessionId) {
        const newSession = await createSession();
        if (!newSession) return;
        sessionId = newSession.id;
      }

      const now = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: now,
      };
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        createdAt: now,
      };
      void userMsg; // server 會 persist, 樂觀更新在 onSwitch 後交由 parent
      void assistantMsg; // 僅在串流中佔位, server 寫入後由 session reload 取代

      // 樂觀更新 UI: 先顯示 user + assistant placeholder
      onSwitch(sessionId); // 觸發 parent re-load

      setStreaming(true);

      const controller = createStreamController(`admin-chat-${userId}`);
      let fullContent = '';
      try {
        const response = await fetch('/api/admin/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: text }],
            sessionId, // 傳 sessionId 讓 server 儲存
          }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`Stream API error: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload) as { content?: string; error?: string };
              if (parsed.content) fullContent += parsed.content;
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected token') throw e;
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // fullContent 僅供 server log 參考, UI 更新由 session reload 負責
        console.error('[AdminChatPanel] 串流失敗:', message, { accumulated: fullContent });
      } finally {
        setStreaming(false);
        // 重 load session (server 會 persist user + assistant 訊息)
        if (sessionId) {
          const res = await fetch(`/api/admin/chat/sessions/${sessionId}`);
          if (res.ok) {
            const _data = (await res.json()) as { session: SessionDetail };
            void _data; // data 供未來 session reload 使用
            onSwitch(sessionId); // 觸發 parent 更新
          }
        }
      }
    },
    [activeSessionId, createSession, userId, onSwitch],
  );

  // 空狀態: 沒有 active session, 顯示提示
  if (!activeSessionId && !loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-6">
          <div>
            <p className="text-lg">💬 開始 AI 對話</p>
            <p className="mt-2 text-sm">輸入訊息，按 Enter 送出</p>
            <p className="mt-1 text-xs">（將自動建立新對話）</p>
          </div>
        </div>
        <ChatInput onSubmit={handleSend} disabled={streaming} placeholder="問 AI..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="admin-chat-panel">
      <div className="flex-1 overflow-y-auto" data-testid="chat-messages">
        {(!activeSession || activeSession.messages.length === 0) && !streaming ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground p-6">
            <div>
              <p className="text-sm">這則對話還沒有訊息</p>
            </div>
          </div>
        ) : (
          <>
            {activeSession?.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {streaming && (
              <div className="px-6 py-2 text-xs text-muted-foreground">
                <span className="animate-pulse">▍</span> AI 正在輸入…
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <ChatInput onSubmit={handleSend} disabled={streaming} placeholder="問 AI..." />
    </div>
  );
}