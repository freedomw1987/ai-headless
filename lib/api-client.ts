'use client';

/**
 * ==============================================
 *  API Client with CSRF + Request ID (Sprint 57 R6 + R4)
 * ==============================================
 *
 * 用法：
 *   import { apiFetch } from '@/lib/api-client';
 *   const res = await apiFetch('/api/users', { method: 'POST', body: ... });
 *
 * 自動處理：
 * - 從 cookie 讀 csrf-token 放進 x-csrf-token header
 * - 自動帶 x-request-id（middleware 會用）
 * - JSON 序列化 / 反序列化
 *
 * 對應 docs/sprint57-plan-gate.md §4
 */

import { CSRF_COOKIE_NAME_EXPORT, CSRF_HEADER_NAME_EXPORT } from './csrf';

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

function generateClientRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 自動帶 CSRF header + Request ID 的 fetch 包裝
 *
 * 對應 docs/sprint57-plan-gate.md §4 + §3
 */
export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers ?? {});

  // 自動帶 CSRF token（double-submit cookie pattern）
  const csrfToken = readCookie(CSRF_COOKIE_NAME_EXPORT);
  if (csrfToken) {
    finalHeaders.set(CSRF_HEADER_NAME_EXPORT, csrfToken);
  }

  // 自動帶 request id（middleware 不會自己產生 client request 的 id）
  if (!finalHeaders.has('x-request-id')) {
    finalHeaders.set('x-request-id', generateClientRequestId());
  }

  // JSON 序列化 body
  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData || body instanceof Blob || typeof body === 'string') {
      finalBody = body as BodyInit;
    } else {
      finalHeaders.set('Content-Type', 'application/json');
      finalBody = JSON.stringify(body);
    }
  }

  return fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  });
}

/**
 * 在登入成功後初始化 CSRF token（呼叫 GET /api/auth/csrf-init 拿 token 設 cookie）
 *
 * 對應 docs/sprint57-plan-gate.md §4
 */
export async function ensureCsrfToken(): Promise<void> {
  if (typeof document === 'undefined') return;

  // 如果已有 token 就不重設
  if (readCookie(CSRF_COOKIE_NAME_EXPORT)) return;

  try {
    const res = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      // server 已經設好 cookie 了
    }
  } catch {
    // ignore — 失敗也不影響用戶操作（GET 不需 CSRF）
  }
}
