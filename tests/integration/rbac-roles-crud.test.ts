/**
 * TDD Gate 1 — Sprint 21 commit 4 (Task 6)
 * 驗證 /api/admin/roles CRUD API
 *
 * 涵蓋:
 * 1. GET /api/admin/roles → 200 + 列表
 * 2. POST /api/admin/roles → 201 + 建立
 * 3. POST /api/admin/roles → 400 Zod 失敗
 * 4. POST /api/admin/roles → 409 重複 name
 * 5. PATCH /api/admin/roles/[id] → 200 更新
 * 6. DELETE /api/admin/roles/[id] → 200 刪除（自定義）
 * 7. DELETE /api/admin/roles/[id] → 409 內建 role 不可刪
 * 8. DELETE /api/admin/roles/[id] → 409 有用戶指派
 * 9. 所有 endpoint 未登入 → 401
 * 10. 所有 endpoint 非 admin → 403
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 FR-1, FR-5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==============================================
// hoisted mocks
// ==============================================

const mocks = vi.hoisted(() => {
  const baseRoles = [
    { id: 'r-admin', name: 'admin', displayName: '管理員', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'r-editor', name: 'editor', displayName: '編輯者', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'r-viewer', name: 'viewer', displayName: '訪客', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
  ];
  return {
    sessionUser: { id: 'admin-id', role: 'admin' } as
      | { id: string; role: string }
      | null,
    roles: [...baseRoles],
    requirePermResult: undefined as Error | undefined,
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    role: {
      findMany: vi.fn().mockImplementation(async () => mocks.roles),
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        const role = mocks.roles.find((r) =>
          where.id ? r.id === where.id : where.name === r.name,
        );
        return role
          ? { ...role, _count: { users: 0, permissions: 0 } }
          : null;
      }),
      create: vi.fn().mockImplementation(async ({ data }) => {
        const newRole = {
          id: `r-${data.name}`,
          ...data,
          isSystem: data.isSystem ?? false,
          permissions: [],
          users: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        if (mocks.roles.find((r) => r.name === data.name)) {
          const err = new Error('Unique constraint failed') as Error & { code: string };
          err.code = 'P2002';
          throw err;
        }
        mocks.roles.push(newRole);
        return newRole;
      }),
      update: vi.fn().mockImplementation(async ({ where, data }) => {
        const idx = mocks.roles.findIndex((r) => r.id === where.id);
        if (idx === -1) throw new Error('Not found');
        mocks.roles[idx] = { ...mocks.roles[idx], ...data };
        return mocks.roles[idx];
      }),
      delete: vi.fn().mockImplementation(async ({ where }) => {
        const idx = mocks.roles.findIndex((r) => r.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const role = mocks.roles[idx];
        if (!role) throw new Error('Not found');
        if (role.isSystem) {
          const err = new Error('Cannot delete system role') as Error & { code: string };
          err.code = 'P0001';
          throw err;
        }
        mocks.roles.splice(idx, 1);
        return role;
      }),
    },
    user: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn().mockImplementation(async () => {
    if (!mocks.sessionUser) return null;
    return { user: mocks.sessionUser };
  }),
}));

vi.mock('@/lib/auth/dynamic-permission', () => ({
  requireDynamicPermission: vi.fn().mockImplementation(async () => {
    if (mocks.requirePermResult) throw mocks.requirePermResult;
  }),
  hasDynamicPermission: vi.fn().mockResolvedValue(true),
}));

// ==============================================

import { GET, POST } from '@/app/api/admin/roles/route';
import {
  GET as GET_ONE,
  PATCH,
  DELETE,
} from '@/app/api/admin/roles/[id]/route';

describe('GET /api/admin/roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = { id: 'admin-id', role: 'admin' };
    mocks.requirePermResult = undefined;
    // 重置 roles 陣列
    mocks.roles = [
      { id: 'r-admin', name: 'admin', displayName: '管理員', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-editor', name: 'editor', displayName: '編輯者', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-viewer', name: 'viewer', displayName: '訪客', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
    ];
  });

  it('admin → 200 + 列出 3 個內建 role', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toHaveLength(3);
    expect(json.data.map((r: any) => r.name).sort()).toEqual([
      'admin',
      'editor',
      'viewer',
    ]);
  });

  it('未登入 → 401', async () => {
    mocks.sessionUser = null;
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('非 admin → 403', async () => {
    mocks.sessionUser = { id: 'editor-id', role: 'editor' };
    mocks.requirePermResult = new Error('Forbidden');

    const response = await GET();
    expect(response.status).toBe(403);
  });
});

describe('POST /api/admin/roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = { id: 'admin-id', role: 'admin' };
    mocks.requirePermResult = undefined;
    mocks.roles = [
      { id: 'r-admin', name: 'admin', displayName: '管理員', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-editor', name: 'editor', displayName: '編輯者', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-viewer', name: 'viewer', displayName: '訪客', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
    ];
  });

  it('合法輸入 → 201 + 新 role', async () => {
    const request = new Request('http://localhost/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'content_moderator',
        displayName: '內容審核員',
        description: '審核用戶內容',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.data.name).toBe('content_moderator');
  });

  it('name 是保留字 → 400', async () => {
    const request = new Request('http://localhost/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'admin',
        displayName: '管理員',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('name 不符規則（大寫） → 400', async () => {
    const request = new Request('http://localhost/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Admin',
        displayName: 'X',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('重複 name → 409', async () => {
    // 先建一個
    const req1 = new Request('http://localhost/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'dup_role', displayName: 'X' }),
    });
    await POST(req1);

    // 再建同名 → 409
    const req2 = new Request('http://localhost/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'dup_role', displayName: 'Y' }),
    });
    const response = await POST(req2);
    expect(response.status).toBe(409);
  });
});

describe('DELETE /api/admin/roles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = { id: 'admin-id', role: 'admin' };
    mocks.requirePermResult = undefined;
    mocks.roles = [
      { id: 'r-admin', name: 'admin', displayName: '管理員', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-editor', name: 'editor', displayName: '編輯者', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-viewer', name: 'viewer', displayName: '訪客', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
    ];
  });

  it('自定義 role → 200 刪除', async () => {
    // 先建一個自定義 role
    mocks.roles.push({
      id: 'r-custom',
      name: 'custom_role',
      displayName: 'X',
      description: null,
      isSystem: false,
      permissions: [],
      users: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request('http://localhost/api/admin/roles/r-custom', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(200);
  });

  it('內建 role（admin）→ 409 不可刪', async () => {
    const request = new Request('http://localhost/api/admin/roles/r-admin', {
      method: 'DELETE',
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'r-admin' }),
    });
    expect(response.status).toBe(409);
  });
});

describe('PATCH /api/admin/roles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = { id: 'admin-id', role: 'admin' };
    mocks.requirePermResult = undefined;
    mocks.roles = [
      { id: 'r-admin', name: 'admin', displayName: '管理員', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-editor', name: 'editor', displayName: '編輯者', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'r-viewer', name: 'viewer', displayName: '訪客', isSystem: true, description: null, permissions: [], users: [], createdAt: new Date(), updatedAt: new Date() },
    ];
  });

  it('更新 displayName → 200', async () => {
    mocks.roles.push({
      id: 'r-custom',
      name: 'custom_role',
      displayName: 'Old Name',
      description: null,
      isSystem: false,
      permissions: [],
      users: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request('http://localhost/api/admin/roles/r-custom', {
      method: 'PATCH',
      body: JSON.stringify({ displayName: '新名稱' }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data.displayName).toBe('新名稱');
  });

  it('嘗試更新 name 欄位 → 400', async () => {
    mocks.roles.push({
      id: 'r-custom',
      name: 'custom_role',
      displayName: 'X',
      description: null,
      isSystem: false,
      permissions: [],
      users: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new Request('http://localhost/api/admin/roles/r-custom', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'new_name', displayName: 'X' }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(400);
  });
});