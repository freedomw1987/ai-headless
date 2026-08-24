/**
 * ==============================================
 *  Stream Chat Client with Retry — TD-406
 * ==============================================
 *
 * 包裝 fetch + SSE，提供：
 * - Exponential backoff retry（網絡錯誤 + 5xx）
 * - 4xx 不 retry（直接拋錯）
 * - onRetry callback（給 UI 顯示「重新連線中…」）
 */

import { parseStreamChunk } from './chat/chat-utils';
import type { AIMessage } from './providers/providers';

export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number) => void;
  signal?: AbortSignal;
};

/**
 * 串流 chat，回傳 AsyncGenerator<string>
 */
export async function* streamChatWithRetry(
  messages: AIMessage[],
  options: RetryOptions = {},
): AsyncGenerator<string> {
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 500;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: options.signal,
      });

      // 4xx 不 retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText || 'Client error'}`,
        );
      }

      // 5xx retryable
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText || 'Server error'}`,
        );
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const parsed = parseStreamChunk(chunk);
        if (!parsed) continue;

        if (parsed.done) break;

        if (parsed.content) {
          yield parsed.content;
        }
      }

      return; // 成功完成
    } catch (err) {
      // TD-503: AbortError 不要 retry，直接擲出
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }

      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        options.onRetry?.(attempt + 1);
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error('Stream failed after retries');
}