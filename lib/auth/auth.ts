/**
 * ==============================================
 *  Auth — Session Utilities + Role Types (Sprint 25 強制清後)
 * ==============================================
 *
 * 對應：docs/prd/03-auth.md + docs/prd/09-rbac.md §12.4.1
 *
 * Sprint 25 強制清:
 * - 刪除 hasPermission 純函式 (Phase 1 寫死矩陣)
 * - 刪除 hasAnyPermission / hasAllPermissions (依賴 hasPermission)
 * - 刪除 checkPermission / requirePermission (依賴 hasPermission)
 * - 全部權限檢查改用 hasDynamicPermission / requireDynamicPermission
 *
 * 保留:
 * - Role / Permission / AuthUser / AuthSession types
 * - getCurrentUser / requireUser (session utility)
 * - isAdmin / hasRole (role helper, 不做權限檢查)
 *
 * 注意: 既有呼叫端需改用 requireDynamicPermission (async, 自動 throw)
 *       例如: await requireDynamicPermission('users:assign')
 */

// ==============================================
// 1. Types
// ==============================================

export type Role = 'admin' | 'editor' | 'viewer';

// Permission type 保留向後相容(其他檔可能 type-only import)
export type Permission = `${string}.${string}`;

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null; // Sprint 29-2: avatar URL
  role: Role;
  permissions?: string[]; // Sprint 23+: 動態 permissions array (含 admin wildcard '*')
};

// ==============================================
// 2. Session 工具 (動態 import auth config 避免循環)
// ==============================================

async function loadAuth(): Promise<() => Promise<AuthSession | null>> {
  const mod = await import('./config');
  return mod.auth as unknown as () => Promise<AuthSession | null>;
}

export type AuthSession = {
  user: AuthUser;
};

/**
 * 取得當前用戶 (無 session 返回 null)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const auth = await loadAuth();
  const session = await auth();
  return session?.user ?? null;
}

/**
 * 強制要求登入 (無 session 拋出 Unauthorized)
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: please sign in');
  }
  return user;
}

// ==============================================
// 3. Role helpers
// ==============================================

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

export async function hasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}