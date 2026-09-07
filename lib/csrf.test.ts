/**
 * CSRF Tests — Sprint 57 R4
 */

import { describe, it, expect } from 'vitest';
import {
  generateCsrfToken,
  readCsrfTokenFromCookies,
  readCsrfTokenFromHeader,
  isValidCsrfRequest,
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
