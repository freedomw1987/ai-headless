/**
 * ==============================================
 *  US-102 — /api/users API 路由
 * ==============================================
 *
 * GET    /api/users         - 列出用戶（任何已登入）
 * POST   /api/users         - 新增用戶（僅 admin）
 *
 * 對應 PRD §2.2 FR-2.1 / FR-2.2 + US-102-P2 動態 RBAC
 *
 * Phase 2 變更（Sprint 21）:
 * - role 改為動態查詢 DB（不再寫死 admin/editor/viewer）
 * - 自定義 role 可指派（admin only）
 * - 保留向下相容：role 字串保留作為 Phase 1 hasPermission 後備
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

  // Phase 2 動態 RBAC: role 改為 DB 驗證（不再寫死）
  const targetRoleName = role ?? 'viewer';
  const roleRecord = await db.role.findUnique({ where: { name: targetRoleName } });
  if (!roleRecord) {
    return NextResponse.json(
      { error: `Role '${targetRoleName}' 不存在` },
      { status: 400 },
    );
  }

  // 檢查 email 重複
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email 已被使用' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash,
      role: targetRoleName,
      roleId: roleRecord.id, // Phase 2 FK
      isActive: true,
    },
  });

  return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
}