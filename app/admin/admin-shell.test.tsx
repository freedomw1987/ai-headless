/**
 * AdminShell — CSRF init guard (Sprint 57 R4 揭露)
 *
 * 揭露問題：Sprint 57 R4 CSRF 保護只在 register-form 初始化 csrf-token cookie，
 * 其他所有 admin POST (settings/users/blog) 都會 403。
 *
 * 修法：admin-shell mount 時呼叫 ensureCsrfToken() 設 cookie。
 *
 * 測試策略：mock 子組件（避免 side effect），mock api-client 的 ensureCsrfToken，
 * 驗證 AdminShell mount 觸發一次 ensureCsrfToken。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { AuthUser } from '@/lib/auth/auth';

// Mock 所有子組件 + 外部依賴（避免 render 時牽連 sidebar / fab / dialog）
vi.mock('./admin-sidebar', () => ({
  AdminSidebar: () => <div data-testid="mock-sidebar" />,
}));
vi.mock('./_components/admin-fab', () => ({
  AdminFab: () => <div data-testid="mock-fab" />,
}));
vi.mock('./_components/admin-chat-dialog', () => ({
  AdminChatDialog: () => <div data-testid="mock-chat-dialog" />,
}));
vi.mock('lucide-react', () => ({
  Menu: () => <span data-testid="mock-menu-icon" />,
}));

// Mock api-client — 確保 ensureCsrfToken 是可觀察的副作用
// 用 vi.hoisted 讓 mock 變數能從 factory 外部存取
const { ensureCsrfTokenMock } = vi.hoisted(() => ({
  ensureCsrfTokenMock: vi.fn(),
}));
vi.mock('@/lib/api-client', () => ({
  ensureCsrfToken: ensureCsrfTokenMock,
  apiFetch: vi.fn(),
  CSRF_COOKIE_NAME_EXPORT: 'csrf-token',
  CSRF_HEADER_NAME_EXPORT: 'x-csrf-token',
}));

// Import AdminShell AFTER mocks（vitest hoisting 規則）
import { AdminShell } from './admin-shell';

const mockUser: AuthUser = {
  id: 'user-1',
  email: 'admin@ai-headless.local',
  role: 'admin',
};

describe('AdminShell — CSRF initialization', () => {
  beforeEach(() => {
    ensureCsrfTokenMock.mockClear();
  });

  it('mount 時應呼叫 ensureCsrfToken 一次（設 csrf cookie 給後續 POST 用）', () => {
    render(
      <AdminShell
        user={mockUser}
        enabledExtensions={[]}
        extensionNavItems={[]}
      >
        <div>content</div>
      </AdminShell>,
    );
    expect(ensureCsrfTokenMock).toHaveBeenCalledTimes(1);
  });

  it('unmount 不會再次觸發 ensureCsrfToken（只在 mount 時）', () => {
    const { unmount } = render(
      <AdminShell
        user={mockUser}
        enabledExtensions={[]}
        extensionNavItems={[]}
      >
        <div>content</div>
      </AdminShell>,
    );
    expect(ensureCsrfTokenMock).toHaveBeenCalledTimes(1);
    unmount();
    // unmount 後 mock.calls 數量應保持 1，不會自動再呼叫
    expect(ensureCsrfTokenMock).toHaveBeenCalledTimes(1);
  });
});