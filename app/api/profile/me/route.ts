// Sprint 29-3 — /api/profile/me API
//
// PATCH /api/profile/me
// - 更新當前登入用戶的 profile（self-service）
// - 可更新：name, image URL
// - 變更密碼：需提供 currentPassword 驗證 + newPassword (≥6字)
// - 不能改 email / role（防止帳號混淆 + 權限管理由 admin 處理）
//
// Gate 1 TDD: 見 tests/integration/profile-me-api.test.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/auth';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

const MIN_PASSWORD_LENGTH = 6;

export async function PATCH(req: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: '無效的 request body' }, { status: 400 });
  }

  // 禁止改 email / role / isActive（防止 self privilege escalation）
  if ('email' in body || 'role' in body || 'isActive' in body) {
    return NextResponse.json(
      { error: 'email / role / isActive 不可自行修改' },
      { status: 400 },
    );
  }

  const { name, image, currentPassword, newPassword } = body;
  const data: Record<string, unknown> = {};

  // name: 空字串視為清空
  if (typeof name === 'string') {
    data.name = name.length > 0 ? name : null;
  }

  // image: URL 或 null
  if (typeof image === 'string') {
    data.image = image.length > 0 ? image : null;
  } else if (image === null) {
    data.image = null;
  }

  // password change: 需要 currentPassword 驗證
  if (typeof newPassword === 'string') {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `密碼至少 ${MIN_PASSWORD_LENGTH} 字` },
        { status: 400 },
      );
    }
    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      return NextResponse.json(
        { error: '變更密碼需提供 currentPassword' },
        { status: 400 },
      );
    }

    // 驗證 currentPassword
    const existing = await db.user.findUnique({
      where: { id: session.id },
      select: { passwordHash: true },
    });
    if (!existing?.passwordHash) {
      return NextResponse.json({ error: '帳號不存在' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, existing.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'currentPassword 錯誤' }, { status: 401 });
    }

    data.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '沒有要更新的欄位' }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: session.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
    },
  });

  return NextResponse.json({ user: updated });
}