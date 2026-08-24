/**
 * US-S6-1 (TD-503) — SSE Stream Abort Playwright E2E
 *
 * 驗證 abort 機制在 React 層正確傳遞 AbortSignal：
 * 1. 切換 chat → 舊串流的 fetch signal 被 abort
 * 2. 同 SPA 切換 session → 活躍串流的 fetch signal 被 abort
 *    （跨 page navigation 會跳過 React cleanup，不在測試範圍 — React 官方行為）
 * 3. 串流期間 ChatInput 保持 disabled（避免 race condition / 雙重串流）
 *
 * 為什麼這 3 個場景重要：
 * - 不 abort → API quota 持續消耗、token 浪費
 * - race condition → 新對話顯示舊訊息殘留
 * - memory leak → AbortController 沒清理
 * - 不禁用 input → 用戶可送多個訊息導致雙重串流
 *
 * 為什麼 mock /api/chat/stream：
 * - 真實 endpoint 需要 Auth（TD-502 server-side validation）
 * - 真實 MockProvider streaming 太快/太慢難以控制
 * - 這測試專注於 React abort 信號傳遞（不需後端）
 * - 真實 provider 行為已由 stream-abort.test.ts（unit）覆蓋
 *
 * 前置條件：dev server 啟動（pnpm dev）即可，不需 MOCK_STREAM_DELAY_MS
 *
 * Sprint 5 reflection 原列「重新發送訊息 → abort 上一輪」場景，
 * 經調查發現 ChatInput 在 streaming 時是 disabled 的（避免 race），
 * 該程式碼路徑實際上不會被觸發 — 改測「disabled狀態是否維持」更實際。
 */

import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * 跨 navigation 持久化的 abort 記錄結構（用 localStorage）
 */
type SignalEntry = {
  url: string;
  aborted: boolean;
  abortedAt: number | null;
  createdAt: number;
};

/**
 * Mock SSE /api/chat/stream 為「可控制的中長度串流」。
 * - 預設 200 字 × 25ms/chunk = ~5 秒（夠 abort 在中途觸發）
 * - 記錄每個請求的 AbortSignal 觸發狀態（用 window.__abortSignals）
 */
async function mockChatStream(page: Page) {
  await page.addInitScript(() => {
    // 用 localStorage 跨 navigation 持久化（同一個 origin 內）
    const STORAGE_KEY = '__e2e_stream_signals';
    type SignalEntry = { url: string; aborted: boolean; abortedAt: number | null; createdAt: number };
    type Chunk = string;

    function readSignals(): SignalEntry[] {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      } catch {
        return [];
      }
    }
    function writeSignals(s: SignalEntry[]) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        // localStorage 可能滿了或被禁用—略過
      }
    }

    function makeStream(totalChunks: number, intervalMs: number) {
      return new ReadableStream<Uint8Array>({
        async start(controller) {
          const encoder = new TextEncoder();
          for (let i = 0; i < totalChunks; i++) {
            await new Promise((r) => setTimeout(r, intervalMs));
            const chunk = `chunk-${i} `;
            const ssePayload = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            try {
              controller.enqueue(encoder.encode(ssePayload));
            } catch {
              return; // 被 abort — 預期
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        },
      });
    }

    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/chat/stream')) {
        const signal = init?.signal;
        const createdAt = Date.now();
        const entry: SignalEntry = { url, aborted: false, abortedAt: null, createdAt };
        const signals = readSignals();
        signals.push(entry);
        writeSignals(signals);

        signal?.addEventListener('abort', () => {
          entry.aborted = true;
          entry.abortedAt = Date.now();
          // 更新 localStorage 中同個 entry
          const updated = readSignals();
          const idx = updated.findIndex(
            (s) => s.createdAt === entry.createdAt && s.url === entry.url,
          );
          if (idx >= 0) {
            updated[idx] = entry;
            writeSignals(updated);
          }
        });

        const stream = makeStream(200, 25);
        return Promise.resolve(
          new Response(stream, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          }),
        );
      }

      return originalFetch.call(window, input as never, init);
    };

    // 暴露給測試用
    (window as unknown as { __clearSignals: () => void }).__clearSignals = () => writeSignals([]);
  });
}

/**
 * 等到 AI 串流中的 indicator 出現（"AI 正在輸入…"）
 */
async function waitForStreaming(page: Page) {
  await expect(page.getByText(/AI 正在輸入/)).toBeVisible({ timeout: 10_000 });
}

