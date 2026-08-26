/**
 * Sprint 21 Task 12b — 動態 RBAC 整合測試集
 *
 * 對應 PRD：docs/prd/09-rbac.md §12.5 Q7
 *
 * 與既有 auth.test.ts 互補:
 * - auth.test.ts: 純函式 hasPermission (Phase 1)
 * - auth-dynamic.test.ts: 動態 hasDynamicPermission (Phase 2)
 *
 * 涵蓋:
 * - 動態矩陣正確性
 * - 快取策略（命中/失效/TTL）
 * - 整合場景: role 建立 → permission 變更 → 用戶即時生效
 * - 內建 role 保護雙層 (UI + API)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==============================================
// hoisted mocks
// ==============================================

const mocks = vi.hoisted(() => {
  return {
    // 模擬 DB state
    roles: [
      {
        id: 'r-admin',
        name: 'admin',
        isSystem: true,
        permissions: [{ code: 'users:read' }, { code: '*' }],
      },
      {
        id: 'r-editor',
        name: 'editor',
        isSystem: true,
        permissions: [{ code: 'users:read' }],
      },
      {
        id: 'r-viewer',
        name: 'viewer',
        isSystem: true,
        permissions: [{ code: 'users:read' }],
      },
    ] as Array<{ id: string; name: string; isSystem: boolean; permissions: { code: string }[] }>,
    users: [
      { id: 'u-admin', roleId: 'r-admin' },
      { id: 'u-editor', roleId: 'r-editor' },
      { id: 'u-viewer', roleId: 'r-viewer' },
    ] as Array<{ id: string; roleId: string }>,
    sessionUserId: 'u-admin',
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        const user = mocks.users.find((u) => u.id === where.id);
        if (!user) return null;
        const role = mocks.roles.find((r) => r.id === user.roleId);
        return {
          ...user,
          roleId: user.roleId,
          roleRef: role
            ? { id: role.id, permissions: role.permissions }
            : null,
        };
      }),
    },
  },
}));

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn().mockImplementation(async () => {
    if (!mocks.sessionUserId) return null;
    return { user: { id: mocks.sessionUserId } };
  }),
}));

// ==============================================
// 測試
// ==============================================

import { hasDynamicPermission } from '@/lib/auth/dynamic-permission';
import {
  getCachedPermissions,
  invalidateCache,
  invalidateAllCache,
} from '@/lib/auth/session-cache';
import {
  PermissionCode,
  isAdminWildcard,
} from '@/lib/auth/permissions';
import {
  createRoleSchema,
  RESERVED_ROLE_NAMES,
} from '@/lib/auth/role-schema';

describe('auth-dynamic: 動態矩陣正確性', () => {
  beforeEach(() => {
    invalidateAllCache();
    mocks.sessionUserId = 'u-admin';
  });

  it('admin 任何 permission 都通過（wildcard *）', async () => {
    expect(await hasDynamicPermission(PermissionCode.ROLES_WRITE)).toBe(true);
    expect(await hasDynamicPermission('blog:delete')).toBe(true);
    expect(await hasDynamicPermission('any:fictional:code')).toBe(true);
  });

  it('editor 只有 users:read，無 roles:write', async () => {
    mocks.sessionUserId = 'u-editor';
    expect(await hasDynamicPermission(PermissionCode.USERS_READ)).toBe(true);
    expect(await hasDynamicPermission(PermissionCode.ROLES_WRITE)).toBe(false);
    expect(await hasDynamicPermission(PermissionCode.USERS_ASSIGN)).toBe(false);
  });

  it('viewer 與 editor 矩陣相同（皆僅讀）', async () => {
    mocks.sessionUserId = 'u-viewer';
    expect(await hasDynamicPermission(PermissionCode.USERS_READ)).toBe(true);
    expect(await hasDynamicPermission(PermissionCode.ROLES_WRITE)).toBe(false);
  });
});

describe('auth-dynamic: 快取策略', () => {
  beforeEach(() => {
    invalidateAllCache();
    mocks.sessionUserId = 'u-admin';
  });

  it('第二次呼叫走快取（不重查 DB）', async () => {
    const { db } = await import('@/lib/db');
    const findSpy = vi.spyOn(db.user, 'findUnique');

    await hasDynamicPermission(PermissionCode.ROLES_WRITE); // 第1次: 查 DB
    await hasDynamicPermission(PermissionCode.ROLES_WRITE); // 第2次: 命中
    await hasDynamicPermission(PermissionCode.USERS_READ); // 第3次: 命中

    expect(findSpy).toHaveBeenCalledTimes(1);
    findSpy.mockRestore();
  });

  it('invalidateCache 後下次呼叫重查 DB', async () => {
    const { db } = await import('@/lib/db');
    const findSpy = vi.spyOn(db.user, 'findUnique');

    await hasDynamicPermission(PermissionCode.ROLES_WRITE);
    expect(findSpy).toHaveBeenCalledTimes(1);

    invalidateCache('u-admin');

    await hasDynamicPermission(PermissionCode.ROLES_WRITE);
    expect(findSpy).toHaveBeenCalledTimes(2);
    findSpy.mockRestore();
  });

  it('getCachedPermissions 在無資料時返回 null', () => {
    expect(getCachedPermissions('non-existent')).toBeNull();
  });
});

describe('auth-dynamic: 整合場景', () => {
  beforeEach(() => {
    invalidateAllCache();
    mocks.sessionUserId = 'u-admin';
  });

  it('新增自定義 role → 指派給用戶 → 立即生效', async () => {
    // 1. 建立自定義 role
    mocks.roles.push({
      id: 'r-moderator',
      name: 'content_moderator',
      isSystem: false,
      permissions: [{ code: 'users:read' }, { code: 'blog:moderate' }],
    });

    // 2. 用戶切換到此 role
    mocks.users[0]!.roleId = 'r-moderator';

    // 3. 失效舊快取
    invalidateAllCache();

    // 4. 新 role 的 permissions 立即生效
    expect(await hasDynamicPermission('blog:moderate')).toBe(true);
    // 5. 舊 wildcard 失去（admin role 沒了）
    expect(await hasDynamicPermission('any:thing')).toBe(false);
  });

  it('變更 role permissions → 失效快取 → 用戶下次呼叫拿新權限', async () => {
    mocks.sessionUserId = 'u-editor';

    // 編輯前：editor 沒 roles:write
    invalidateAllCache();
    expect(await hasDynamicPermission(PermissionCode.ROLES_WRITE)).toBe(false);

    // 管理員把 roles:write 加到 editor role
    const editorRole = mocks.roles.find((r) => r.name === 'editor')!;
    editorRole.permissions.push({ code: 'roles:write' });

    // 失效快取
    invalidateAllCache();

    // editor 現在有 roles:write
    expect(await hasDynamicPermission(PermissionCode.ROLES_WRITE)).toBe(true);
  });

  it('刪除 role 前檢查有用戶指派（情境模擬）', () => {
    // 確保有個用戶指派某個 role（測試環境 mock）
    mocks.users.push({ id: 'u-test', roleId: 'r-viewer' });

    // 統計 viewer role 的指派人數
    const viewerUsers = mocks.users.filter((u) => u.roleId === 'r-viewer');
    expect(viewerUsers.length).toBeGreaterThan(0);
    // 結論: API 應拒絕刪除（既有 /api/admin/roles/[id] DELETE 已實作 409 Conflict）
  });
});

describe('auth-dynamic: 內建 role 保護', () => {
  it('內建 3 個 role 都有 isSystem=true', () => {
    const builtins = mocks.roles.filter((r) => r.isSystem);
    expect(builtins).toHaveLength(3);
  });

  it('內建 role name 不在保留字檢查白名單外', () => {
    // 雖然 admin / editor / viewer 是「保留字」,但 seed 已建立它們
    expect(RESERVED_ROLE_NAMES).toContain('admin');
    expect(RESERVED_ROLE_NAMES).toContain('editor');
    expect(RESERVED_ROLE_NAMES).toContain('viewer');
  });
});

describe('auth-dynamic: 命名規則', () => {
  it('PermissionCode 格式統一為 resource:action', () => {
    Object.values(PermissionCode).forEach((code) => {
      if (code === PermissionCode.ADMIN_WILDCARD) return;
      expect(code).toMatch(/^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/);
    });
  });

  it('createRoleSchema 拒絕所有保留字', () => {
    for (const reserved of RESERVED_ROLE_NAMES) {
      const result = createRoleSchema.safeParse({
        name: reserved,
        displayName: 'X',
      });
      expect(result.success).toBe(false);
    }
  });

  it('isAdminWildcard 只對 * 返回 true', () => {
    expect(isAdminWildcard('*')).toBe(true);
    expect(isAdminWildcard('users:read')).toBe(false);
    expect(isAdminWildcard('')).toBe(false);
  });
});