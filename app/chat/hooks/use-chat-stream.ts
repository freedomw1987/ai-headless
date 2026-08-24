'use client';

/**
 * useChatStream — TD-501 抽出
 *
 * 封裝串流邏輯：
 * - 送出 user 訊息 + 建立 placeholder assistant
 * - 呼叫 streamChatWithRetry（帶 abort signal）
 * - 累積內容 + 處理 JsonSpec 標記
 * - 錯誤處理
 *
 * 不持有 sessions state — 由呼叫端透過 getSession/setSession 提供。
 * 這樣 hook 可獨立測試,且避免雙向狀態同步問題。
 */

import { useCallback, useState } from 'react';
import {
  extractJsonSpec,
  addMessage,
  type ChatSession,
} from '@/lib/ai/chat/chat-utils';
import type { JsonSpec } from '@/lib/specs/json-spec.types';
import { streamChatWithRetry } from '@/lib/ai/stream-client';
import { abortStream, createStreamController } from '@/lib/ai/stream-controller';

export type UseChatStream = {
  streaming: boolean;
  /** 送出文字。session 為 null 時由 caller 負責先 createSession。 */
  send: (input: { session: ChatSession; text: string }) => Promise<void>;
};

/**
 * @param getSession 取得當前 session 的函式(避免 hook 持雙向 state)
 * @param setSession 更新整個 session 的函式(等同於 useChatSessions.updateSession)
 */
export function useChatStream(
  getSession: (id: string) => ChatSession | undefined,
  setSession: (session: ChatSession) => void,
): UseChatStream {
  const [streaming, setStreaming] = useState(false);

  const send = useCallback(
    async ({ session, text }: { session: ChatSession; text: string }) => {
      // 1. 若上一輪串流未結束，先 abort
      if (streaming) {
        abortStream(`chat-${session.id}`);
      }

      // 2. 加 user 訊息
      let updated = addMessage(session, { role: 'user', content: text });
      setSession(updated);

      // 3. 加 placeholder assistant
      setStreaming(true);
      updated = addMessage(updated, { role: 'assistant', content: '' });
      setSession(updated);

      // 4. 建 stream controller（TD-503）
      const controller = createStreamController(`chat-${session.id}`);

      let fullContent = '';
      let lastError: string | null = null;

      try {
        for await (const content of streamChatWithRetry(
          updated.messages
            .filter((m) => m.role !== 'assistant' || m.content)
            .slice(0, -1)
            .map((m) => ({ role: m.role, content: m.content })),
          {
            maxRetries: 2,
            onRetry: (attempt) => {
              console.log(`Chat retry attempt ${attempt}`);
            },
            signal: controller.signal,
          },
        )) {
          fullContent += content;
          applyContent(updated.id, fullContent);
        }

        // 5. JsonSpec 標記
        const spec: JsonSpec | null = extractJsonSpec(fullContent);
        if (spec) {
          applyJsonSpec(updated.id, spec);
        }
      } catch (err) {
        lastError = String(err);
        console.error('Chat stream error:', err);
        applyError(updated.id, lastError);
      } finally {
        setStreaming(false);
      }

      // ====== helpers ======

      function applyContent(sessionId: string, content: string) {
        const s = getSession(sessionId);
        if (!s) return;
        const messages = [...s.messages];
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx]!.role === 'assistant') {
          messages[lastIdx] = { ...messages[lastIdx]!, content };
        }
        setSession({ ...s, messages });
      }

      function applyJsonSpec(sessionId: string, spec: JsonSpec) {
        const s = getSession(sessionId);
        if (!s) return;
        const messages = [...s.messages];
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx]!.role === 'assistant') {
          messages[lastIdx] = {
            ...messages[lastIdx]!,
            metadata: { jsonSpec: spec },
          };
        }
        setSession({ ...s, messages });
      }

      function applyError(sessionId: string, error: string) {
        const s = getSession(sessionId);
        if (!s) return;
        const messages = [...s.messages];
        const lastIdx = messages.length - 1;
        if (lastIdx >= 0 && messages[lastIdx]!.role === 'assistant') {
          messages[lastIdx] = {
            ...messages[lastIdx]!,
            content: messages[lastIdx]!.content || `錯誤：${error}`,
          };
        }
        setSession({ ...s, messages });
      }
    },
    // streaming intentionally not in deps to avoid stale closures mid-stream
    [streaming, getSession, setSession],
  );

  return { streaming, send };
}