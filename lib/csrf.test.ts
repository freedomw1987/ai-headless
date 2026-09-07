/**
 * CSRF Tests — Sprint 57 R4
 */

import { describe, it, expect } from 'vitest';
import {
  generateCsrfToken,
  readCsrfTokenFromCookies,
  readCsrfTokenFromHeader,
  isValidCsrfRequest,
  withCsrfHeaderFallback,
  CSRF_COOKIE_NAME_EXPORT,
  CSRF_HEADER_NAME_EXPORT,
} from './csrf';

describe('generateCsrfToken', () => {
  it('returns a non-empty string', () => {
    const token = generateCsrfToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });

  it('returns unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(100);
  });

  it('returns base64url-safe characters', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('readCsrfTokenFromCookies', () => {
  it('reads from standard cookie header', () => {
    const token = 'abc123';
    const cookieHeader = `${CSRF_COOKIE_NAME_EXPORT}=${token}; other=value`;
    expect(readCsrfTokenFromCookies(cookieHeader)).toBe(token);
  });

  it('decodes URL-encoded tokens', () => {
    const cookieHeader = `${CSRF_COOKIE_NAME_EXPORT}=${encodeURIComponent('a+b')}`;
    expect(readCsrfTokenFromCookies(cookieHeader)).toBe('a+b');
  });

  it('returns null when no csrf cookie', () => {
    expect(readCsrfTokenFromCookies('other=value')).toBeNull();
  });

  it('returns null when cookie header is null', () => {
    expect(readCsrfTokenFromCookies(null)).toBeNull();
  });

  it('handles whitespace', () => {
    const cookieHeader = `  ${CSRF_COOKIE_NAME_EXPORT}=abc  ;  other=val  `;
    expect(readCsrfTokenFromCookies(cookieHeader)).toBe('abc');
  });
});

describe('readCsrfTokenFromHeader', () => {
  it('reads x-csrf-token header', () => {
    const headers = new Headers();
    headers.set(CSRF_HEADER_NAME_EXPORT, 'header-value');
    expect(readCsrfTokenFromHeader(headers)).toBe('header-value');
  });

  it('returns null when missing', () => {
    expect(readCsrfTokenFromHeader(new Headers())).toBeNull();
  });
});

describe('isValidCsrfRequest', () => {
  async function makeReq(cookie?: string, headerToken?: string): Promise<Request> {
    const headers = new Headers();
    if (cookie) headers.set('cookie', cookie);
    if (headerToken) headers.set(CSRF_HEADER_NAME_EXPORT, headerToken);
    return new Request('http://localhost/api/test', {
      method: 'POST',
      headers,
    });
  }

  it('returns true when cookie matches header', async () => {
    const token = generateCsrfToken();
    const req = await makeReq(
      `${CSRF_COOKIE_NAME_EXPORT}=${token}`,
      token,
    );
    expect(await isValidCsrfRequest(req)).toBe(true);
  });

  it('returns false when cookie missing', async () => {
    const req = await makeReq(undefined, 'token');
    expect(await isValidCsrfRequest(req)).toBe(false);
  });

  it('returns false when header missing', async () => {
    const req = await makeReq(`${CSRF_COOKIE_NAME_EXPORT}=token`, undefined);
    expect(await isValidCsrfRequest(req)).toBe(false);
  });

  it('returns false when values differ', async () => {
    const req = await makeReq(
      `${CSRF_COOKIE_NAME_EXPORT}=cookie-value`,
      'header-value',
    );
    expect(await isValidCsrfRequest(req)).toBe(false);
  });

  it('returns false when both empty', async () => {
    const req = await makeReq(`${CSRF_COOKIE_NAME_EXPORT}=`, '');
    expect(await isValidCsrfRequest(req)).toBe(false);
  });
});

/**
 * withCsrfHeaderFallback — Sprint 57 R4 系統漏洞修法
 *
 * 揭露：Sprint 1-56 所有 admin POST action 都用 raw fetch()，未帶 x-csrf-token header。
 * 只有 register-form.tsx 顯式呼叫 ensureCsrfToken() 設 cookie，後續 apiFetch 自動讀 cookie 補 header。
 * 但 25+ 處用 raw fetch 的地方全部 middleware 403。
 *
 * 修法：middleware 在驗證前自動從 cookie 補 header（前端零改動）。
 *   - 有 cookie + 沒 header → 自動注入 header（攻擊者無法設跨站 cookie，仍安全）
 *   - 有 cookie + 有 header（值不同）→ 不覆蓋（client 意圖明確）
 *   - 無 cookie → 不變
 *   - 純函數：不 mutate 原 headers
 */
describe('withCsrfHeaderFallback', () => {
  it('有 cookie 但無 header → 自動從 cookie 注入 header', () => {
    const headers = new Headers();
    headers.set('cookie', `${CSRF_COOKIE_NAME_EXPORT}=abc123; other=xyz`);

    const result = withCsrfHeaderFallback(headers);
    expect(result.get(CSRF_HEADER_NAME_EXPORT)).toBe('abc123');
  });

  it('有 cookie + 有 header（值相同）→ 保留 header 不變', () => {
    const headers = new Headers();
    headers.set('cookie', `${CSRF_COOKIE_NAME_EXPORT}=abc123`);
    headers.set(CSRF_HEADER_NAME_EXPORT, 'abc123');

    const result = withCsrfHeaderFallback(headers);
    expect(result.get(CSRF_HEADER_NAME_EXPORT)).toBe('abc123');
  });

  it('有 cookie + 有 header（值不同）→ 不覆蓋（保留 client 意圖）', () => {
    const headers = new Headers();
    headers.set('cookie', `${CSRF_COOKIE_NAME_EXPORT}=cookie-value`);
    headers.set(CSRF_HEADER_NAME_EXPORT, 'header-value');

    const result = withCsrfHeaderFallback(headers);
    expect(result.get(CSRF_HEADER_NAME_EXPORT)).toBe('header-value');
  });

  it('無 cookie → 不注入 header', () => {
    const headers = new Headers();

    const result = withCsrfHeaderFallback(headers);
    expect(result.get(CSRF_HEADER_NAME_EXPORT)).toBeNull();
  });

  it('純函數：不 mutate 原 headers', () => {
    const headers = new Headers();
    headers.set('cookie', `${CSRF_COOKIE_NAME_EXPORT}=abc123`);

    withCsrfHeaderFallback(headers);

    expect(headers.get(CSRF_HEADER_NAME_EXPORT)).toBeNull();
  });

  it('整合：有 cookie 自動補 header 後 isValidCsrfRequest 應通過', async () => {
    const headers = new Headers();
    headers.set('cookie', `${CSRF_COOKIE_NAME_EXPORT}=valid-token`);

    const fixedHeaders = withCsrfHeaderFallback(headers);
    const verifyReq = new Request('http://localhost/api/admin/users', {
      method: 'POST',
      headers: fixedHeaders,
    });
    expect(await isValidCsrfRequest(verifyReq)).toBe(true);
  });
});
