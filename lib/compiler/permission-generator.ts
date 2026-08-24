/**
 * ==============================================
 *  Permission Generator — JSON → RBAC
 * ==============================================
 *
 * 將 JsonSpec.permissions 轉換為 RBAC 配置：
 * - 自動推導 model 的 4 個基礎 permission
 * - 預設 3 個內建角色：admin / editor / viewer
 * - 生成 checkPermission source code
 *
 * 對應：docs/prd/03-auth.md §3
 */

import type { JsonSpec } from '@/lib/specs/json-spec.types';

// ==============================================
// 公開類型
// ==============================================

export type RBACPermission = {
  action: string;
  scope: string[];
  roles: string[];
  description?: string;
};

export type RBACRole = {
  name: string;
  label: string;
  description: string;
  permissions: string[]; // ['*'] 或 ['todo.read', 'todo.create', ...]
};

export type RBACConfig = {
  permissions: RBACPermission[];
  roles: RBACRole[];
};

export type PermissionMatrixEntry = {
  role: string;
  granted: string[]; // 該 role 擁有的所有 action
};

export type PermissionMatrix = {
  roles: string[];
  actions: string[];
  matrix: PermissionMatrixEntry[];
};

// ==============================================
// 輔助：model 名稱轉換
// ==============================================

function modelToKebab(modelName: string): string {
  return modelName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// ==============================================
// 預設角色
// ==============================================

const DEFAULT_ROLES: Omit<RBACRole, 'permissions'>[] = [
  {
    name: 'admin',
    label: '管理員',
    description: '擁有所有權限',
  },
  {
    name: 'editor',
    label: '編輯者',
    description: '可讀寫，不可刪除',
  },
  {
    name: 'viewer',
    label: '查看者',
    description: '只讀',
  },
];

// ==============================================
// 基礎 Permission 推導
// ==============================================

const BASE_OPERATIONS = ['read', 'create', 'update', 'delete'] as const;
type BaseOperation = (typeof BASE_OPERATIONS)[number];

const READ_OPERATIONS: Record<BaseOperation, string[]> = {
  read: ['list', 'read'],
  create: ['create'],
  update: ['update'],
  delete: ['delete'],
};

function inferBasePermissions(spec: JsonSpec): RBACPermission[] {
  const perms: RBACPermission[] = [];

  for (const model of spec.models) {
    const tableName = modelToKebab(model.name);

    for (const op of BASE_OPERATIONS) {
      perms.push({
        action: `${tableName}.${op}`,
        scope: READ_OPERATIONS[op],
        roles: inferRolesForOp(op),
        description: `${model.label ?? model.name} - ${op}`,
      });
    }
  }

  return perms;
}

function inferRolesForOp(op: BaseOperation): string[] {
  // 預設推導規則
  switch (op) {
    case 'read':
      return ['admin', 'editor', 'viewer'];
    case 'create':
    case 'update':
      return ['admin', 'editor'];
    case 'delete':
      return ['admin'];
  }
}

// ==============================================
// Main: generateRBACConfig
// ==============================================

export function generateRBACConfig(spec: JsonSpec): RBACConfig {
  // 1. 推導基礎 permissions
  const inferred = inferBasePermissions(spec);

  // 2. 套用 spec 顯式定義的權限（覆蓋推導）
  const explicit = spec.permissions ?? [];
  const merged: RBACPermission[] = inferred.map((inferredPerm) => {
    const explicitMatch = explicit.find((p) => p.action === inferredPerm.action);
    if (explicitMatch) {
      return {
        ...inferredPerm,
        roles: explicitMatch.roles,
      };
    }
    return inferredPerm;
  });

  // 3. 加入 spec 顯式定義但不在 inferred 中的權限
  for (const p of explicit) {
    if (!merged.some((m) => m.action === p.action)) {
      merged.push({
        action: p.action,
        scope: [],
        roles: p.roles,
        description: '',
      });
    }
  }

  // 4. 推導各角色的權限列表
  const roles = computeRolePermissions(merged);

  return {
    permissions: merged,
    roles,
  };
}

// ==============================================
// 計算各角色擁有的 permissions
// ==============================================

function computeRolePermissions(permissions: RBACPermission[]): RBACRole[] {
  return DEFAULT_ROLES.map((roleTemplate) => {
    const grants = permissions
      .filter((p) => p.roles.includes(roleTemplate.name))
      .map((p) => p.action);

    // admin 永遠獲得所有權限（萬能）
    const finalGrants = roleTemplate.name === 'admin' ? permissions.map((p) => p.action) : grants;

    return {
      ...roleTemplate,
      permissions: finalGrants,
    };
  });
}

// ==============================================
// Permission Matrix
// ==============================================

export function generatePermissionMatrix(spec: JsonSpec): PermissionMatrix {
  const rbac = generateRBACConfig(spec);
  const actions = rbac.permissions.map((p) => p.action);
  const roles = rbac.roles.map((r) => r.name);

  const matrix: PermissionMatrixEntry[] = rbac.roles.map((role) => {
    let granted: string[];
    if (role.permissions.includes('*')) {
      granted = actions;
    } else {
      granted = role.permissions;
    }
    return { role: role.name, granted };
  });

  return {
    roles,
    actions,
    matrix,
  };
}

// ==============================================
// generateCheckPermissionSource
// ==============================================

export function generateCheckPermissionSource(spec: JsonSpec): string {
  const rbac = generateRBACConfig(spec);
  const matrix = generatePermissionMatrix(spec);

  // 序列化為 TS 模組
  const configLiteral = JSON.stringify(
    {
      permissions: rbac.permissions,
      roles: rbac.roles,
      matrix: matrix.matrix,
    },
    null,
    2,
  );

  return `// 此文件由 ai-headless 自動生成
// 不要手動修改！修改請改 JsonSpec，重新編譯

import type { Session } from 'next-auth';

export const RBAC_CONFIG = ${configLiteral} as const;

export type RBACRole = (typeof RBAC_CONFIG.roles)[number]['name'];

/**
 * 檢查用戶是否擁有指定權限
 * @param user 用戶物件（含 role）
 * @param action 例：'todo.read'
 * @returns boolean
 */
export async function checkPermission(
  user: { role?: string; id?: string } | null | undefined,
  action: string,
): Promise<boolean> {
  if (!user) return false;

  // admin 萬能
  if (user.role === 'admin') return true;

  // 查表
  const roleEntry = RBAC_CONFIG.matrix.find((m) => m.role === user.role);
  if (!roleEntry) return false;

  return roleEntry.granted.includes(action);
}

/**
 * 拋出 403（用於 API routes）
 */
export function requirePermission(
  user: { role?: string; id?: string } | null | undefined,
  action: string,
): void {
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (user.role === 'admin') return;

  const roleEntry = RBAC_CONFIG.matrix.find((m) => m.role === user.role);
  if (!roleEntry || !roleEntry.granted.includes(action)) {
    throw new Error('FORBIDDEN: ' + action);
  }
}

/**
 * 取得用戶所有 permissions
 */
export function getUserPermissions(role: string): string[] {
  if (role === 'admin') {
    return RBAC_CONFIG.permissions.map((p) => p.action);
  }
  const roleEntry = RBAC_CONFIG.matrix.find((m) => m.role === role);
  return roleEntry?.granted ?? [];
}
`;
}