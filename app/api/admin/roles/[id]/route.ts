/**
 * /api/admin/roles/[id] — Role 單一 CRUD
 *
 * Sprint 21 Task 6 — FR-1, FR-5
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 *
 * GET     /api/admin/roles/[id]      — 取得單一 role
 * PATCH   /api/admin/roles/[id]      — 更新自定義 role
 * DELETE  /api/admin/roles/[id]      — 刪除自定義 role（內建不可刪）
 */

import { db } from '@/lib/db';
import { requireDynamicPermission } from '@/lib/auth/dynamic-permission';
import { PermissionCode } from '@/lib/auth/permissions';
import { updateRoleSchema } from '@/lib/auth/role-schema';
import { invalidateAllCache } from '@/lib/auth/session-cache';

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

// ==============================================
// GET — 單一
// ==============================================

export async function GET(_req: Request, { params }: Params) {
  const guard = await checkAuthAndPermission();
  if (!guard.ok) {
    return Response.json({ status: guard.status, error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const role = await db.role.findUnique({
    where: { id },
    include: {
      permissions: { select: { id: true, code: true } },
      _count: { select: { users: true } },
    },
  });

  if (!role) {
    return Response.json(
      { status: 404, error: `Role '${id}' 不存在` },
      { status: 404 },
    );
  }

  return Response.json({ status: 200, data: role });
}

// ==============================================
// PATCH — 更新
// ==============================================

export async function PATCH(req: Request, { params }: Params) {
  const guard = await checkAuthAndPermission();
  if (!guard.ok) {
    return Response.json({ status: guard.status, error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  // 1. 驗證 body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { status: 400, error: '無效的 JSON body' },
      { status: 400 },
    );
  }

  const parsed = updateRoleSchema.safeParse(raw);
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

  // 2. 確認 role 存在
  const existing = await db.role.findUnique({ where: { id } });
  if (!existing) {
    return Response.json(
      { status: 404, error: `Role '${id}' 不存在` },
      { status: 404 },
    );
  }

  // 3. 更新
  const updated = await db.role.update({
    where: { id },
    data: parsed.data,
  });

  // 4. 失效所有快取（role 顯示名稱變更可能影響 UI）
  invalidateAllCache();

  return Response.json({
    status: 200,
    data: updated,
    message: `Role '${updated.name}' 已更新`,
  });
}

// ==============================================
// DELETE — 刪除（內建不可刪,有人用不可刪）
// ==============================================

export async function DELETE(_req: Request, { params }: Params) {
  const guard = await checkAuthAndPermission();
  if (!guard.ok) {
    return Response.json({ status: guard.status, error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  // 1. 確認 role 存在
  const existing = await db.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) {
    return Response.json(
      { status: 404, error: `Role '${id}' 不存在` },
      { status: 404 },
    );
  }

  // 2. 內建 role 不可刪
  if (existing.isSystem) {
    return Response.json(
      {
        status: 409,
        error: `Role '${existing.name}' 是系統內建,不可刪除`,
      },
      { status: 409 },
    );
  }

  // 3. 有人指派則不可刪
  if (existing._count.users > 0) {
    return Response.json(
      {
        status: 409,
        error: `Role '${existing.name}' 有 ${existing._count.users} 個用戶指派,無法刪除`,
      },
      { status: 409 },
    );
  }

  // 4. 刪除
  await db.role.delete({ where: { id } });

  return Response.json({
    status: 200,
    message: `Role '${existing.name}' 已刪除`,
  });
}