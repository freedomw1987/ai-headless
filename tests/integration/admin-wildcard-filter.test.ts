/**
 * TD-911 — * admin wildcard 不應列為可選 permission 守護測試
 *
 * Bug 根因（Sprint 31+ 用戶回報）：
 * - 用戶在 role 矩陣點了 `*` row（admin wildcard）
 * - API 把 `*` 當一般權限存進 DB
 * - 之後矩陣 UI 顯示怪 row（resource=*, label=*, code=*）
 *
 * 修法（3 層防禦）：
 * 1. GET /api/admin/permissions 過濾 `*`
 * 2. PATCH /api/admin/roles/[id]/permissions 拒絕 `*`
 * 3. 前端矩陣 UI 不渲染 `*` row
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db — 包含 * 萬能 wildcard 在內的多個 permission codes
const mockPermissions = [
  { code: '*' },           // ← 應該被過濾
  { code: 'users:read' },
  { code: 'users:write' },
  { code: 'roles:read' },
  { code: 'roles:write' },
  { code: 'blog:create' },
];

vi.mock('@/lib/db', () => ({
  db: {
    permission: {
      findMany: vi.fn(async () => mockPermissions),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => cb({
      permission: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    })),
  },
}));

const mockSession = {
  user: {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'admin',
    permissions: ['roles:write'],
  },
};

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(async () => mockSession),
}));

vi.mock('@/lib/auth/dynamic-permission', () => ({
  requireDynamicPermission: vi.fn(async () => undefined),
}));

vi.mock('@/lib/auth/session-cache', () => ({
  invalidateAllCache: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TD-911 — * wildcard 過濾', () => {
  describe('GET /api/admin/permissions', () => {
    it('回傳的 permissions 必須過濾掉 * (admin wildcard)', async () => {
      const { GET } = await import('@/app/api/admin/permissions/route');
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      // 必須不包含 *
      expect(json.data).not.toContainEqual(expect.objectContaining({ code: '*' }));
      // 仍包含其他正常的 permissions
      expect(json.data).toContainEqual(expect.objectContaining({ code: 'users:read' }));
      expect(json.data).toContainEqual(expect.objectContaining({ code: 'roles:write' }));
    });
  });

  describe('PATCH /api/admin/roles/[id]/permissions', () => {
    it('拒絕儲存 * (admin wildcard)', async () => {
      // mock role 存在且非系統
      const dbModule = await import('@/lib/db');
      vi.mocked(dbModule.db.role.findUnique).mockResolvedValueOnce({
        id: 'role-1',
        name: 'custom',
        isSystem: false,
      } as never);

      const { PATCH } = await import('@/app/api/admin/roles/[id]/permissions/route');
      const req = new Request('http://test/api/admin/roles/role-1/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: ['users:read', '*'] }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'role-1' }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/wildcard|\*/i);
    });

    it('正常 permissions 仍可儲存', async () => {
      // mock role 非系統
      const dbModule = await import('@/lib/db');
      vi.mocked(dbModule.db.role.findUnique).mockResolvedValueOnce({
        id: 'role-1',
        name: 'custom',
        isSystem: false,
      } as never);

      const { PATCH } = await import('@/app/api/admin/roles/[id]/permissions/route');
      const req = new Request('http://test/api/admin/roles/role-1/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: ['users:read', 'users:write'] }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: 'role-1' }) });
      expect(res.status).toBe(200);
    });
  });

  describe('前端矩陣 UI source-code guard', () => {
    it('matrix-page-client 不應渲染 * row', () => {
      const fs = require('node:fs');
      const source = fs.readFileSync(
        'app/admin/roles/[id]/permissions/matrix-page-client.tsx',
        'utf-8',
      );
      // 必須過濾掉 * wildcard（避免顯示為一般權限）
      expect(source).toMatch(/filter|filter\(\)\s*\(/);
      // 檢查過濾條件包含 '*'
      expect(source).toMatch(/'\*'|"\*"|PermissionCode\.ADMIN_WILDCARD/);
    });
  });
});