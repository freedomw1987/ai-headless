/**
 * US-102 — Next.js middleware：守衛 /admin/* 路由
 *
 * 用 edge-safe config（沒 Prisma），避免 edge runtime 炸
 *
 * 規則：
 * - 未登入訪問 /admin/*（除了 /admin/login）→ redirect 到 /admin/login
 * - 已登入訪問 /admin/login → redirect 到 /admin
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const isLoginPage = nextUrl.pathname === '/admin/login';

  // 1. 未登入訪問 /admin/* → redirect 到 /admin/login
  if (!isLoggedIn && nextUrl.pathname.startsWith('/admin') && !isLoginPage) {
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

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};