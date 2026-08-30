/**
 * TD-911b — permission code 同時接受 : 和 . 兩種格式
 *
 * Bug：Zod regex 只接受 resource:action 格式（colon）
 *      但 Sprint 21 之前的 extension manifest 用 blog.create 格式（dot）
 *      結果點 blog.create 會驗證失敗
 *
 * 修法：regex 同時接受 `^[a-z][a-z0-9_]*[:.][a-z][a-z0-9_]*$`
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    role: { findUnique: vi.fn() },
    permission: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(async (cb) => cb({
      permission: { deleteMany: vi.fn(), createMany: vi.fn() },
    })),
  },
}));

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(async () => ({
    user: { id: 'admin-id', email: 'admin@test.com', role: 'admin', permissions: ['roles:write'] },
  })),
}));

vi.mock('@/lib/auth/dynamic-permission', () => ({
  requireDynamicPermission: vi.fn(async () => undefined),
}));

vi.mock('@/lib/auth/session-cache', () => ({
  invalidateAllCache: vi.fn(),
}));

beforeEach(async () => {
  vi.clearAllMocks();
  const dbModule = await import('@/lib/db');
  vi.mocked(dbModule.db.role.findUnique).mockResolvedValue({
    id: 'role-1',
    name: 'custom',
    isSystem: false,
  } as never);
});

describe('TD-911b — permission code 接受 : 和 . 兩種格式', () => {
  it('blog.create (dot format) 應被接受', async () => {
    const { PATCH } = await import('@/app/api/admin/roles/[id]/permissions/route');
    const req = new Request('http://test/api/admin/roles/role-1/permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: ['blog.create'] }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'role-1' }) });
    expect(res.status).toBe(200);
  });

  it('users:read (colon format) 應被接受', async () => {
    const { PATCH } = await import('@/app/api/admin/roles/[id]/permissions/route');
    const req = new Request('http://test/api/admin/roles/role-1/permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: ['users:read'] }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'role-1' }) });
    expect(res.status).toBe(200);
  });

  it('混合 dot + colon 兩種格式都接受', async () => {
    const { PATCH } = await import('@/app/api/admin/roles/[id]/permissions/route');
    const req = new Request('http://test/api/admin/roles/role-1/permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: ['users:read', 'blog.create', 'order.delete'] }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'role-1' }) });
    expect(res.status).toBe(200);
  });
});