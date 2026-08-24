/**
 * ==============================================
 *  Auth — RBAC + Session Utilities
 * ==============================================
 *
 * 對應：docs/prd/03-auth.md
 *
 * 三層角色：
 * - admin: 完整權限（包含用戶管理）
 * - editor: 可讀寫所有資料，不能管理用戶
 * - viewer: 只能讀
 *
 * 權限命名空間：`{model}.{action}`
 * - post.create / post.read / post.update / post.delete
 * - user.manage
 *
 * 使用：
 *   import { requirePermission } from '@/lib/auth';
 *   await requirePermission('post.create');
 */

// ==============================================
// 1. Types
// ==============================================

export type Role = 'admin' | 'editor' | 'viewer';

export type Permission =
  | 'post.create'
  | 'post.read'
  | 'post.update'
  | 'post.delete'
  | 'user.manage'
  | `${string}.${'create' | 'read' | 'update' | 'delete' | 'manage'}`;

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
};

// ==============================================
// 2. Role × Permission 矩陣
// ==============================================

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['user.manage'], // 萬用：所有 *.* 都包含
  editor: ['*.create', '*.read', '*.update', '*.delete'],
  viewer: ['*.read'],
};

const ADMIN_PERMISSIONS = ['user.manage'];

/**
 * 檢查單一權限
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  if (!role) return false;
  // admin 擁有所有 .create/.read/update/delete + user.manage
  if (role === 'admin') {
    const [, action] = permission.split('.');
    if (!action) return false;
    return (
      ADMIN_PERMISSIONS.includes(permission as Permission) ||
      ['create', 'read', 'update', 'delete'].includes(action)
    );
  }

  const allowed = ROLE_PERMISSIONS[role] ?? [];
  return allowed.some((p) => matchPermission(p, permission));
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

function matchPermission(pattern: string, permission: string): boolean {
  if (pattern === permission) return true;
  // 將 *.foo 轉為 regex：匹配 {anything}.foo
  if (pattern.startsWith('*.')) {
    const action = pattern.slice(2); // "create" / "read" / ...
    return permission.endsWith('.' + action);
  }
  // *. 匹配任意 *.xxx
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return permission.startsWith(prefix + '.');
  }
  return false;
}

// ==============================================
// 3. Session 工具（動態 import auth config 避免循環）
// ==============================================

async function loadAuth(): Promise<() => Promise<AuthSession | null>> {
  const mod = await import('./config');
  return mod.auth as unknown as () => Promise<AuthSession | null>;
}

export type AuthSession = {
  user: AuthUser;
};

/**
 * 取得當前用戶（無 session 返回 null）
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const auth = await loadAuth();
  const session = await auth();
  return session?.user ?? null;
}

/**
 * 強制要求登入（無 session 拋出 Unauthorized）
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: please sign in');
  }
  return user;
}

/**
 * 檢查權限（無 session 或權限不足拋出錯誤）
 */
export async function checkPermission(permission: Permission): Promise<void> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Forbidden: requires permission '${permission}'`);
  }
}

/**
 * 檢查權限並返回 session（無 session 或權限不足拋出錯誤）
 */
export async function requirePermission(
  permission: Permission,
): Promise<AuthSession> {
  const auth = await loadAuth();
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized: please sign in');
  }
  if (!hasPermission(session.user.role, permission)) {
    throw new Error(`Forbidden: requires permission '${permission}'`);
  }
  return session;
}

// ==============================================
// 4. Role helpers
// ==============================================

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

export async function hasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}