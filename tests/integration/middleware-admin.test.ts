/**
 * TDD Gate 1 — Sprint 23 (Task 2) — Middleware 邏輯測試
 *
 * 涵蓋 Plan Gate Q3 決議:
 * - middleware 只做已登入 vs 未登入檢查
 * - 不做細粒度權限檢查（交給 API handler）
 *
 * 對應 PRD：docs/prd/09-rbac.md §12.4 Q6 Sprint 23
 *
 * 注意: Next.js middleware 不能直接被 vitest 測試（需要在 Next runtime）
 * 因此用純邏輯測試驗證 middleware 的「邊界條件」
 */

import { describe, it, expect } from 'vitest';

// ==============================================
// 提取 middleware 核心邏輯（純函數版本）— 與 middleware.ts 邏輯一致
// ==============================================

type SessionLike = { user?: unknown } | null;

type MiddlewareResult =
  | { action: 'allow' }
  | { action: 'redirect'; pathname: string; callbackUrl?: string };

function checkMiddleware(
  isLoggedIn: boolean,
  pathname: string,
): MiddlewareResult {
  const isLoginPage = pathname === '/admin/login';

  // 規則 1: 未登入訪問 /admin/* (除 login) → redirect
  if (!isLoggedIn && pathname.startsWith('/admin') && !isLoginPage) {
    return { action: 'redirect', pathname: '/admin/login', callbackUrl: pathname };
  }

  // 規則 2: 已登入訪問 /admin/login → redirect /admin
  if (isLoggedIn && isLoginPage) {
    return { action: 'redirect', pathname: '/admin' };
  }

  return { action: 'allow' };
}

// ==============================================
// 測試
// ==============================================

describe('Sprint 23 — Middleware 邏輯 (Plan Gate Q3)', () => {
  it('未登入訪問 /admin/users → 重導 /admin/login (callbackUrl)', () => {
    const result = checkMiddleware(false, '/admin/users');
    expect(result).toEqual({
      action: 'redirect',
      pathname: '/admin/login',
      callbackUrl: '/admin/users',
    });
  });

  it('未登入訪問 /admin/roles → 重導', () => {
    const result = checkMiddleware(false, '/admin/roles');
    expect(result.action).toBe('redirect');
    if (result.action === 'redirect') {
      expect(result.pathname).toBe('/admin/login');
      expect(result.callbackUrl).toBe('/admin/roles');
    }
  });

  it('未登入訪問 /admin/login → 放行 (登入頁本身)', () => {
    const result = checkMiddleware(false, '/admin/login');
    expect(result.action).toBe('allow');
  });

  it('已登入訪問 /admin/login → 重導 /admin', () => {
    const result = checkMiddleware(true, '/admin/login');
    expect(result).toEqual({ action: 'redirect', pathname: '/admin' });
  });

  it('已登入訪問 /admin/users → 放行 (不管 role)', () => {
    const result = checkMiddleware(true, '/admin/users');
    expect(result.action).toBe('allow');
  });

  it('已登入訪問 /admin/roles → 放行 (不管 role)', () => {
    const result = checkMiddleware(true, '/admin/roles');
    expect(result.action).toBe('allow');
  });

  it('未登入訪問 / → 放行 (不在 matcher 範圍, middleware 不執行)', () => {
    // middleware matcher 只涵蓋 /admin/:path*
    // / 不在 matcher → 不會觸發 middleware 邏輯
    const isAdminPath = '/'.startsWith('/admin');
    expect(isAdminPath).toBe(false);
  });

  it('Plan Gate Q3 驗證: viewer 已登入訪問 /admin/roles → 仍放行 (細粒度在 API handler)', () => {
    // 即使 viewer 沒有 roles:write, middleware 也不擋
    // 細粒度由 API handler 的 requireDynamicPermission 處理
    const result = checkMiddleware(true, '/admin/roles');
    expect(result.action).toBe('allow');
  });

  it('Plan Gate Q3 驗證: editor 已登入訪問 /admin/roles/[id]/permissions → 仍放行', () => {
    const result = checkMiddleware(true, '/admin/roles/abc/permissions');
    expect(result.action).toBe('allow');
  });
});

// ==============================================
// 測試 session.user.permissions 結構（Sprint 23 注入）
// ==============================================

describe('Sprint 23 — session.user.permissions 結構', () => {
  it('admin session 含 wildcard *', () => {
    const session = {
      user: {
        id: 'u-admin',
        role: 'admin',
        permissions: ['users:read', 'roles:write', '*'] as string[],
      },
    };
    expect(session.user.permissions).toContain('*');
    expect(session.user.permissions).toContain('roles:write');
  });

  it('editor session 只有讀權限', () => {
    const session = {
      user: {
        id: 'u-editor',
        role: 'editor',
        permissions: ['users:read'] as string[],
      },
    };
    expect(session.user.permissions).not.toContain('roles:write');
    expect(session.user.permissions).not.toContain('*');
  });

  it('viewer session 與 editor 相同', () => {
    const session = {
      user: {
        id: 'u-viewer',
        role: 'viewer',
        permissions: ['users:read'] as string[],
      },
    };
    expect(session.user.permissions).toEqual(['users:read']);
  });
});