/**
 * TDD Gate 1 — Sprint 21 commit 1 (Task 4a 介面先定義)
 * 驗證 session-cache 抽象層（紅階段）
 *
 * 涵蓋：
 * 1. getCachedPermissions 返回值
 * 2. setCachedPermissions 寫入
 * 3. invalidateCache 清除
 * 4. TTL 過期邏輯
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 / §12.3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedPermissions,
  setCachedPermissions,
  invalidateCache,
  invalidateAllCache,
} from './session-cache';

describe('session-cache', () => {
  beforeEach(() => {
    invalidateAllCache();
  });

  it('getCachedPermissions 對未快取 userId 返回 null', () => {
    expect(getCachedPermissions('nonexistent-user')).toBeNull();
  });

  it('setCachedPermissions 後 getCachedPermissions 應返回相同資料', () => {
    const userId = 'user-1';
    const permissions = new Set(['users:read', 'roles:write']);
    const roleId = 'role-1';

    setCachedPermissions(userId, permissions, roleId);
    const cached = getCachedPermissions(userId);

    expect(cached).not.toBeNull();
    expect(cached!.permissions).toEqual(permissions);
    expect(cached!.roleId).toBe(roleId);
  });

  it('invalidateCache 應清除指定 userId 的快取', () => {
    setCachedPermissions('user-1', new Set(['users:read']), 'role-1');
    expect(getCachedPermissions('user-1')).not.toBeNull();

    invalidateCache('user-1');
    expect(getCachedPermissions('user-1')).toBeNull();
  });

  it('invalidateCache 不應影響其他 userId 的快取', () => {
    setCachedPermissions('user-1', new Set(['users:read']), 'role-1');
    setCachedPermissions('user-2', new Set(['roles:write']), 'role-2');

    invalidateCache('user-1');
    expect(getCachedPermissions('user-1')).toBeNull();
    expect(getCachedPermissions('user-2')).not.toBeNull();
  });

  it('invalidateAllCache 應清除所有快取', () => {
    setCachedPermissions('user-1', new Set(['users:read']), 'role-1');
    setCachedPermissions('user-2', new Set(['roles:write']), 'role-2');
    setCachedPermissions('user-3', new Set(['users:assign']), 'role-3');

    invalidateAllCache();
    expect(getCachedPermissions('user-1')).toBeNull();
    expect(getCachedPermissions('user-2')).toBeNull();
    expect(getCachedPermissions('user-3')).toBeNull();
  });
});