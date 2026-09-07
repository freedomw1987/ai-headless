/**
 * CSRF Middleware Integration Test (Sprint 57 R4)
 *
 * 直接呼叫 isValidCsrfRequest 確認 middleware 邏輯
 * 完整 middleware 端對端測試要 dev server（見 sprint57-smoke-test.ts）
 */

import { describe, it, expect } from 'vitest';
import { isValidCsrfRequest, generateCsrfToken, CSRF_COOKIE_NAME_EXPORT } from '@/lib/csrf';

describe('CSRF middleware logic', () => {
  async function makeReq(
    method: string,
    options: { cookie?: string; headerToken?: string } = {},
  ): Promise<Request> {
    const headers = new Headers();
    if (options.cookie) headers.set('cookie', options.cookie);
    if (options.headerToken) {
      headers.set('x-csrf-token', options.headerToken);
    }
    return new Request('http://localhost/api/users', {
      method,
      headers,
    });
  }

  it('blocks POST without csrf cookie', async () => {
    const req = await makeReq('POST', { headerToken: 'something' });
    expect(await isValidCsrfRequest(req)).toBe(false);
  });

  it('blocks POST without csrf header', async () => {
    const req = await makeReq('POST', {
      cookie: `${CSRF_COOKIE_NAME_EXPORT}=abc`,
    });
    expect(await isValidCsrfRequest(req)).toBe(false);
  });

  it('blocks POST when cookie and header differ', async () => {
    const req = await makeReq('POST', {
      cookie: `${CSRF_COOKIE_NAME_EXPORT}=cookie-token`,
      headerToken: 'different-header-token',
    });
    expect(await isValidCsrfRequest(req)).toBe(false);
  });

  it('allows POST when cookie and header match', async () => {
    const token = generateCsrfToken();
    const req = await makeReq('POST', {
      cookie: `${CSRF_COOKIE_NAME_EXPORT}=${token}`,
      headerToken: token,
    });
    expect(await isValidCsrfRequest(req)).toBe(true);
  });

  it('blocks PUT/PATCH/DELETE too', async () => {
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      const req = await makeReq(method);
      expect(await isValidCsrfRequest(req)).toBe(false);
    }
  });

  it('does not require csrf for GET (caller decides)', async () => {
    const req = await makeReq('GET');
    // GET 不會通過 middleware 的 isStateChanging 檢查，但函式本身仍回 false
    // 重點是 middleware 不會對 GET 呼叫這個函式
    expect(await isValidCsrfRequest(req)).toBe(false);
  });
});
