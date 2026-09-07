/**
 * ==============================================
 *  Register API (Sprint 58 P0-7)
 * ==============================================
 *
 * POST /api/auth/register
 *   body: { email, password, name?, acceptTos, acceptPrivacy }
 *
 * 對應 docs/sprint58-plan-gate.md §2
 *
 * 流程：
 * 1. 驗證 schema (zod)
 * 2. 檢查 email 是否已存在
 * 3. 檢查 ToS/Privacy checkbox 都有打勾
 * 4. 建立 User（emailVerified=null，isActive=true）
 * 5. 記錄 ToS/Privacy 版本 + 時間
 * 6. 建立 VerificationToken (24h)
 * 7. 寄驗證信
 * 8. 回 201
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createVerificationToken } from '@/lib/auth/verification-token';
import { sendEmail } from '@/lib/email';
import { VerificationEmail } from '@/lib/email-templates/verification';
import { getCurrentLegalVersions } from '@/lib/legal';
import { logger } from '@/lib/log';
import { render } from 'react-email';

const RegisterSchema = z.object({
  email: z.string().email('Email 格式不正確'),
  password: z.string().min(8, '密碼至少 8 字元'),
  name: z.string().min(1).max(64).optional(),
  acceptTos: z.literal(true, { errorMap: () => ({ message: '請同意服務條款' }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: '請同意隱私權政策' }) }),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parseResult = RegisterSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }

  const { email, password, name, acceptTos, acceptPrivacy } = parseResult.data;
  const versions = getCurrentLegalVersions();

  // 檢查 email 是否已存在
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: '此 email 已被註冊' },
      { status: 409 },
    );
  }

  // 建立 User
  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
      isActive: true,
      emailVerified: null,
      acceptedTosVersion: acceptTos ? versions.terms : null,
      acceptedPrivacyVersion: acceptPrivacy ? versions.privacy : null,
      tosAcceptedAt: new Date(),
      onboardingStep: 0,
    },
    select: { id: true, email: true },
  });

  // 寄驗證信
  try {
    const token = await createVerificationToken(user.id);
    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

    const html = await render(VerificationEmail({ url: verifyUrl }));

    await sendEmail({
      to: email,
      subject: '驗證你的 ai-headless 帳號',
      html,
    });
  } catch (error) {
    logger.error('register: failed to send verification email', {
      userId: user.id,
      email,
      error: String(error),
    });
    // 不 throw — 用戶可請 admin 重寄
  }

  return NextResponse.json(
    {
      message: '註冊成功！請查收驗證信以啟用帳號',
      userId: user.id,
    },
    { status: 201 },
  );
}
