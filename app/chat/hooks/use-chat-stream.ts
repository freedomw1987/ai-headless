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
 * TD-501 reviewer P1-2 修：之前用 getSession/setSession pattern,因為 React
 * async batch race,for await 內的 applyContent 讀到 stale state。
 * 改用 functional setSessions — React 保證 reducer 拿到最新 state。
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
 * @param sessions 所有 sessions（由 caller 管理）
 * @param setSessions setSessions 函式（functional update,確保拿最新 state）
 */
export function useChatStream(
  sessions: ChatSession[],
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>,
): UseChatStream {
  const [streaming, setStreaming] = useState(false);

  const send = useCallback(
    async ({ session, text }: { session: ChatSession; text: string }) => {
      // 1. 若上一輪串流未結束，先 abort
      if (streaming) {
        abortStream(`chat-${session.id}`);
      }

      // 2. 加 user 訊息 + 加 placeholder assistant（一次 setSessions 觸發 batch）
      const initialUpdated = addMessage(session, { role: 'user', content: text });
      const seeded = addMessage(initialUpdated, {
        role: 'assistant',
        content: '',
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? seeded : s)),
      );

      setStreaming(true);

      // 3. 建 stream controller（TD-503）
      const controller = createStreamController(`chat-${session.id}`);

      let fullContent = '';
      let lastError: string | null = null;

      try {
        // seeded.messages = [...history, userMsg, emptyAssistant]
        // filter() 移除空的 assistant（placeholder）,保留 userMsg
        // **不要** slice(0, -1) — 那會丟掉當前 userMsg!（TD-501 reviewer P1-1）
        for await (const content of streamChatWithRetry(
          seeded.messages
            .filter((m) => m.role !== 'assistant' || m.content)
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
          mutateLastAssistant(session.id, (last) => ({
            ...last,
            content: fullContent,
          }));
        }

        // 4. JsonSpec 標記
        const spec: JsonSpec | null = extractJsonSpec(fullContent);
        if (spec) {
          mutateLastAssistant(session.id, (last) => ({
            ...last,
            metadata: { jsonSpec: spec },
          }));
        }
      } catch (err) {
        // TD-503: AbortError 是使用者主動取消，不視為錯誤訊息（略過）
        const errMsg = err instanceof Error ? err.message : String(err);
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        lastError = isAbort ? null : errMsg;
        if (!isAbort) {
          console.error('Chat stream error:', err);
        }
        mutateLastAssistant(session.id, (last) => ({
          ...last,
          content: last.content || (lastError ? `錯誤：${lastError}` : ''),
        }));
      } finally {
        setStreaming(false);
      }

      // ====== helpers ======

      /**
       * 對指定 session 的最後一條 assistant 訊息套用 mutator。
       * 用 functional setSessions 拿最新 state，避免 stale closure race。
       */
      function mutateLastAssistant(
        sessionId: string,
        mutator: (last: ChatSession['messages'][number]) => ChatSession['messages'][number],
      ) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            const last = s.messages.at(-1);
            if (!last || last.role !== 'assistant') return s;
            const updatedLast = mutator(last);
            // mutator 可能回傳同物件（no-op）,避免無謂 re-render
            if (updatedLast === last) return s;
            const messages = [...s.messages];
            messages[messages.length - 1] = updatedLast;
            return { ...s, messages };
          }),
        );
      }
    },
    // streaming 故意在 deps 中 — 是用來在重送時 abort 上一輪串流，
    // 不在 deps 才會 stale。
    [streaming],
  );

  // 用 sessions 觸發 callback 重建,以免 stale closure
  // (但實際 functional setSessions 不需要)
  void sessions;

  return { streaming, send };
}