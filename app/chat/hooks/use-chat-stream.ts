'use client';

/**
 * useChatStream — TD-501 抽出 + TD-508 重構為 useReducer
 *
 * 封裝串流邏輯：
 * - 送出 user 訊息 + 建立 placeholder assistant
 * - 呼叫 streamChatWithRetry（帶 abort signal）
 * - 累積內容 + 處理 JsonSpec 標記
 * - 錯誤處理
 *
 * TD-508 演進：
 * - TD-501 改用 functional setSessions 解決 stale closure race
 * - TD-508 進一步收斂：useReducer + named actions
 *   - 更明確的 action 語意（self-documenting）
 *   - reducer 是純函式，可獨立測試
 *   - 避免 functional setState 的隱式 closure 依賴
 */

import { useCallback, useState } from 'react';
import {
  extractJsonSpec,
  addMessage,
  type ChatSession,
  type ChatMessage,
} from '@/lib/ai/chat/chat-utils';
import type { JsonSpec } from '@/lib/specs/json-spec.types';
import { streamChatWithRetry } from '@/lib/ai/stream-client';
import { abortStream, createStreamController } from '@/lib/ai/stream-controller';

// ==============================================
// 1. Reducer actions（TD-508 引入）
// ==============================================

export type SessionsAction =
  | {
      type: 'SEED_USER_AND_ASSISTANT';
      sessionId: string;
      userText: string;
    }
  | {
      type: 'APPEND_ASSISTANT_CONTENT';
      sessionId: string;
      /** mutator 收到當前 assistant 訊息，回傳更新後版本 */
      mutator: (last: ChatMessage) => ChatMessage;
    }
  | {
      type: 'APPEND_CHARS';
      sessionId: string;
      chars: string;
    };

/**
 * Sessions reducer — 純函式，所有狀態變更走 named actions
 *
 * 不變量：
 * - 必須回傳新陣列（不可 mutate）
 * - 若沒有變更，回傳原 state reference（避免無謂 re-render）
 */
export function sessionsReducer(
  state: ChatSession[],
  action: SessionsAction,
): ChatSession[] {
  switch (action.type) {
    case 'SEED_USER_AND_ASSISTANT': {
      let changed = false;
      const next = state.map((s) => {
        if (s.id !== action.sessionId) return s;
        changed = true;
        const withUser = addMessage(s, { role: 'user', content: action.userText });
        return addMessage(withUser, { role: 'assistant', content: '' });
      });
      // TD-513: 對不存在的 sessionId 是 no-op，回傳原 state reference
      return changed ? next : state;
    }

    case 'APPEND_ASSISTANT_CONTENT': {
      let changed = false;
      const next = state.map((s) => {
        if (s.id !== action.sessionId) return s;
        const last = s.messages.at(-1);
        if (!last || last.role !== 'assistant') return s;
        const updated = action.mutator(last);
        if (updated === last) return s; // no-op
        changed = true;
        const messages = [...s.messages];
        messages[messages.length - 1] = updated;
        return { ...s, messages };
      });
      // TD-508：如果沒有任何 session 真的改動，回傳原 state reference（避免無謂 re-render）
      return changed ? next : state;
    }

    case 'APPEND_CHARS': {
      let changed = false;
      const next = state.map((s) => {
        if (s.id !== action.sessionId) return s;
        const last = s.messages.at(-1);
        if (!last || last.role !== 'assistant') return s;
        const updated: ChatMessage = {
          ...last,
          content: last.content + action.chars,
        };
        if (updated === last) return s;
        changed = true;
        const messages = [...s.messages];
        messages[messages.length - 1] = updated;
        return { ...s, messages };
      });
      return changed ? next : state;
    }

    default: {
      // Exhaustiveness check
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}

// ==============================================
// 2. Hook
// ==============================================

export type UseChatStream = {
  streaming: boolean;
  /** 送出文字。session 為 null 時由 caller 負責先 createSession。 */
  send: (input: { session: ChatSession; text: string }) => Promise<void>;
};

/**
 * @param sessions 所有 sessions（caller 管理）
 * @param dispatch sessions reducer 的 dispatch 函式
 */
export function useChatStream(
  sessions: ChatSession[],
  dispatch: React.Dispatch<SessionsAction>,
): UseChatStream {
  const [streaming, setStreaming] = useState(false);

  const send = useCallback(
    async ({ session, text }: { session: ChatSession; text: string }) => {
      // 1. 若上一輪串流未結束，先 abort
      if (streaming) {
        abortStream(`chat-${session.id}`);
      }

      // 2. 加 user 訊息 + 加 placeholder assistant（一次 dispatch 觸發 batch）
      dispatch({
        type: 'SEED_USER_AND_ASSISTANT',
        sessionId: session.id,
        userText: text,
      });

      setStreaming(true);

      // 3. 建 stream controller（TD-503）
      const controller = createStreamController(`chat-${session.id}`);

      let fullContent = '';
      let lastError: string | null = null;

      try {
        // TD-508 重要：不要讀 `sessions` state（closure 可能 stale），
        // 改用 send() 入口傳入的 `session` 參數加 addMessage 拿 fresh seeded。
        // 這是 useReducer 重構後唯一不會 stale 的來源。
        const seededWithUser = addMessage(session, { role: 'user', content: text });
        const seeded = addMessage(seededWithUser, {
          role: 'assistant',
          content: '',
        });

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
          // TD-508：改用 named action，避免 functional setState 的隱式依賴
          dispatch({
            type: 'APPEND_ASSISTANT_CONTENT',
            sessionId: session.id,
            mutator: (last) => ({ ...last, content: fullContent }),
          });
        }

        // 4. JsonSpec 標記
        const spec: JsonSpec | null = extractJsonSpec(fullContent);
        if (spec) {
          dispatch({
            type: 'APPEND_ASSISTANT_CONTENT',
            sessionId: session.id,
            mutator: (last) => ({
              ...last,
              metadata: { jsonSpec: spec },
            }),
          });
        }
      } catch (err) {
        // TD-503: AbortError 是使用者主動取消，不視為錯誤訊息（略過）
        const errMsg = err instanceof Error ? err.message : String(err);
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        lastError = isAbort ? null : errMsg;
        if (!isAbort) {
          console.error('Chat stream error:', err);
        }
        dispatch({
          type: 'APPEND_ASSISTANT_CONTENT',
          sessionId: session.id,
          mutator: (last) => ({
            ...last,
            content: last.content || (lastError ? `錯誤：${lastError}` : ''),
          }),
        });
      } finally {
        setStreaming(false);
      }
    },
    // TD-508：streaming 仍在 deps（abort 上一輪需要）。sessions 不在 deps
    // — send() 不讀 sessions state，seeded messages 由 session 參數 + addMessage 建出。
    [streaming, dispatch],
  );

  return { streaming, send };
}

// 保留舊 export 介面相容性（useChatStream 簽名改了 — caller 也要改）
export const _legacy = { sessionsReducer };