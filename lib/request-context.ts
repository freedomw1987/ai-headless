/**
 * ==============================================
 *  Request Context (Sprint 57 R6)
 * ==============================================
 *
 * 每個 HTTP request 都有唯一 trace ID，串起 log / audit / Sentry / 客戶端報錯
 *
 * 設計：
 * - 使用 AsyncLocalStorage 在 server-side 傳遞 context
 * - edge runtime 與 nodejs runtime 都安全
 * - 不引入新依賴（用 Node 19+ 內建 AsyncLocalStorage）
 *
 * 對應 docs/sprint57-plan-gate.md §3
 */

import { AsyncLocalStorage } from 'async_hooks';

const REQUEST_ID_HEADER = 'x-request-id';

export type RequestContextValue = {
  requestId: string;
  userId?: string;
  path?: string;
  method?: string;
};

// AsyncLocalStorage instance — 在整個 request lifecycle 共享
const storage = new AsyncLocalStorage<RequestContextValue>();

/**
 * 產生新 request ID（UUID v4，crypto.randomUUID 內建）
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * 從 incoming request header 讀取 request id
 * 若無則產生新的
 */
export function readOrGenerateRequestId(req: Request): string {
  const incoming = req.headers.get(REQUEST_ID_HEADER);
  if (incoming && isValidRequestId(incoming)) {
    return incoming;
  }
  return generateRequestId();
}

function isValidRequestId(value: string): boolean {
  // 寬鬆校驗：UUID v4 / UUID 任何版本 / nanoid 風格
  return /^[a-zA-Z0-9-_.]{8,128}$/.test(value);
}

/**
 * 在 server action / API handler / route 包 context
 *
 * 用法：
 *   export async function POST(req: Request) {
 *     return withRequestContext(req, async () => {
 *       const ctx = getRequestContext();
 *       logger.info('processing', { requestId: ctx.requestId });
 *       return NextResponse.json({});
 *     });
 *   }
 */
export function withRequestContext<T>(
  initial: RequestContextValue,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(initial, fn);
}

/**
 * 讀取當前 request context（在 withRequestContext 範圍內）
 * 若不在 context 範圍內，回傳 undefined（呼叫端要處理）
 */
export function getRequestContext(): RequestContextValue | undefined {
  return storage.getStore();
}

/**
 * 便利函式：只讀 request id，若不在 context 內回傳 fallback
 */
export function getRequestIdOr(fallback = 'no-request-id'): string {
  return getRequestContext()?.requestId ?? fallback;
}

export const REQUEST_ID_HEADER_NAME = REQUEST_ID_HEADER;

// Sprint 57 R6: 讓 logger 自動取得 request id
import { setLogRequestIdProvider } from './log';
setLogRequestIdProvider(() => storage.getStore()?.requestId);
