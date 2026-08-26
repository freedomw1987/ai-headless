/**
 * ==============================================
 *  Dynamic Permission Check (Sprint 21)
 * ==============================================
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 / FR-4 / Q6 雙函式策略
 *
 * hasDynamicPermission(userId, code) — 查 DB + cache
 * 與 Phase 1 純函式 hasPermission 並存,漸進式遷移。
 *
 * 用法:
 *   import { hasDynamicPermission } from '@/lib/auth/dynamic-permission';
 *   if (await hasDynamicPermission(userId, PermissionCode.ROLES_WRITE)) { ... }
 *
 * 流程:
 *   1. 查快取 (session-cache, 60s TTL)
 *   2. 快取未命中 → 查 DB (User.roleRef.permissions)
 *   3. 寫回快取
 *   4. 判斷: 有 code 或有 wildcard '*' → true
 */

import { db } from '@/lib/db';
import {
  getCachedPermissions,
  setCachedPermissions,
  invalidateCache,
} from './session-cache';
import { PermissionCode, isAdminWildcard } from './permissions';

export type DynamicPermissionCode = PermissionCode | (string & {});

async function loadAuth(): Promise<() => Promise<{ user: { id: string } } | null>> {
  const mod = await import('./config');
  return mod.auth as unknown as () => Promise<{ user: { id: string } } | null>;
}

/**
 * 取得當前用戶 ID（從 session）
 */
async function getCurrentUserId(): Promise<string> {
  const auth = await loadAuth();
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: please sign in');
  }
  return session.user.id;
}

/**
 * 從 DB 載入用戶的所有 permissions codes
 */
async function loadPermissionsFromDb(
  userId: string,
): Promise<{ permissions: Set<string>; roleId: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      roleRef: {
        select: {
          id: true,
          permissions: {
            select: { code: true },
          },
        },
      },
    },
  });

  if (!user?.roleRef) {
    return { permissions: new Set(), roleId: user?.roleId ?? '' };
  }

  const codes = new Set(user.roleRef.permissions.map((p) => p.code));
  return { permissions: codes, roleId: user.roleRef.id };
}

/**
 * 動態權限檢查 — 查 DB + cache + admin wildcard
 *
 * @param code 要檢查的 permission code（resource:action 格式）
 * @returns boolean — 有權限返回 true
 */
export async function hasDynamicPermission(
  code: DynamicPermissionCode,
): Promise<boolean> {
  const userId = await getCurrentUserId();

  // 1. 查快取
  let cached = getCachedPermissions(userId);

  // 2. 快取未命中 → 查 DB
  if (!cached) {
    const { permissions, roleId } = await loadPermissionsFromDb(userId);
    setCachedPermissions(userId, permissions, roleId);
    cached = { permissions, roleId, expiresAt: 0 };
  }

  // 3. 判斷:有 code 直接命中
  if (cached.permissions.has(code)) return true;

  // 4. 判斷:有 wildcard '*'（admin 萬能）
  if (cached.permissions.has(PermissionCode.ADMIN_WILDCARD)) return true;

  // 5. 判斷:任一 permission 是 wildcard 字串
  for (const p of cached.permissions) {
    if (isAdminWildcard(p)) return true;
  }

  return false;
}

/**
 * 強制要求權限（無權限拋出錯誤）
 * 用於 API route handler: await requireDynamicPermission(PermissionCode.ROLES_WRITE)
 */
export async function requireDynamicPermission(
  code: DynamicPermissionCode,
): Promise<void> {
  const allowed = await hasDynamicPermission(code);
  if (!allowed) {
    throw new Error(`Forbidden: requires permission '${code}'`);
  }
}

/**
 * 顯式失效當前用戶的快取
 * 用於測試或特殊場景
 */
export async function invalidateCurrentUserCache(): Promise<void> {
  const userId = await getCurrentUserId();
  invalidateCache(userId);
}