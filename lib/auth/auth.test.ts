/**
 * TDD Gate 1 — Auth.js v5 整合測試
 *
 * 涵蓋：
 * 1. RBAC 權限檢查（hasPermission / checkPermission / requirePermission）
 * 2. Session 工具（getCurrentUser / requireUser）
 * 3. Role-based 權限矩陣（admin / editor / viewer）
 * 4. 整合進 api-generator 生成的代碼可正常運作
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  // 動態 import 用 — 在 mock 後重新加載
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkPermission,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requirePermission,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCurrentUser,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  requireUser,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasRole,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isAdmin,
  type Permission,
} from './auth';

// ==============================================
// 1. RBAC — hasPermission
// ==============================================

describe('hasPermission', () => {
  it('admin 角色擁有所有權限', () => {
    expect(hasPermission('admin', 'post.create')).toBe(true);
    expect(hasPermission('admin', 'post.delete')).toBe(true);
    expect(hasPermission('admin', 'user.manage')).toBe(true);
  });

  it('editor 角色可寫不能管理用戶', () => {
    expect(hasPermission('editor', 'post.create')).toBe(true);
    expect(hasPermission('editor', 'post.update')).toBe(true);
    expect(hasPermission('editor', 'post.delete')).toBe(true);
    expect(hasPermission('editor', 'user.manage')).toBe(false);
  });

  it('viewer 角色只能讀', () => {
    expect(hasPermission('viewer', 'post.read')).toBe(true);
    expect(hasPermission('viewer', 'post.create')).toBe(false);
    expect(hasPermission('viewer', 'post.update')).toBe(false);
  });

  it('查詢無對應權限字串時返回 false', () => {
    expect(hasPermission('viewer', 'unknown.permission' as Permission)).toBe(false);
  });
});

// ==============================================
// 2. RBAC — hasAnyPermission / hasAllPermissions
// ==============================================

describe('hasAnyPermission / hasAllPermissions', () => {
  it('hasAnyPermission 任一符合即返回 true', () => {
    expect(hasAnyPermission('editor', ['post.create', 'user.manage'])).toBe(true);
    expect(hasAnyPermission('viewer', ['user.manage', 'post.manage'])).toBe(false);
  });

  it('hasAllPermissions 全部符合才返回 true', () => {
    expect(hasAllPermissions('admin', ['post.create', 'user.manage'])).toBe(true);
    expect(hasAllPermissions('editor', ['post.create', 'user.manage'])).toBe(false);
  });
});

// ==============================================
// 3. Session 工具
// ==============================================

describe('Session utilities', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('getCurrentUser 在有 session 時返回 user', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue({
        user: { id: 'u1', email: 'a@b.com', role: 'admin' },
      }),
    }));

    const { getCurrentUser } = await import('./auth');
    const user = await getCurrentUser();
    expect(user).toEqual({ id: 'u1', email: 'a@b.com', role: 'admin' });
  });

  it('getCurrentUser 在無 session 時返回 null', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }));

    const { getCurrentUser } = await import('./auth');
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('requireUser 在無 session 時拋出錯誤', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }));

    const { requireUser } = await import('./auth');
    await expect(requireUser()).rejects.toThrow(/Unauthorized/);
  });
});

// ==============================================
// 4. checkPermission / requirePermission
// ==============================================

describe('checkPermission / requirePermission', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('checkPermission 權限不足拋出錯誤', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue({
        user: { id: 'u1', role: 'viewer' },
      }),
    }));

    const { checkPermission } = await import('./auth');
    await expect(checkPermission('post.create')).rejects.toThrow(/Forbidden/);
  });

  it('checkPermission 權限足夠通過', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue({
        user: { id: 'u1', role: 'admin' },
      }),
    }));

    const { checkPermission } = await import('./auth');
    await expect(checkPermission('post.create')).resolves.toBeUndefined();
  });

  it('requirePermission 返回 session', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue({
        user: { id: 'u1', role: 'editor' },
      }),
    }));

    const { requirePermission } = await import('./auth');
    const session = await requirePermission('post.create');
    expect(session.user.role).toBe('editor');
  });
});

// ==============================================
// 5. Role helpers
// ==============================================

describe('Role helpers', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('isAdmin 正確判斷', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue({
        user: { id: 'u1', role: 'admin' },
      }),
    }));
    const { isAdmin } = await import('./auth');
    expect(await isAdmin()).toBe(true);

    vi.resetModules();
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue({
        user: { id: 'u1', role: 'editor' },
      }),
    }));
    const { isAdmin: isAdmin2 } = await import('./auth');
    expect(await isAdmin2()).toBe(false);
  });

  it('hasRole 檢查特定角色', async () => {
    vi.doMock('./config', () => ({
      auth: vi.fn().mockResolvedValue({
        user: { id: 'u1', role: 'editor' },
      }),
    }));
    const { hasRole } = await import('./auth');
    expect(await hasRole('editor')).toBe(true);
    expect(await hasRole('admin')).toBe(false);
  });
});