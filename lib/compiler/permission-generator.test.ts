/**
 * TDD Gate 1 — Permission Generator 測試
 *
 * Permission Generator 將 JsonSpec.permissions 轉換為 RBAC 配置：
 * - 自動推導 model 的 4 個基礎 permission（read/create/update/delete）
 * - 支援顯式 permission 定義
 * - 生成 checkPermission source code
 * - 預設角色：admin / editor / viewer
 */

import { describe, it, expect } from 'vitest';
import {
  generateRBACConfig,
  generatePermissionMatrix,
  generateCheckPermissionSource,
} from './permission-generator';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

describe('generateRBACConfig', () => {
  describe('自動推導基礎 permissions', () => {
    it('為每個 model 推導 4 個基礎 permission（read/create/update/delete）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const rbac = generateRBACConfig(spec);

      expect(rbac.permissions).toContainEqual(
        expect.objectContaining({ action: 'todo.read' }),
      );
      expect(rbac.permissions).toContainEqual(
        expect.objectContaining({ action: 'todo.create' }),
      );
      expect(rbac.permissions).toContainEqual(
        expect.objectContaining({ action: 'todo.update' }),
      );
      expect(rbac.permissions).toContainEqual(
        expect.objectContaining({ action: 'todo.delete' }),
      );
    });

    it('多 model 都生成對應 permission', () => {
      const spec: JsonSpec = {
        name: 'blog',
        label: 'Blog',
        models: [
          { name: 'Post', fields: [{ name: 'title', type: 'string' }] },
          { name: 'Category', fields: [{ name: 'name', type: 'string' }] },
        ],
      };

      const rbac = generateRBACConfig(spec);

      expect(rbac.permissions.length).toBeGreaterThanOrEqual(8);
      expect(rbac.permissions.some((p) => p.action === 'post.read')).toBe(true);
      expect(rbac.permissions.some((p) => p.action === 'category.read')).toBe(true);
    });
  });

  describe('顯式 permission 設定', () => {
    it('尊重 spec 顯式定義的 permissions', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
        permissions: [
          { action: 'todo.create', roles: ['admin', 'editor'] },
          { action: 'todo.delete', roles: ['admin'] },
        ],
      };

      const rbac = generateRBACConfig(spec);

      const createPerm = rbac.permissions.find((p) => p.action === 'todo.create');
      expect(createPerm?.roles).toEqual(['admin', 'editor']);

      const deletePerm = rbac.permissions.find((p) => p.action === 'todo.delete');
      expect(deletePerm?.roles).toEqual(['admin']);
    });

    it('未顯式定義的 permission 用預設 roles', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
        permissions: [
          { action: 'todo.create', roles: ['editor'] }, // 自訂
        ],
      };

      const rbac = generateRBACConfig(spec);

      const readPerm = rbac.permissions.find((p) => p.action === 'todo.read');
      expect(readPerm).toBeDefined(); // 自動生成
    });
  });

  describe('預設角色', () => {
    it('生成 3 個預設角色：admin / editor / viewer', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const rbac = generateRBACConfig(spec);

      expect(rbac.roles).toContainEqual(
        expect.objectContaining({ name: 'admin' }),
      );
      expect(rbac.roles).toContainEqual(
        expect.objectContaining({ name: 'editor' }),
      );
      expect(rbac.roles).toContainEqual(
        expect.objectContaining({ name: 'viewer' }),
      );
    });

    it('admin 角色擁有任何 permission（萬能）', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const rbac = generateRBACConfig(spec);
      const adminRole = rbac.roles.find((r) => r.name === 'admin');

      // admin 拿到所有 action
      const allActions = rbac.permissions.map((p) => p.action);
      for (const action of allActions) {
        expect(adminRole?.permissions).toContain(action);
      }
    });

    it('viewer 只有 read 權限', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const rbac = generateRBACConfig(spec);
      const viewerRole = rbac.roles.find((r) => r.name === 'viewer');

      const hasRead = viewerRole?.permissions.some((p) => p.endsWith('.read'));
      const hasCreate = viewerRole?.permissions.some((p) => p.endsWith('.create'));
      const hasDelete = viewerRole?.permissions.some((p) => p.endsWith('.delete'));

      expect(hasRead).toBe(true);
      expect(hasCreate).toBe(false);
      expect(hasDelete).toBe(false);
    });
  });

  describe('Permission 推導規則', () => {
    it('read/write permission 包含 list 與 read', () => {
      const spec: JsonSpec = {
        name: 'todo',
        label: '待辦',
        models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
      };

      const rbac = generateRBACConfig(spec);

      const readPerm = rbac.permissions.find((p) => p.action === 'todo.read');
      expect(readPerm?.scope).toContain('list');
      expect(readPerm?.scope).toContain('read');
    });
  });
});

describe('generatePermissionMatrix', () => {
  it('生成 role × action 的矩陣碼', () => {
    const spec: JsonSpec = {
      name: 'todo',
      label: '待辦',
      models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
    };

    const matrix = generatePermissionMatrix(spec);

    // 矩陣應該包含所有角色 × 所有 actions
    expect(matrix.roles).toContain('admin');
    expect(matrix.roles).toContain('editor');
    expect(matrix.roles).toContain('viewer');
    expect(matrix.actions).toContain('todo.read');
    expect(matrix.actions).toContain('todo.create');

    // 矩陣應包含 admin 為全部權限
    const adminRow = matrix.matrix.find((m) => m.role === 'admin');
    expect(adminRow?.granted).toContain('todo.read');
    expect(adminRow?.granted).toContain('todo.create');
  });

  it('editor 有 read + write，沒有 delete', () => {
    const spec: JsonSpec = {
      name: 'todo',
      label: '待辦',
      models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
    };

    const matrix = generatePermissionMatrix(spec);
    const editorRow = matrix.matrix.find((m) => m.role === 'editor');

    expect(editorRow?.granted).toContain('todo.read');
    expect(editorRow?.granted).toContain('todo.create');
    expect(editorRow?.granted).not.toContain('todo.delete');
  });
});

describe('generateCheckPermissionSource', () => {
  it('生成 checkPermission source code', () => {
    const spec: JsonSpec = {
      name: 'todo',
      label: '待辦',
      models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
    };

    const code = generateCheckPermissionSource(spec);

    expect(code).toContain('export');
    expect(code).toContain('checkPermission');
    expect(code).toContain('role');
  });

  it('source code 引用 RBAC_CONFIG', () => {
    const spec: JsonSpec = {
      name: 'todo',
      label: '待辦',
      models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
    };

    const code = generateCheckPermissionSource(spec);

    expect(code).toContain('RBAC_CONFIG');
  });

  it('source code 包含 admin shortcut（role=admin 直接通過）', () => {
    const spec: JsonSpec = {
      name: 'todo',
      label: '待辦',
      models: [{ name: 'Todo', fields: [{ name: 'title', type: 'string' }] }],
    };

    const code = generateCheckPermissionSource(spec);

    expect(code).toMatch(/admin/i);
  });
});