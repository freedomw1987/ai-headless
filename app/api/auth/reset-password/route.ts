/**
 * ==============================================
 *  Reset Password API (Sprint 56 P0-2)
 * ==============================================
 *
 * POST /api/auth/reset-password { token, password }
 * - 驗證 token + 改密碼
 * - 成功 → 200
 * - 失敗 → 410 Gone
 *
 * 對應 docs/sprint56-plan-gate.md §2.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { consumePasswordResetToken } from '@/lib/auth/password-reset-token';

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, '密碼至少 8 字元'),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parseResult = ResetPasswordSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { token, password } = parseResult.data;

  const userId = await consumePasswordResetToken(token);
  if (!userId) {
    return NextResponse.json(
      { error: 'Token invalid or expired' },
      { status: 410 },
    );
  }

  // 改密碼
  const passwordHash = await hashPassword(password);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return NextResponse.json({ message: 'Password reset successful' });
}
