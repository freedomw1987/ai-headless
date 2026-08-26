/**
 * TDD Gate 1 — Sprint 22 TD-6: GET /api/admin/permissions
 * 列出所有已被任何 role 使用的 permission codes（用於矩陣 UI）
 *
 * 涵蓋:
 * 1. 未登入 → 401
 * 2. 非 admin → 403
 * 3. admin → 200 + 列出所有 distinct codes
 * 4. 自動分組: 由 code 解析 resource (e.g. users:read → Users)
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 + Sprint 22 TD-6
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
    permissionCodes: [
      'users:read',
      'users:write',
      'users:assign',
      'roles:read',
      'roles:write',
      'blog:write',
      'blog:delete',
      'event:moderate',
    ] as string[],
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    permission: {
      findMany: vi.fn().mockImplementation(async () => {
        // 返回每個 code 一次（distinct）
        const uniqueCodes = Array.from(new Set(mocks.permissionCodes));
        return uniqueCodes.map((code) => ({ code }));
      }),
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
    if (mocks.requirePermError) throw mocks.requirePermError;
  }),
}));

// ==============================================

import { GET } from '@/app/api/admin/permissions/route';

describe('GET /api/admin/permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = { id: 'admin-id', role: 'admin' };
    mocks.requirePermError = undefined;
    mocks.permissionCodes = [
      'users:read',
      'users:write',
      'users:assign',
      'roles:read',
      'roles:write',
      'blog:write',
      'blog:delete',
      'event:moderate',
    ];
  });

  it('admin → 200 + 列出所有 codes (含 extension permissions)', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data.length).toBeGreaterThanOrEqual(8);

    const codes = json.data.map((p: { code: string }) => p.code);
    expect(codes).toContain('users:read');
    expect(codes).toContain('blog:write');
    expect(codes).toContain('event:moderate');
  });

  it('自動分組: blog → Blog resource', async () => {
    const response = await GET();
    const json = await response.json();

    const blogPerm = json.data.find((p: { code: string }) => p.code === 'blog:write');
    expect(blogPerm?.resource).toBe('Blog');
  });

  it('自動分組: users → Users resource', async () => {
    const response = await GET();
    const json = await response.json();

    const userPerm = json.data.find((p: { code: string }) => p.code === 'users:read');
    expect(userPerm?.resource).toBe('Users');
  });

  it('未登入 → 401', async () => {
    mocks.sessionUser = null;
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('非 admin → 403', async () => {
    mocks.sessionUser = { id: 'editor-id', role: 'editor' };
    mocks.requirePermError = new Error('Forbidden');

    const response = await GET();
    expect(response.status).toBe(403);
  });

  it('空 DB → 200 + 空陣列', async () => {
    mocks.permissionCodes = [];
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toEqual([]);
  });

  it('distinct: 重複 code 不會重複出現', async () => {
    mocks.permissionCodes = [
      'users:read',
      'users:read',
      'blog:write',
      'blog:write',
      'blog:write',
    ];
    const response = await GET();
    const json = await response.json();
    expect(json.data.length).toBe(2);
  });
});