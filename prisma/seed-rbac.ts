/**
 * ==============================================
 *  Sprint 21 — RBAC Seed (US-102 Phase 2)
 * ==============================================
 *
 * 建立內建 3 個 role + 對應 permissions（idempotent）
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 *
 * 用法：
 *   import { seedRBAC } from './seed-rbac';
 *   await seedRBAC(db);
 *
 * 關鍵設計：
 * 1. Idempotent：upsert + roleId_code compound unique → 重跑不會報錯
 * 2. Permission 常數集中：跨 seed 與 lib/auth/permissions.ts 共用
 * 3. Admin 萬能 wildcard '*'：保留 Phase 1 行為
 * 4. 型別安全：Record<string, readonly PermissionCode[]> 確保拼字正確
 */

import type { PrismaClient } from '@prisma/client';
import { PermissionCode } from '../lib/auth/permissions';

// ==============================================
// 1. Permission Code 常數（集中所有 resource:action 字串）
// ==============================================
// 本檔從 lib/auth/permissions.ts 引入（單一 source of truth）後使用
// 外部使用方請 import 自 lib/auth/permissions.ts
// 這裡不重複 export，避免 TypeScript duplicate identifier 問題

// ==============================================
// 2. 內建 3 個 Role
// ==============================================
// 使用 fixed IDs (sys_* 前缀) 以與 baseline migration 對齊
// 這確保 baseline migrate-deploy 與 runtime seedRBAC() 產生一致狀態

export const BUILTIN_ROLES = [
  {
    id: 'sys_role_admin',
    name: 'admin',
    displayName: '管理員',
    description: '擁有所有權限，可管理 roles 與 users',
    isSystem: true,
  },
  {
    id: 'sys_role_editor',
    name: 'editor',
    displayName: '編輯者',
    description: '可讀 users，不可改 roles',
    isSystem: true,
  },
  {
    id: 'sys_role_viewer',
    name: 'viewer',
    displayName: '訪客',
    description: '唯讀',
    isSystem: true,
  },
] as const;

// ==============================================
// 3. 內建 Role 預設權限
// ==============================================

export const BUILTIN_PERMISSIONS_BY_ROLE: Record<
  string,
  readonly (PermissionCode | '*')[]
> = {
  admin: [
    PermissionCode.USERS_READ,
    PermissionCode.USERS_WRITE,
    PermissionCode.USERS_ASSIGN,
    PermissionCode.ROLES_READ,
    PermissionCode.ROLES_WRITE,
    // Phase 2 MVP：admin 仍靠萬能 wildcard 相容（避免 Phase 3+ 新增 permission 時需 seed）
    PermissionCode.ADMIN_WILDCARD,
  ],
  editor: [PermissionCode.USERS_READ],
  viewer: [PermissionCode.USERS_READ],
};

// ==============================================
// 4. Idempotent Seed 函式
// ==============================================

export async function seedRBAC(db: PrismaClient): Promise<void> {
  await seedRoles(db);
  await seedPermissions(db);
}

async function seedRoles(db: PrismaClient): Promise<void> {
  for (const role of BUILTIN_ROLES) {
    await db.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
  }
  console.log(`✅ Seeded ${BUILTIN_ROLES.length} roles`);
}

async function seedPermissions(db: PrismaClient): Promise<void> {
  let totalCount = 0;

  for (const roleName of Object.keys(BUILTIN_PERMISSIONS_BY_ROLE)) {
    const role = await db.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role '${roleName}' not found. Run seedRoles first.`);
    }

    const codes = BUILTIN_PERMISSIONS_BY_ROLE[roleName];
    if (!codes) continue;

    for (const code of codes) {
      await db.permission.upsert({
        where: { roleId_code: { roleId: role.id, code } },
        update: {},
        create: { roleId: role.id, code },
      });
      totalCount++;
    }
  }

  console.log(`✅ Seeded ${totalCount} permissions`);
}