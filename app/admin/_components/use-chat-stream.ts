/**
 * useChatStream — Admin AI Chat SSE streaming hook (S45-B + Sprint 47-3 真實上傳)
 *
 * 用途:
 * - 串接 /api/admin/chat/stream (保留 Sprint 43 createProviderFromDB)
 * - 不依賴 AI SDK UIMessageStream (避免破壞 Custom URL)
 * - 解析現有 SSE 格式: data: {content}\n\n, data: [DONE]\n\n
 * - Sprint 47 Commit 2 (Stage 47-1): 同時解析 reasoning event
 * - Sprint 47 Commit 4 (Stage 47-3): 支援 File[] 真實 multipart upload (FR-4.1)
 *
 * 用法:
 *   const { messages, input, setInput, send, status, error } = useChatStream({
 *     sessionId,
 *     userId,
 *     onSessionUpdate,
 *   });
 *   await send('請讀檔', [file1, file2]);
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
    async (overrideInput?: string, attachments: ReadonlyArray<File | { filename: string; size?: number }> = []) => {
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

      // Sprint 47 Commit 4 (Stage 47-3): 判斷是否為 File[] (真實上傳)
      const fileAttachments = attachments.filter(
        (a): a is File => typeof File !== 'undefined' && a instanceof File,
      );
      const metaAttachments = attachments.filter(
        (a): a is { filename: string; size?: number } => !(typeof File !== 'undefined' && a instanceof File),
      );

      let uploadedAttachmentIds: Array<{ id: string; filename: string; mimeType: string; size: number }> = [];
      if (fileAttachments.length > 0) {
        try {
          const formData = new FormData();
          formData.append('sessionId', activeSessionId!);
          for (const file of fileAttachments) {
            formData.append('files', file);
          }
          const uploadRes = await fetch('/api/admin/chat/upload', {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) {
            const errData = (await uploadRes.json().catch(() => ({}))) as { error?: string };
            throw new Error(errData.error ?? `Upload failed: ${uploadRes.status}`);
          }
          const data = (await uploadRes.json()) as {
            attachments: Array<{ id: string; filename: string; mimeType: string; size: number }>;
          };
          uploadedAttachmentIds = data.attachments;
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus('error');
          return;
        }
      }

      const now = new Date().toISOString();
      // 把附件檔名拼進 message content (S45-C 純前端, 不上傳)
      // Sprint 47 Commit 4 (Stage 47-3): 附件 UI 顯示上傳後的 IDs (有真實 size)
      // 對向後相容: metaAttachments 仍以原 S45-C 行為拼進 message
      const attachmentPrefix = metaAttachments
        .map((a) => `📎 ${a.filename}${a.size ? ` (${formatSize(a.size)})` : ''}`)
        .join('\n');
      const uploadedPrefix = uploadedAttachmentIds
        .map((a) => `📎 ${a.filename}${a.size ? ` (${formatSize(a.size)})` : ''}`)
        .join('\n');
      const combinedPrefix = [attachmentPrefix, uploadedPrefix].filter(Boolean).join('\n');
      const fullContent = combinedPrefix ? `${combinedPrefix}\n\n${text}` : text;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: fullContent,
        attachments:
          uploadedAttachmentIds.length > 0
              ? uploadedAttachmentIds.map((a) => ({ id: a.id, filename: a.filename, size: a.size }))
              : undefined,
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
            // Sprint 47 Commit 4 (Stage 47-3): 傳上傳後的 attachment IDs
            attachments: uploadedAttachmentIds,
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