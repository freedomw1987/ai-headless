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
