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
import type { Role } from '@/lib/auth/auth';

const VALID_ROLES: Role[] = ['admin', 'editor', 'viewer'];

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
  const { email, name, role, isActive } = body;

  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Role 必須是 ${VALID_ROLES.join(' / ')}` },
      { status: 400 },
    );
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (email && email !== existing.email) {
    const dup = await db.user.findUnique({ where: { email } });
    if (dup) return NextResponse.json({ error: 'Email 已被使用' }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id },
    data: {
      email: email ?? undefined,
      name: name ?? undefined,
      role: role ?? undefined,
      isActive: isActive ?? undefined,
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