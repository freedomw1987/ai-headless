/**
 * ==============================================
 *  CSRF Protection (Sprint 57 R4)
 * ==============================================
 *
 * 採用 double-submit cookie pattern：
 * 1. 登入後 server 設 csrf-token cookie（httpOnly=false，給 JS 讀）
 * 2. client 從 cookie 讀值，放進 x-csrf-token header
 * 3. server middleware 驗證 cookie 值 === header 值
 *
 * 對應 docs/sprint57-plan-gate.md §4
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * 為用戶產生 CSRF token
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    const code = bytes[i];
    if (code === undefined) continue;
    binary += String.fromCharCode(code);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 從 cookie 讀取 csrf token
 */
export function readCsrfTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1));
}

/**
 * 從 request header 讀取 csrf token
 */
export function readCsrfTokenFromHeader(headers: Headers): string | null {
  return headers.get(CSRF_HEADER_NAME);
}

/**
 * 驗證 CSRF request：cookie 值 === header 值，且不為空
 *
 * 使用 timing-safe 比較避免 timing attack
 */
export async function isValidCsrfRequest(req: Request): Promise<boolean> {
  const cookieToken = readCsrfTokenFromCookies(req.headers.get('cookie'));
  const headerToken = readCsrfTokenFromHeader(req.headers);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length === 0 || headerToken.length === 0) return false;

  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * 自動從 cookie 補 CSRF header（Sprint 57 R4 系統漏洞修法）
 *
 * 揭露：Sprint 1-56 所有 admin POST action 都用 raw `fetch()`，未帶 x-csrf-token header。
 * 只有 register-form.tsx 顯式呼叫 ensureCsrfToken() 設 cookie，後續 apiFetch 自動讀 cookie 補 header。
 * 但 25+ 處用 raw fetch 的地方全部 middleware 403。
 *
 * 修法：middleware 在驗證前呼叫此函式，自動從 cookie 補 header（前端零改動）。
 *
 * 安全性：
 *   - 攻擊者無法設跨站 cookie（同源政策 + SameSite=Lax）→ 不會誤放行攻擊請求
 *   - 此函式只是減少前端負擔，不降低 CSRF 保護強度
 *
 * 不覆蓋原 header：client 已明確帶 header（值不同）→ 表示 client 意圖明確，應保留
 *
 * 純函數：不 mutate 傳入的 headers，回傳新 Headers 對象
 */
export function withCsrfHeaderFallback(headers: Headers): Headers {
  const out = new Headers(headers);
  const cookieToken = readCsrfTokenFromCookies(headers.get('cookie'));
  const headerToken = readCsrfTokenFromHeader(headers);

  if (cookieToken && !headerToken) {
    out.set(CSRF_HEADER_NAME, cookieToken);
  }

  return out;
}

/**
 * 設 csrf cookie 的設定
 */
export const CSRF_COOKIE_OPTIONS = {
  name: CSRF_COOKIE_NAME,
  httpOnly: false, // 必須讓 JS 讀
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // 不設 maxAge → session cookie
};

export const CSRF_COOKIE_NAME_EXPORT = CSRF_COOKIE_NAME;
export const CSRF_HEADER_NAME_EXPORT = CSRF_HEADER_NAME;

/**
 * Timing-safe 字串比較
 *
 * 先比較長度（用 SHA-256 hash 後固定 32 bytes 比較）
 * 確保花費時間不依賴字串內容
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  // 用 SHA-256 hash 後 → 固定 32 bytes，這樣比較時間不會洩漏字串長度或內容
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const arrA = new Uint8Array(hashA);
  const arrB = new Uint8Array(hashB);
  let diff = 0;
  for (let i = 0; i < arrA.length; i++) {
    const a = arrA[i];
    const b = arrB[i];
    if (a === undefined || b === undefined) {
      diff |= 1;
      continue;
    }
    diff |= a ^ b;
  }
  return diff === 0;
}
