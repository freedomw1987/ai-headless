/**
 * ==============================================
 *  CSRF Token Endpoint (Sprint 57 R4)
 * ==============================================
 *
 * GET /api/csrf
 * - 產生 CSRF token，設為 cookie
 * - 回傳 token 給 client（讓 client 可驗證 cookie 已設）
 *
 * 對應 docs/sprint57-plan-gate.md §4
 */

import { NextResponse } from 'next/server';
import {
  generateCsrfToken,
  CSRF_COOKIE_OPTIONS,
} from '@/lib/csrf';

export async function GET() {
  const token = generateCsrfToken();

  const response = NextResponse.json({ csrfToken: token });
  response.cookies.set({
    name: CSRF_COOKIE_OPTIONS.name,
    value: token,
    httpOnly: CSRF_COOKIE_OPTIONS.httpOnly,
    secure: CSRF_COOKIE_OPTIONS.secure,
    sameSite: CSRF_COOKIE_OPTIONS.sameSite,
    path: CSRF_COOKIE_OPTIONS.path,
  });
  return response;
}
