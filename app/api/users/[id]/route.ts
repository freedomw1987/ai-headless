/**
 * ==============================================
 *  US-102 — /api/users/[id] 單一用戶 API
 * ==============================================
 *
 * GET    /api/users/[id]   - 取單一用戶
 * PATCH  /api/users/[id]   - 更新用戶（僅 admin）
 * DELETE /api/users/[id]   - 軟刪除（僅 admin，不能刪自己）
 *
 * 對應 PRD §2.2 FR-2.3 / FR-2.4 / FR-2.5
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, requirePermission } from '@/lib/auth/auth';
import { hashPassword } from '@/lib/auth/password';

function sanitizeUser<T extends { passwordHash?: unknown }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user as Record<string, unknown>;
  return safe;
}

// ==============================================
// GET /api/users/[id]
// ==============================================

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUser();
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user });
}

// ==============================================
// PATCH /api/users/[id]
// ==============================================

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission('user.manage');
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { email, name, role, isActive, password } = body;

  if (role) {
    // Phase 2 動態 RBAC: role 改為 DB 驗證
    const roleRecord = await db.role.findUnique({ where: { name: role } });
    if (!roleRecord) {
      return NextResponse.json(
        { error: `Role '${role}' 不存在` },
        { status: 400 },
      );
    }
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (email && email !== existing.email) {
    const dup = await db.user.findUnique({ where: { email } });
    if (dup) return NextResponse.json({ error: 'Email 已被使用' }, { status: 400 });
  }

  // Phase 2 動態 RBAC: 若變更 role,同步更新 roleId
  let roleIdUpdate: string | null | undefined = undefined;
  if (role) {
    const roleRecord = await db.role.findUnique({ where: { name: role } });
    roleIdUpdate = roleRecord?.id ?? null;
  }

  // 處理密碼變更:Phase 1 既有 bug (PATCH 完全忽略 password 欄位)
  // 修正:若有 password 則重新 hash 並更新
  let passwordHash: string | undefined = undefined;
  if (password && typeof password === 'string' && password.length >= 6) {
    passwordHash = await hashPassword(password);
  } else if (password && typeof password === 'string' && password.length < 6) {
    return NextResponse.json(
      { error: '密碼至少 6 字' },
      { status: 400 },
    );
  }

  const user = await db.user.update({
    where: { id },
    data: {
      email: email ?? undefined,
      name: name ?? undefined,
      role: role ?? undefined,
      roleId: roleIdUpdate,
      isActive: isActive ?? undefined,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  return NextResponse.json({ user: sanitizeUser(user) });
}

// ==============================================
// DELETE /api/users/[id]（軟刪除）
// ==============================================

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePermission('user.manage');
  const { id } = await params;

  // 不能刪自己
  const session = await requireUser();
  if (session.id === id) {
    return NextResponse.json({ error: '不能刪除自己的帳號' }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}

// 觸碰 export
void requireUser;