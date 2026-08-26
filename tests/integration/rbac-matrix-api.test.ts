/**
 * TDD Gate 1 — Sprint 21 commit 5 (Task 7)
 * 驗證 PATCH /api/admin/roles/[id]/permissions 矩陣 API
 *
 * 涵蓋:
 * 1. 完整替換矩陣（PUT 語意）→ 200 + 刪除舊的 + 新增
 * 2. 內建 role 矩陣唯讀 → 409
 * 3. 未登入 → 401
 * 4. 非 admin → 403
 * 5. 無效 JSON → 400
 * 6. permissions 為空陣列 → 200 (清空)
 * 7. 部分失敗時 transaction rollback（測試概念）
 * 8. 更新後 invalidateAllCache
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 FR-2 + FR-5.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==============================================
// hoisted mocks
// ==============================================

const mocks = vi.hoisted(() => {
  return {
    sessionUser: { id: 'admin-id', role: 'admin' } as
      | { id: string; role: string }
      | null,
    requirePermError: undefined as Error | undefined,
    invalidateAll: vi.fn(),
    transactionCalls: [] as unknown[],
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    role: {
      findUnique: vi.fn().mockImplementation(async ({ where, include }) => {
        if (where.id === 'r-admin') {
          return {
            id: 'r-admin',
            name: 'admin',
            isSystem: true,
            permissions: [{ code: '*' }],
          };
        }
        if (where.id === 'r-custom') {
          return {
            id: 'r-custom',
            name: 'content_moderator',
            isSystem: false,
            permissions: [],
          };
        }
        return null;
      }),
    },
    $transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        permission: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          createMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
      };
      mocks.transactionCalls.push({ type: 'transaction', tx });
      return await callback(tx);
    }),
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
    if (mocks.requirePermError) throw mocks.requirePermError;
  }),
}));

vi.mock('@/lib/auth/session-cache', () => ({
  invalidateAllCache: mocks.invalidateAll,
  invalidateCache: vi.fn(),
}));

// ==============================================

import { PATCH } from '@/app/api/admin/roles/[id]/permissions/route';

describe('PATCH /api/admin/roles/[id]/permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = { id: 'admin-id', role: 'admin' };
    mocks.requirePermError = undefined;
    mocks.transactionCalls = [];
  });

  it('admin 更新自定義 role 矩陣 → 200 + transaction', async () => {
    const request = new Request('http://localhost/api/admin/roles/r-custom/permissions', {
      method: 'PATCH',
      body: JSON.stringify({
        permissions: ['users:read', 'roles:read', 'blog:read'],
      }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });

    expect(response.status).toBe(200);
    expect(mocks.transactionCalls).toHaveLength(1);
    expect(mocks.invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('permissions 為空陣列 → 200（清空矩陣）', async () => {
    const request = new Request('http://localhost/api/admin/roles/r-custom/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ permissions: [] }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(200);
  });

  it('內建 role（admin） → 409 不可改', async () => {
    const request = new Request('http://localhost/api/admin/roles/r-admin/permissions', {
      method: 'PATCH',
      body: JSON.stringify({
        permissions: ['users:read'],
      }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-admin' }),
    });
    expect(response.status).toBe(409);
  });

  it('不存在 role → 404', async () => {
    const request = new Request('http://localhost/api/admin/roles/r-notfound/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ permissions: [] }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-notfound' }),
    });
    expect(response.status).toBe(404);
  });

  it('未登入 → 401', async () => {
    mocks.sessionUser = null;
    const request = new Request('http://localhost/api/admin/roles/r-custom/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ permissions: [] }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(401);
  });

  it('非 admin → 403', async () => {
    mocks.sessionUser = { id: 'editor-id', role: 'editor' };
    mocks.requirePermError = new Error('Forbidden');

    const request = new Request('http://localhost/api/admin/roles/r-custom/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ permissions: [] }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(403);
  });

  it('無效 JSON → 400', async () => {
    const request = new Request('http://localhost/api/admin/roles/r-custom/permissions', {
      method: 'POST', // 故意錯
      body: 'not-json',
    });
    const response = await PATCH(request as any, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(400);
  });

  it('permissions 不是陣列 → 400', async () => {
    const request = new Request('http://localhost/api/admin/roles/r-custom/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ permissions: 'not-array' }),
    });
    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'r-custom' }),
    });
    expect(response.status).toBe(400);
  });
});