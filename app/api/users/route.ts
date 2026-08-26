/**
 * ==============================================
 *  US-102 — /api/users API 路由
 * ==============================================
 *
 * GET    /api/users         - 列出用戶（任何已登入）
 * POST   /api/users         - 新增用戶（僅 admin）
 *
 * 對應 PRD §2.2 FR-2.1 / FR-2.2
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser, requirePermission, hasPermission } from '@/lib/auth/auth';
import { hashPassword } from '@/lib/auth/password';
import type { Role } from '@/lib/auth/auth';

// ==============================================
// Helpers
// ==============================================

const VALID_ROLES: Role[] = ['admin', 'editor', 'viewer'];

function sanitizeUser<T extends { passwordHash?: unknown }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user as Record<string, unknown>;
  return safe;
}

// ==============================================
// GET /api/users
// ==============================================

export async function GET(_req: Request) {
  await requireUser();
  const users = await db.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
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
  const total = await db.user.count({ where: { isActive: true } });
  return NextResponse.json({ users, total });
}

// ==============================================
// POST /api/users
// ==============================================

export async function POST(req: Request) {
  await requirePermission('user.manage');
  const body = await req.json().catch(() => ({}));

  const { email, name, password, role } = body;

  // 驗證必填
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email 必填' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: '密碼至少 6 字' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: '密碼至少 6 字' }, { status: 400 });
  }
  if (role && !VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Role 必須是 ${VALID_ROLES.join(' / ')}` },
      { status: 400 },
    );
  }

  // 檢查 email 重複
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email 已被使用' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  // Phase 2 動態 RBAC: 同時設定 roleId (lookup by name)
  const targetRoleName = role ?? 'viewer';
  const roleRecord = await db.role.findUnique({ where: { name: targetRoleName } });
  const user = await db.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash,
      role: targetRoleName,
      roleId: roleRecord?.id,
      isActive: true,
    },
  });

  return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
}

// 觸碰 export 以免 lint 報 unused
void hasPermission;