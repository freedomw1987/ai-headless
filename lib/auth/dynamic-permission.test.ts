/**
 * TDD Gate 1 — Sprint 21 commit 2 (Task 4b)
 * 驗證 hasDynamicPermission 動態函式（紅階段）
 *
 * 涵蓋：
 * 1. 基本正確性：admin → 查 DB → 有 roles:write
 * 2. 快取命中：第二次呼叫不走 DB
 * 3. 快取失效：invalidate 後重查 DB
 * 4. Admin wildcard：'*' 字串永遠 true
 * 5. 非 admin 沒權限：editor → roles:write = false
 * 6. 未登入：拋出 Unauthorized
 * 7. viewer 只讀：無 roles:write
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 / §12.3 Q5 / §12.4 Q6
 *
 * 測試策略：mock prisma（不真實 DB）+ mock auth() session
 */

// ==============================================
// 1. hoisted mocks（vi.mock factory 內不能引用外部變數，需用 vi.hoisted）
// ==============================================

const mocks = vi.hoisted(() => {
  return {
    prisma: {
      permission: { findMany: vi.fn() },
      user: { findUnique: vi.fn() },
    },
    sessionUser: { id: 'user-admin', role: 'admin' },
    authResolved: { value: null as { user: { id: string; role: string } } | null },
  };
});

vi.mock('@/lib/db', () => ({
  db: mocks.prisma,
}));

vi.mock('./config', () => ({
  auth: vi.fn().mockImplementation(async () => mocks.authResolved.value),
}));

// import 放在最上方（vi.mock / vi.hoisted 雖然會 hoist,但 TS 仍要看到頂層 import）
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasDynamicPermission } from './dynamic-permission';
import { invalidateAllCache } from './session-cache';
import { PermissionCode } from './permissions';

describe('hasDynamicPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateAllCache();
    mocks.sessionUser.id = 'user-admin';
    mocks.sessionUser.role = 'admin';
    mocks.authResolved.value = { user: mocks.sessionUser };
    mocks.prisma.user.findUnique.mockResolvedValue({
      roleId: 'role-admin-id',
      roleRef: {
        id: 'role-admin-id',
        permissions: [{ code: 'roles:write' }, { code: 'users:read' }],
      },
    });
  });

  it('admin 有 roles:write 權限（查 DB 命中）', async () => {
    const result = await hasDynamicPermission(PermissionCode.ROLES_WRITE);
    expect(result).toBe(true);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('admin 即使 DB 沒該 permission 也返回 true（wildcard *）', async () => {
    // admin role 從 DB 拿到 wildcard '*',即使請求的 code 不存在也返回 true
    mocks.prisma.user.findUnique.mockResolvedValue({
      roleId: 'role-admin-id',
      roleRef: {
        id: 'role-admin-id',
        permissions: [{ code: 'users:read' }, { code: '*' }],
      },
    });

    const result = await hasDynamicPermission('nonexistent:permission');
    expect(result).toBe(true);
  });

  it('admin 從 DB 拿到 wildcard "*" → 任何 permission 通過', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      roleId: 'role-admin-id',
      roleRef: {
        id: 'role-admin-id',
        permissions: [{ code: '*' }],
      },
    });

    expect(await hasDynamicPermission('anything:here')).toBe(true);
    expect(await hasDynamicPermission(PermissionCode.ROLES_WRITE)).toBe(true);
  });

  it('editor 沒有 roles:write 返回 false', async () => {
    mocks.sessionUser.id = 'user-editor';
    mocks.sessionUser.role = 'editor';
    mocks.authResolved.value = { user: mocks.sessionUser };

    mocks.prisma.user.findUnique.mockResolvedValue({
      roleId: 'role-editor-id',
      roleRef: {
        id: 'role-editor-id',
        permissions: [{ code: 'users:read' }],
      },
    });

    const result = await hasDynamicPermission(PermissionCode.ROLES_WRITE);
    expect(result).toBe(false);
  });

  it('viewer 只有讀權限，無 roles:write / users:assign', async () => {
    mocks.sessionUser.id = 'user-viewer';
    mocks.sessionUser.role = 'viewer';
    mocks.authResolved.value = { user: mocks.sessionUser };

    mocks.prisma.user.findUnique.mockResolvedValue({
      roleId: 'role-viewer-id',
      roleRef: {
        id: 'role-viewer-id',
        permissions: [{ code: 'users:read' }],
      },
    });

    expect(await hasDynamicPermission(PermissionCode.USERS_READ)).toBe(true);
    expect(await hasDynamicPermission(PermissionCode.ROLES_WRITE)).toBe(false);
    expect(await hasDynamicPermission(PermissionCode.USERS_ASSIGN)).toBe(false);
  });

  it('第二次呼叫走快取（不查 DB）', async () => {
    await hasDynamicPermission(PermissionCode.ROLES_WRITE); // 1st: 查 DB
    await hasDynamicPermission(PermissionCode.ROLES_WRITE); // 2nd: 走快取
    await hasDynamicPermission(PermissionCode.ROLES_WRITE); // 3rd: 走快取

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('invalidateAllCache 後重查 DB', async () => {
    await hasDynamicPermission(PermissionCode.ROLES_WRITE);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);

    invalidateAllCache();

    await hasDynamicPermission(PermissionCode.ROLES_WRITE);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(2);
  });

  it('未登入（auth() 返回 null）拋出 Unauthorized', async () => {
    mocks.authResolved.value = null;

    await expect(hasDynamicPermission(PermissionCode.ROLES_WRITE)).rejects.toThrow(
      /Unauthorized/,
    );
  });

  it('用戶無 roleRef（roleId 未對應）返回 false', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      roleId: 'unmapped',
      roleRef: null,
    });

    const result = await hasDynamicPermission(PermissionCode.ROLES_WRITE);
    expect(result).toBe(false);
  });
});