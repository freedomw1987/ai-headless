/**
 * /api/admin/roles — Role CRUD API
 *
 * Sprint 21 Task 6 — FR-1 + FR-5
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 *
 * GET /api/admin/roles       — 列出所有 role（admin only）
 * POST /api/admin/roles      — 建立自定義 role（admin only）
 *
 * PATCH / DELETE 在 /[id]/route.ts
 */

import { db } from '@/lib/db';
import { requireDynamicPermission } from '@/lib/auth/dynamic-permission';
import { PermissionCode } from '@/lib/auth/permissions';
import { createRoleSchema } from '@/lib/auth/role-schema';

// ==============================================
// 共用 helper
// ==============================================

async function checkAuthAndPermission(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const auth = await import('@/lib/auth/config');
  const session = await auth.auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  try {
    await requireDynamicPermission(PermissionCode.ROLES_WRITE);
  } catch {
    return { ok: false, status: 403, error: 'Forbidden: 需要 admin 權限' };
  }
  return { ok: true, userId: session.user.id };
}

// ==============================================
// GET — 列出
// ==============================================

export async function GET() {
  const guard = await checkAuthAndPermission();
  if (!guard.ok) {
    return Response.json({ status: guard.status, error: guard.error }, { status: guard.status });
  }

  const roles = await db.role.findMany({
    include: {
      _count: {
        select: {
          users: true,
          permissions: true,
        },
      },
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  });

  return Response.json({
    status: 200,
    data: roles,
  });
}

// ==============================================
// POST — 建立
// ==============================================

export async function POST(req: Request) {
  const guard = await checkAuthAndPermission();
  if (!guard.ok) {
    return Response.json({ status: guard.status, error: guard.error }, { status: guard.status });
  }

  // 1. 解析並驗證 body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { status: 400, error: '無效的 JSON body' },
      { status: 400 },
    );
  }

  const parsed = createRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        status: 400,
        error: '驗證失敗',
        details: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // 2. 建立（DB unique constraint 處理 race condition）
  let role;
  try {
    role = await db.role.create({
      data: {
        ...parsed.data,
        isSystem: false, // 只能建立自定義 role
      },
    });
  } catch (err) {
    const prismaErr = err as { code?: string };
    if (prismaErr?.code === 'P2002') {
      return Response.json(
        {
          status: 409,
          error: `Role '${parsed.data.name}' 已存在`,
        },
        { status: 409 },
      );
    }
    throw err;
  }

  return Response.json(
    {
      status: 201,
      data: role,
      message: `Role '${role.name}' 已建立`,
    },
    { status: 201 },
  );
}