/**
 * TDD Gate 1 — Sprint 21 commit 1
 * 驗證 RBAC seed 結構正確性（紅階段）
 *
 * 涵蓋：
 * 1. BUILTIN_ROLES 結構（admin / editor / viewer + isSystem + displayName）
 * 2. BUILTIN_PERMISSIONS_BY_ROLE 矩陣完整性
 * 3. PermissionCode 常數命名規範
 * 4. 內建 role 必須有對應 permissions entry
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3
 */

import { describe, it, expect } from 'vitest';
import {
  BUILTIN_ROLES,
  BUILTIN_PERMISSIONS_BY_ROLE,
} from './seed-rbac';
import { PermissionCode } from '../lib/auth/permissions';

describe('BUILTIN_ROLES', () => {
  it('應包含 admin / editor / viewer 三個內建 role', () => {
    const names = BUILTIN_ROLES.map((r) => r.name);
    expect(names).toContain('admin');
    expect(names).toContain('editor');
    expect(names).toContain('viewer');
  });

  it('內建 role 都應標記 isSystem=true', () => {
    BUILTIN_ROLES.forEach((role) => {
      expect(role.isSystem).toBe(true);
    });
  });

  it('內建 role 必須有 displayName', () => {
    BUILTIN_ROLES.forEach((role) => {
      expect(role.displayName).toBeTruthy();
      expect(role.displayName.length).toBeGreaterThan(0);
    });
  });

  it('內建 role 必須有 description', () => {
    BUILTIN_ROLES.forEach((role) => {
      expect(role.description).toBeTruthy();
      expect(role.description.length).toBeGreaterThan(0);
    });
  });

  it('內建 role 數量應為 3 個', () => {
    expect(BUILTIN_ROLES).toHaveLength(3);
  });
});

describe('PermissionCode', () => {
  it('應為 resource:action 格式（ADMIN_WILDCARD 除外）', () => {
    Object.values(PermissionCode).forEach((code) => {
      // ADMIN_WILDCARD '*' 不符合 resource:action 格式,單獨跳過
      if (code === PermissionCode.ADMIN_WILDCARD) return;
      expect(code).toMatch(/^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/);
    });
  });

  it('ADMIN_WILDCARD 應為 "*" 字串', () => {
    expect(PermissionCode.ADMIN_WILDCARD).toBe('*');
  });

  it('應包含核心 permissions：users:assign / roles:write', () => {
    expect(PermissionCode.USERS_ASSIGN).toBe('users:assign');
    expect(PermissionCode.ROLES_WRITE).toBe('roles:write');
  });
});

describe('BUILTIN_PERMISSIONS_BY_ROLE', () => {
  it('每個內建 role 都應有對應 permissions entry', () => {
    BUILTIN_ROLES.forEach((role) => {
      const perms = BUILTIN_PERMISSIONS_BY_ROLE[role.name];
      expect(perms).toBeDefined();
      expect(perms!.length).toBeGreaterThan(0);
    });
  });

  it('admin 應擁有所有權限（含萬能 wildcard *）', () => {
    const adminPerms = BUILTIN_PERMISSIONS_BY_ROLE['admin'];
    expect(adminPerms).toContain('*');
    expect(adminPerms).toContain(PermissionCode.USERS_ASSIGN);
    expect(adminPerms).toContain(PermissionCode.ROLES_WRITE);
  });

  it('editor 應有讀權限，無寫權限', () => {
    const editorPerms = BUILTIN_PERMISSIONS_BY_ROLE['editor'];
    expect(editorPerms).toContain(PermissionCode.USERS_READ);
    expect(editorPerms).not.toContain(PermissionCode.ROLES_WRITE);
    expect(editorPerms).not.toContain(PermissionCode.USERS_ASSIGN);
  });

  it('viewer 應僅有讀權限', () => {
    const viewerPerms = BUILTIN_PERMISSIONS_BY_ROLE['viewer'];
    expect(viewerPerms).toContain(PermissionCode.USERS_READ);
    expect(viewerPerms).not.toContain(PermissionCode.ROLES_WRITE);
    expect(viewerPerms).not.toContain(PermissionCode.USERS_ASSIGN);
  });
});