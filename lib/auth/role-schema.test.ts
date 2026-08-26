/**
 * TDD Gate 1 — Sprint 21 commit 4 (Task 5)
 * 驗證 Role Zod schema
 *
 * 涵蓋:
 * 1. name 規則: ^[a-z][a-z0-9_]{0,31}$
 * 2. 預留保留字: admin / editor / viewer 不能用作自定義 role
 * 3. displayName 必填
 * 4. description 可選
 * 5. createRoleSchema / updateRoleSchema 差異
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 / FR-3.x
 */

import { describe, it, expect } from 'vitest';
import {
  createRoleSchema,
  updateRoleSchema,
  RESERVED_ROLE_NAMES,
} from './role-schema';

describe('RESERVED_ROLE_NAMES', () => {
  it('應包含 admin / editor / viewer', () => {
    expect(RESERVED_ROLE_NAMES).toContain('admin');
    expect(RESERVED_ROLE_NAMES).toContain('editor');
    expect(RESERVED_ROLE_NAMES).toContain('viewer');
  });
});

describe('createRoleSchema', () => {
  it('合法 name + displayName → 通過', () => {
    const result = createRoleSchema.safeParse({
      name: 'content_moderator',
      displayName: '內容審核員',
      description: '審核用戶內容',
    });
    expect(result.success).toBe(true);
  });

  it('合法 name（最短 a）→ 通過', () => {
    const result = createRoleSchema.safeParse({
      name: 'a',
      displayName: 'a',
    });
    expect(result.success).toBe(true);
  });

  it('name 太長（>32 字）→ 拒絕', () => {
    const result = createRoleSchema.safeParse({
      name: 'a'.repeat(33),
      displayName: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('name 32 字（剛好）→ 通過', () => {
    const result = createRoleSchema.safeParse({
      name: 'a'.repeat(32),
      displayName: 'X',
    });
    expect(result.success).toBe(true);
  });

  it('name 以數字開頭 → 拒絕', () => {
    const result = createRoleSchema.safeParse({
      name: '123_admin',
      displayName: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('name 含大寫字母 → 拒絕', () => {
    const result = createRoleSchema.safeParse({
      name: 'Admin',
      displayName: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('name 含 hyphen → 拒絕', () => {
    const result = createRoleSchema.safeParse({
      name: 'content-moderator',
      displayName: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('name 是保留字 admin → 拒絕', () => {
    const result = createRoleSchema.safeParse({
      name: 'admin',
      displayName: '管理員',
    });
    expect(result.success).toBe(false);
  });

  it('name 是保留字 viewer → 拒絕', () => {
    const result = createRoleSchema.safeParse({
      name: 'viewer',
      displayName: '訪客',
    });
    expect(result.success).toBe(false);
  });

  it('缺少 displayName → 拒絕', () => {
    const result = createRoleSchema.safeParse({
      name: 'custom_role',
    });
    expect(result.success).toBe(false);
  });

  it('description 可省略', () => {
    const result = createRoleSchema.safeParse({
      name: 'custom_role',
      displayName: '自定義',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateRoleSchema', () => {
  it('只更新 displayName → 通過（name 不可更新）', () => {
    const result = updateRoleSchema.safeParse({
      displayName: '新名稱',
      description: '新描述',
    });
    expect(result.success).toBe(true);
  });

  it('包含 name 欄位 → 拒絕（name 不可透過 update 改）', () => {
    const result = updateRoleSchema.safeParse({
      name: 'new_name',
      displayName: 'X',
    });
    expect(result.success).toBe(false);
  });

  it('空物件 → 拒絕（至少要有一個欄位）', () => {
    const result = updateRoleSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});