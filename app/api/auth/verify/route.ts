/**
 * ==============================================
 *  Email Verification API (Sprint 56 P0-1)
 * ==============================================
 *
 * GET /api/auth/verify?token=xxx
 * - 驗證 email token
 * - 成功 → 標記 User.emailVerified + 重導向到 login 頁
 * - 失敗 → 410 Gone
 *
 * 對應 docs/sprint56-plan-gate.md §2.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeVerificationToken } from '@/lib/auth/verification-token';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing token parameter' },
      { status: 400 },
    );
  }

  const userId = await consumeVerificationToken(token);

  if (!userId) {
    return NextResponse.json(
      { error: 'Token invalid or expired' },
      { status: 410 }, // 410 Gone
    );
  }

  // 成功 → 重導向到 login
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('verified', '1');
  return NextResponse.redirect(url);
}
