/**
 * US-102 — Next.js middleware：守衛 /admin/* 路由 + Request ID (R6) + CSRF (R4)
 *
 * 用 edge-safe config（沒 Prisma），避免 edge runtime 炸
 *
 * 規則：
 * - 未登入訪問 /admin/*（除了 /admin/login）→ redirect 到 /admin/login
 * - 已登入訪問 /admin/login → redirect 到 /admin
 * - 所有 request → 注入 x-request-id header（Sprint 57 R6）
 * - state-changing API（POST/PUT/PATCH/DELETE）→ 驗證 CSRF token（Sprint 57 R4）
 */

import NextAuth from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';
import { authConfig } from '@/lib/auth/auth.config';
import {
  readOrGenerateRequestId,
  REQUEST_ID_HEADER_NAME,
} from '@/lib/request-context';
import { isValidCsrfRequest, withCsrfHeaderFallback } from '@/lib/csrf';

const { auth } = NextAuth(authConfig);

// 不需 CSRF 保護的路徑（webhook / NextAuth / 一次性 token route）
const CSRF_ALLOWLIST = [
  '/api/auth/verify',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/callback',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/csrf', // NextAuth 自己的 csrf endpoint
  '/api/auth/providers',
  '/api/webhooks',
];

function isCsrfAllowlisted(pathname: string): boolean {
  return CSRF_ALLOWLIST.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const isLoginPage = nextUrl.pathname === '/admin/login';

  // ===== Sprint 57 R6: 注入 Request ID =====
  const requestId = readOrGenerateRequestId(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(REQUEST_ID_HEADER_NAME, requestId);

  // ===== Sprint 57 R4: CSRF 保護 =====
  const method = req.method.toUpperCase();
  const isStateChanging =
    method === 'POST' ||
    method === 'PUT' ||
    method === 'PATCH' ||
    method === 'DELETE';

  if (
    isStateChanging &&
    nextUrl.pathname.startsWith('/api/') &&
    !isCsrfAllowlisted(nextUrl.pathname)
  ) {
    // Sprint 57 R4 系統漏洞修法：自動從 cookie 補 header（前端用 raw fetch 時相容）
    // 25+ 處 Sprint 1-56 的 admin POST 都用 raw fetch()，沒帶 x-csrf-token header
    // 有 csrf cookie 但沒 header → middleware 自動補 header 後驗證
    const verifyHeaders = withCsrfHeaderFallback(requestHeaders);
    const verifyReq = new NextRequest(req.nextUrl.toString(), {
      method: req.method,
      headers: verifyHeaders,
    });
    const csrfOk = await isValidCsrfRequest(verifyReq);
    if (!csrfOk) {
      return NextResponse.json(
        { error: 'CSRF token missing or invalid' },
        { status: 403 },
      );
    }
  }

  // ===== 原本的 auth 路由守衛 =====
  // 1. 未登入訪問 /admin/* → redirect 到 /admin/login
  //    Sprint 56：例外 /admin/forgot-password, /admin/reset-password
  const isPublicAuthRoute =
    nextUrl.pathname === '/admin/forgot-password' ||
    nextUrl.pathname.startsWith('/admin/reset-password') ||
    nextUrl.pathname === '/admin/register';

  if (
    !isLoggedIn &&
    nextUrl.pathname.startsWith('/admin') &&
    !isLoginPage &&
    !isPublicAuthRoute
  ) {
    const url = nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 2. 已登入訪問 /admin/login → redirect 到 /admin
  if (isLoggedIn && isLoginPage) {
    const url = nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // 注入 request id header 給下游 server action / API handler 讀
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 也回 x-request-id header 給 client（讓前端報錯時可附上）
  response.headers.set(REQUEST_ID_HEADER_NAME, requestId);

  return response;
});

export const config = {
  // 包含 API routes 才能做 CSRF 檢查；包含 /admin/* 做 auth 守衛
  matcher: ['/admin/:path*', '/api/:path*'],
};
