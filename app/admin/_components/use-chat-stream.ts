'use client';

/**
 * useChatStream — Admin AI Chat SSE streaming hook (S45-B)
 *
 * 用途:
 * - 串接 /api/admin/chat/stream (保留 Sprint 43 createProviderFromDB)
 * - 不依賴 AI SDK UIMessageStream (避免破壞 Custom URL)
 * - 解析現有 SSE 格式: data: {content}\n\n, data: [DONE]\n\n
 *
 * 用法:
 *   const { messages, input, setInput, send, status, error } = useChatStream({
 *     sessionId,
 *     userId,
 *     onSessionUpdate,
 *   });
 */

import { useState, useCallback, useRef } from 'react';
import { createStreamController } from '@/lib/ai/stream-controller';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export type UseChatStreamOptions = {
  sessionId: string | null;
  userId: string;
  onSessionUpdate?: () => Promise<void> | void;
};

export function useChatStream({ sessionId, userId, onSessionUpdate }: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('ready');
  }, []);

  const send = useCallback(
    async (overrideInput?: string) => {
      const text = (overrideInput ?? input).trim();
      if (!text || status === 'submitted' || status === 'streaming') return;

      // 若無 session, 自動建立 (沿用既有 /api/admin/chat/sessions POST)
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        try {
          const res = await fetch('/api/admin/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '新對話' }),
          });
          if (!res.ok) throw new Error('Failed to create session');
          const data = (await res.json()) as { session: { id: string } };
          activeSessionId = data.session.id;
          // 通知 parent 更新 activeId
          await onSessionUpdate?.();
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus('error');
          return;
        }
      }

      const now = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: now,
      };
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: now,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
      setStatus('submitted');
      setError(null);

      const controller = createStreamController(`admin-chat-${userId}`);
      abortRef.current = controller.signal ? new AbortController() : null;
      // 注意: createStreamController 內部已建 AbortController, 我們用它
      // 但 signal 不是 AbortController, 是 AbortSignal
      // 用 abortStream() 來 abort
      try {
        const response = await fetch('/api/admin/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: text }],
            sessionId: activeSessionId,
          }),
          // 用 fetch 原生 signal
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`Stream API error: ${response.status}`);
        }
        setStatus('streaming');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
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
              if (parsed.content) {
                accumulated += parsed.content;
                // 更新 assistant message (樂觀更新)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m,
                  ),
                );
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected token') throw e;
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // user 觸發 stop
        } else {
          const message = err instanceof Error ? err.message : String(err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `[串流錯誤: ${message}]` }
                : m,
            ),
          );
          setError(err instanceof Error ? err : new Error(message));
          setStatus('error');
        }
      } finally {
        // 只有在不是 error 狀態時才回到 ready (避免清掉 catch 設的 error)
        setStatus((prev) => (prev === 'error' ? prev : 'ready'));
        abortRef.current = null;
      }
    },
    [input, sessionId, status, userId, onSessionUpdate],
  );

  // 載入現有 session 的 messages
  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  // 清空 (例如切換到新對話)
  const reset = useCallback(() => {
    setMessages([]);
    setInput('');
    setStatus('ready');
    setError(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    status,
    error,
    send,
    stop,
    loadMessages,
    reset,
  };
}