/**
 * POST /api/admin/cache/invalidate
 *
 * Sprint 21 Task 4c — 失效 session permission cache
 *
 * 對應 PRD：docs/prd/09-rbac.md §12.3 Q5
 *
 * 用法:
 * - 不帶 body 或 { userId: undefined } → 清除全部快取
 * - { userId: 'xxx' } → 清除指定用戶快取
 *
 * 權限:admin only (透過 requireDynamicPermission 守衛)
 */

import { requireDynamicPermission } from '@/lib/auth/dynamic-permission';
import { invalidateCache, invalidateAllCache } from '@/lib/auth/session-cache';
import { PermissionCode } from '@/lib/auth/permissions';

type InvalidateBody = {
  userId?: string;
};

export async function POST(req: Request) {
  // 1. 解析 body
  let body: InvalidateBody = {};
  try {
    const text = await req.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch {
    return Response.json(
      { status: 400, error: '無效的 JSON body' },
      { status: 400 },
    );
  }

  // 2. 驗證 session
  let userId: string | undefined;
  try {
    const auth = await import('@/lib/auth/config');
    const session = await auth.auth();
    if (!session?.user?.id) {
      return Response.json(
        { status: 401, error: 'Unauthorized' },
        { status: 401 },
      );
    }
    userId = session.user.id;
  } catch {
    return Response.json(
      { status: 401, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // 3. 驗證權限（admin only — 透過 wildcard 守衛）
  try {
    await requireDynamicPermission(PermissionCode.ROLES_WRITE);
  } catch {
    return Response.json(
      { status: 403, error: 'Forbidden: 需要 admin 權限' },
      { status: 403 },
    );
  }

  // 4. 執行失效
  if (body.userId) {
    invalidateCache(body.userId);
    return Response.json({
      status: 200,
      data: { userId: body.userId, scope: 'single' },
      message: `已失效用戶 ${body.userId} 的快取`,
    });
  }

  invalidateAllCache();
  return Response.json({
    status: 200,
    data: { scope: 'all', triggeredBy: userId },
    message: '已失效所有用戶的快取',
  });
}