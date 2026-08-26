/**
 * TDD Gate 1 — Sprint 21 commit 3 (Task 4c)
 * 驗證 POST /api/admin/cache/invalidate API
 *
 * 涵蓋:
 * 1. 未登入 → 401
 * 2. 非 admin → 403
 * 3. admin → 200 + invalidate 全部
 * 4. 指定 userId → invalidate 該用戶
 * 5. 不指定 userId → invalidate 全部
 *
 * 對應 PRD：docs/prd/09-rbac.md §5.3 FR-5.x / §12.3 Q5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/cache/invalidate/route';

// ==============================================
// hoisted mocks
// ==============================================

const mocks = vi.hoisted(() => {
  return {
    sessionUser: { id: 'admin-id', role: 'admin' } as
      | { id: string; role: string }
      | null,
    invalidateAll: vi.fn(),
    invalidateOne: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db: {} }));

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn().mockImplementation(async () => {
    if (!mocks.sessionUser) return null;
    return { user: mocks.sessionUser };
  }),
}));

vi.mock('@/lib/auth/dynamic-permission', () => ({
  hasDynamicPermission: vi.fn().mockResolvedValue(true),
  requireDynamicPermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/auth/session-cache', () => ({
  invalidateCache: mocks.invalidateOne,
  invalidateAllCache: mocks.invalidateAll,
}));

// ==============================================

describe('POST /api/admin/cache/invalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = { id: 'admin-id', role: 'admin' };
  });

  it('未登入 → 401 Unauthorized', async () => {
    mocks.sessionUser = null;

    const request = new Request('http://localhost/api/admin/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('非 admin → 403 Forbidden', async () => {
    mocks.sessionUser = { id: 'editor-id', role: 'editor' };
    const permModule = await import('@/lib/auth/dynamic-permission');
    (permModule.requireDynamicPermission as any).mockRejectedValueOnce(
      new Error('Forbidden: requires permission \'*\''),
    );

    const request = new Request('http://localhost/api/admin/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('admin 不指定 userId → 200 + invalidate 全部', async () => {
    const request = new Request('http://localhost/api/admin/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.invalidateAll).toHaveBeenCalledTimes(1);
    expect(mocks.invalidateOne).not.toHaveBeenCalled();
  });

  it('admin 指定 userId → 200 + invalidate 該用戶', async () => {
    const request = new Request('http://localhost/api/admin/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ userId: 'target-user-id' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.invalidateOne).toHaveBeenCalledWith('target-user-id');
    expect(mocks.invalidateAll).not.toHaveBeenCalled();
  });

  it('無效 JSON body → 400 Bad Request', async () => {
    const request = new Request('http://localhost/api/admin/cache/invalidate', {
      method: 'POST',
      body: 'not-json',
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});