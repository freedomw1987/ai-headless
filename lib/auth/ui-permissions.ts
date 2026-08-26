/**
 * ==============================================
 *  UI Permission Helper (Sprint 24)
 * ==============================================
 *
 * 對應 PRD：docs/prd/09-rbac.md §12.4 Q6 Sprint 24
 *
 * 提供 UI 條件渲染的權限檢查 helper:
 * - hasUIPermission(permissions, code): 純函數,server/client 通用
 * - useHasUIPermission(code): client hook + Auth.js useSession
 *
 * 自動處理 admin wildcard '*' (與 hasDynamicPermission 一致)
 *
 * 用法:
 *   // Server Component (page.tsx)
 *   const session = await auth();
 *   if (!hasUIPermission(session.user.permissions, 'roles:write')) {
 *     return <div>權限不足</div>;
 *   }
 *
 *   // Client Component (sidebar.tsx)
 *   const canManage = useHasUIPermission('roles:write');
 *   if (!canManage) return null;
 */

import { useSession } from 'next-auth/react';

/**
 * Pure function — 檢查 permissions array 是否包含 code 或 wildcard
 *
 * @param permissions - 從 session.user.permissions 來的 array
 *                     (可為 undefined/null/空陣列,向後相容)
 * @param code        - 要檢查的 permission code (e.g. "roles:write")
 * @returns           - boolean
 *
 * 規則:
 * 1. permissions 含 '*' → 任何 code 都 true (admin wildcard)
 * 2. permissions 含 code → true
 * 3. 其他 → false
 */
export function hasUIPermission(
  permissions: string[] | null | undefined,
  code: string,
): boolean {
  if (!permissions || permissions.length === 0) {
    return false;
  }

  // Wildcard: 任何 admin 都通過
  if (permissions.includes('*')) {
    return true;
  }

  // 明確 code 匹配
  return permissions.includes(code);
}

/**
 * Client hook — 用 Auth.js useSession 取 permissions,呼叫 hasUIPermission
 *
 * 用法 (Client Component):
 *   const canManage = useHasUIPermission('roles:write');
 *   if (!canManage) return null;
 */
export function useHasUIPermission(code: string): boolean {
  const { data: session } = useSession();
  const permissions = session?.user?.permissions;
  return hasUIPermission(permissions, code);
}