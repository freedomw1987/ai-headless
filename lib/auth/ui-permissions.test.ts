/**
 * TDD Gate 1 — Sprint 24 (Plan Gate Q1-Q4 決議)
 * 驗證 UI 條件渲染 helper (hasUIPermission + useHasUIPermission)
 *
 * 涵蓋:
 * 1. 含 '*' (admin wildcard) → 任何 code 都 true
 * 2. 含明確 code → 該 code true
 * 3. 無相關 code → false
 * 4. 空 permissions 陣列 → false
 * 5. permissions 為 undefined → false
 * 6. 多個 permissions 部分匹配
 *
 * 對應 PRD：docs/prd/09-rbac.md §12.4 Q6 Sprint 24
 */

import { describe, it, expect } from 'vitest';
import { hasUIPermission } from './ui-permissions';

describe('hasUIPermission — UI 條件渲染 helper (純函數)', () => {
  it('permissions 含 "*" → 任何 code 都返回 true', () => {
    expect(hasUIPermission(['*'], 'roles:write')).toBe(true);
    expect(hasUIPermission(['*'], 'any:thing:here')).toBe(true);
  });

  it('permissions 含明確 code → 該 code 返回 true', () => {
    expect(hasUIPermission(['users:read', 'roles:write'], 'roles:write')).toBe(true);
    expect(hasUIPermission(['users:read'], 'users:read')).toBe(true);
  });

  it('permissions 無相關 code → false', () => {
    expect(hasUIPermission(['users:read'], 'roles:write')).toBe(false);
    expect(hasUIPermission(['users:read'], 'blog:create')).toBe(false);
  });

  it('空 permissions 陣列 → false', () => {
    expect(hasUIPermission([], 'roles:write')).toBe(false);
    expect(hasUIPermission([], '*')).toBe(false);
  });

  it('permissions 為 undefined → false (向後相容)', () => {
    expect(hasUIPermission(undefined, 'roles:write')).toBe(false);
    expect(hasUIPermission(undefined, '*')).toBe(false);
  });

  it('permissions 為 null → false', () => {
    expect(hasUIPermission(null, 'roles:write')).toBe(false);
  });

  it('permissions 含 "*" + 其他 codes → 都 true (wildcard 優先)', () => {
    expect(hasUIPermission(['*', 'users:read'], 'roles:write')).toBe(true);
    expect(hasUIPermission(['users:read', '*'], 'blog:create')).toBe(true);
  });

  it('多個 permissions 部分匹配 → 部分 true', () => {
    const perms = ['users:read', 'roles:read', 'blog:create'];
    expect(hasUIPermission(perms, 'users:read')).toBe(true);
    expect(hasUIPermission(perms, 'roles:read')).toBe(true);
    expect(hasUIPermission(perms, 'blog:create')).toBe(true);
    expect(hasUIPermission(perms, 'users:write')).toBe(false);
    expect(hasUIPermission(perms, 'roles:write')).toBe(false);
  });

  it('session 結構模擬: admin session 完整權限', () => {
    const adminSession = {
      user: {
        id: 'u1',
        email: 'admin@x.com',
        role: 'admin',
        permissions: [
          'users:read',
          'users:write',
          'users:assign',
          'roles:read',
          'roles:write',
          '*',
        ],
      },
    };

    expect(hasUIPermission(adminSession.user.permissions, 'roles:write')).toBe(true);
    expect(hasUIPermission(adminSession.user.permissions, 'blog:moderate')).toBe(true);
  });

  it('session 結構模擬: editor session 唯讀權限', () => {
    const editorSession = {
      user: {
        id: 'u2',
        email: 'editor@x.com',
        role: 'editor',
        permissions: ['users:read'],
      },
    };

    expect(hasUIPermission(editorSession.user.permissions, 'users:read')).toBe(true);
    expect(hasUIPermission(editorSession.user.permissions, 'roles:write')).toBe(false);
    expect(hasUIPermission(editorSession.user.permissions, 'blog:create')).toBe(false);
  });

  it('session 結構模擬: 舊 JWT 沒有 permissions 欄位 (向後相容)', () => {
    const oldJwtSession = {
      user: {
        id: 'u3',
        email: 'old@x.com',
        role: 'admin',
        // 無 permissions 欄位 (Sprint 23 之前)
      },
    };

    // 即使 role=admin,沒有 permissions → false (向後相容但不安全)
    // 安全模型: 舊 JWT 視為無 permissions,需重新登入拿新 JWT
    expect(hasUIPermission(
      (oldJwtSession.user as { permissions?: string[] }).permissions,
      'roles:write',
    )).toBe(false);
  });
});