/**
 * ==============================================
 *  Forgot Password API (Sprint 56 P0-2)
 * ==============================================
 *
 * POST /api/auth/forgot-password { email }
 * - 永遠回 200（避免 user enumeration）
 * - 若 email 存在 → 寄 reset 信
 * - 若 email 不存在 → 仍回 200 但不寄信
 *
 * 對應 docs/sprint56-plan-gate.md §2.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createPasswordResetToken } from '@/lib/auth/password-reset-token';
import { sendEmail } from '@/lib/email';
import { PasswordResetEmail } from '@/lib/email-templates/password-reset';
import { render } from 'react-email';

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parseResult = ForgotPasswordSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 },
    );
  }

  const { email } = parseResult.data;

  // 永遠回 200（避免 user enumeration）
  // 但若 email 存在 → 寄信
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });

  if (user && user.isActive) {
    const token = await createPasswordResetToken(user.id);
    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';
    const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

    const html = await render(
      PasswordResetEmail({ url: resetUrl, expiresInMinutes: 60 }),
    );

    try {
      await sendEmail({
        to: email,
        subject: '重設你的 ai-headless 密碼',
        html,
      });
    } catch (error) {
      console.error('[forgot-password] send email failed:', error);
      // 不 throw — 對用戶隱藏錯誤
    }
  }

  return NextResponse.json({
    message: 'If the email exists, a reset link has been sent.',
  });
}
