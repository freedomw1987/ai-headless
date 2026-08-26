/**
 * PATCH /api/admin/roles/[id]/permissions
 *
 * Sprint 21 Task 7 — Permission Matrix Update API
 * 對應 PRD：docs/prd/09-rbac.md §5.3 FR-2 + FR-5.4
 *
 * 語意:整組替換 (PUT-like)
 * - 不提供增量 API (避免複雜度)
 * - 前端送完整新矩陣,後端在 transaction 內刪舊增新
 *
 * 流程:
 * 1. 驗證 session + admin 權限
 * 2. 確認 role 存在
 * 3. 內建 role → 409 (唯讀)
 * 4. transaction: deleteMany + createMany
 * 5. invalidateAllCache (權限變更對所有用戶生效)
 */

import { z } from 'zod';
import { db } from '@/lib/db';
import { requireDynamicPermission } from '@/lib/auth/dynamic-permission';
import { PermissionCode } from '@/lib/auth/permissions';
import { invalidateAllCache } from '@/lib/auth/session-cache';

const updateMatrixSchema = z.object({
  permissions: z.array(
    z.string().regex(
      /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/,
      'permission code 須符合 resource:action 格式',
    ),
  ),
});

type Params = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, { params }: Params) {
  // 1. Auth + Permission guard
  const guard = await checkAuthAndPermission();
  if (!guard.ok) {
    return Response.json(
      { status: guard.status, error: guard.error },
      { status: guard.status },
    );
  }

  const { id } = await params;

  // 2. 驗證 body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { status: 400, error: '無效的 JSON body' },
      { status: 400 },
    );
  }

  const parsed = updateMatrixSchema.safeParse(raw);
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

  // 3. 確認 role 存在
  const role = await db.role.findUnique({
    where: { id },
    select: { id: true, name: true, isSystem: true },
  });

  if (!role) {
    return Response.json(
      { status: 404, error: `Role '${id}' 不存在` },
      { status: 404 },
    );
  }

  // 4. 內建 role 唯讀
  if (role.isSystem) {
    return Response.json(
      {
        status: 409,
        error: `Role '${role.name}' 是系統內建,permissions 唯讀`,
      },
      { status: 409 },
    );
  }

  // 5. Transaction: 整組替換
  const codes = Array.from(new Set(parsed.data.permissions)); // dedupe
  await db.$transaction(async (tx) => {
    // 刪除所有舊 permissions
    await tx.permission.deleteMany({
      where: { roleId: id },
    });

    // 建立新 permissions
    if (codes.length > 0) {
      await tx.permission.createMany({
        data: codes.map((code) => ({
          roleId: id,
          code,
        })),
      });
    }
  });

  // 6. 失效所有快取（權限變更影響所有指派此 role 的用戶）
  invalidateAllCache();

  return Response.json({
    status: 200,
    data: {
      roleId: id,
      roleName: role.name,
      permissions: codes,
    },
    message: `Role '${role.name}' permissions 已更新 (${codes.length} 個)`,
  });
}