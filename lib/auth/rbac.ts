/**
 * ==============================================
 *  Auth — RBAC Re-export
 * ==============================================
 *
 * 框架生成代碼使用 `@/lib/auth/rbac` 路徑，這裡統一 re-export。
 */

export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkPermission,
  requirePermission,
  type Role,
  type Permission,
  type AuthUser,
  type AuthSession,
} from './auth';