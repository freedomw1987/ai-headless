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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';
import type { ChatStatus } from 'ai';
import {
  abortStream,
  createStreamController,
} from '@/lib/ai/stream-controller';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useChatStream({ sessionId, userId, onSessionUpdate }: { sessionId: string | null; userId: string; onSessionUpdate?: () => Promise<void> }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages([]);
  }, [sessionId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('ready');
  }, []);

  const send = useCallback(
    async (overrideInput?: string, attachments: ReadonlyArray<{ filename: string; size?: number }> = []) => {
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
      // 把附件檔名拼進 message content (S45-C 純前端, 不上傳)
      const attachmentPrefix = attachments
        .map((a) => `📎 ${a.filename}${a.size ? ` (${formatSize(a.size)})` : ''}`)
        .join('\n');
      const fullContent = attachmentPrefix ? `${attachmentPrefix}\n\n${text}` : text;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: fullContent,
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
      try {
        const response = await fetch('/api/admin/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: fullContent }],
            sessionId: activeSessionId,
          }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`Stream API error: ${response.status}`);
        }
        setStatus('streaming');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let accumulatedReasoning = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload) as {
                content?: string;
                reasoning?: string;
                error?: string;
              };
              if (parsed.content) {
                accumulated += parsed.content;
              }
              if (parsed.reasoning) {
                accumulatedReasoning += parsed.reasoning;
              }
              // Sprint 47 Commit 2 (Stage 47-1): 同時更新 content + reasoning
              if (parsed.content || parsed.reasoning) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: accumulated,
                          reasoning: accumulatedReasoning || undefined,
                        }
                      : m,
                  ),
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
        setStatus('ready');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('ready');
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      } finally {
        abortRef.current = null;
      }
    },
    [input, sessionId, status, userId, onSessionUpdate],
  );

  const reload = useCallback(async () => {
    // 留空, 不改 Sprint 45 行為
  }, []);

  const loadMessages = useCallback((loaded: ChatMessage[]) => {
    setMessages(loaded);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setInput('');
    setError(null);
    setStatus('ready');
  }, []);

  return {
    messages,
    input,
    setInput,
    setMessages,
    send,
    reload,
    loadMessages,
    reset,
    stop,
    status,
    error,
    abort: () => abortStream(`admin-chat-${userId}`),
  };
}