/**
 * 等串流結束（indicator 消失）
 */
async function waitForStreamFinished(page: Page) {
  await expect(page.getByText(/AI 正在輸入/)).not.toBeVisible({ timeout: 15_000 });
}

/**
 * 送出訊息 + 等待串流開始
 */
async function sendMessage(page: Page, text: string) {
  const input = page.getByRole('textbox').last();
  await input.fill(text);
  await input.press('Enter');
  await waitForStreaming(page);
}

/**
 * 取得所有 /api/chat/stream 請求的 abort 記錄
 * 跨 navigation 透過 localStorage 讀取（同一個 origin）
 */
async function getStreamRequests(page: Page) {
  return page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('__e2e_stream_signals') ?? '[]');
    } catch {
      return [];
    }
  });
}

/**
 * 取得上一頁（給已 navigate 離開的 chat 頁用）
 */
async function getStreamRequestsFromLastSession(page: Page) {
  // localStorage 跨頁持續存在，直接讀即可
  return getStreamRequests(page);
}

/**
 * 清空記錄（beforeEach 清理）
 */
async function clearStreamRequests(page: Page) {
  await page.evaluate(() => localStorage.removeItem('__e2e_stream_signals'));
}

test.describe('US-S6-1 TD-503 SSE Stream Abort', () => {
  test.beforeEach(async ({ page, context }) => {
    await mockChatStream(page);
    // 進入新 context 前清空 localStorage（避免跨測試污染）
    await context.clearCookies();
    await page.goto(`${BASE}/chat`);
    await clearStreamRequests(page);
    await page.reload(); // 重整以確保 mockChatStream 在 clear 後生效
    await expect(page.getByTestId('chat-page')).toBeVisible();
  });

  test('場景 1：切換 chat 時，舊串流被 abort', async ({ page }) => {
    // 1. 送出第一個訊息 → 串流中
    await sendMessage(page, '幫我做個待辦事項');
    await waitForStreaming(page);

    // 2. 建立第二個 session（這會切 activeId → 觸發舊 stream abort）
    await page.getByTestId('new-chat-button').click();

    // 3. 給 abort 一點時間傳遞
    await page.waitForTimeout(200);

    // 4. 驗證：第一個串流的 fetch signal 被 abort
    const signals = await getStreamRequests(page);
    expect(signals.length).toBeGreaterThanOrEqual(1);
    const firstStream = signals[0];
    expect(firstStream?.aborted).toBe(true);
  });

  test('場景 2：同 SPA 切換 session 時，活躍串流被 abort', async ({ page }) => {
    // 1. 送出訊息 → 串流中
    await sendMessage(page, '建立活動管理');
    await waitForStreaming(page);

    // 2. 驗證 textarea 已 disabled（這證明串流在進行中）
    const input = page.getByTestId('chat-input');
    await expect(input).toBeDisabled();

    // 3. 在 SPA 內部切換到另一個 session（這會重新設 activeId，
    //    觸發 useEffect cleanup with [activeId] dependency）
    //    註：不能用 page.goto（強制 reload 會跳過 React cleanup）
    await page.getByTestId('new-chat-button').click();
    await page.waitForTimeout(300);

    // 4. 給 abort 一點時間傳遞
    await page.waitForTimeout(200);

    // 5. 驗證：活躍串流的 signal 被 abort
    const signals = await getStreamRequests(page);
    expect(signals.length).toBeGreaterThanOrEqual(1);
    expect(signals.some((s: SignalEntry) => s.aborted)).toBe(true);
  });

  test('場景 3：串流期間 ChatInput 維持 disabled（防止雙重串流）', async ({ page }) => {
    // 1. 送出訊息 → 串流中
    await sendMessage(page, '幫我做個待辦事項');
    await waitForStreaming(page);

    // 2. 驗證 ChatInput 是 disabled（這是 race 防護機制）
    const input = page.getByTestId('chat-input');
    const sendBtn = page.getByTestId('chat-send-button');
    await expect(input).toBeDisabled();
    await expect(sendBtn).toBeDisabled();

    // 3. 等串流結束 → 重新可輸入
    await waitForStreamFinished(page);
    await expect(input).toBeEnabled();

    // 4. 驗證只有 1 個 stream 請求（沒有「雙重串流」）
    const signals = await getStreamRequests(page);
    const streamRequests = signals.filter((s: SignalEntry) => s.url.includes('/api/chat/stream'));
    expect(streamRequests.length).toBe(1);
  });
});