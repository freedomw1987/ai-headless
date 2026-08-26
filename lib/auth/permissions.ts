/**
 * ==============================================
 *  RBAC Permission Code Constants (Sprint 21)
 * ==============================================
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 / FR-3
 *
 * 集中所有 resource:action 字串常數，避免散落 magic string。
 * 跨 seed 與 lib/auth/dynamic-permission.ts 共用。
 *
 * 用法：
 *   import { PermissionCode } from '@/lib/auth/permissions';
 *   if (await hasDynamicPermission(userId, PermissionCode.ROLES_WRITE)) { ... }
 *
 * 注意：與 prisma/seed-rbac.ts 的 PermissionCode 保持同步。
 * 如需新增權限，須更新 seed-rbac.ts 的 BUILTIN_PERMISSIONS_BY_ROLE。
 */

export const PermissionCode = {
  // === User 相關 ===
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_ASSIGN: 'users:assign',

  // === Role 相關 ===
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',

  // === 萬能 wildcard：admin 永遠 true ===
  ADMIN_WILDCARD: '*',
} as const;

export type PermissionCode = typeof PermissionCode[keyof typeof PermissionCode];

/**
 * 判斷 code 是否為 admin 萬能 wildcard
 */
export function isAdminWildcard(code: string): boolean {
  return code === PermissionCode.ADMIN_WILDCARD;
}