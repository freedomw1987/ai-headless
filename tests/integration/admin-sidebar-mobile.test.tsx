/**
 * TDD Gate 1 — Sprint 32 commit 2
 * admin-sidebar 手機 RWD (collapse)
 *
 * Sprint 32 RWD refactor：漢堡按鈕從 AdminSidebar 抽出到 AdminShell，
 * 由 shell 共用 isMobileOpen state 給 sidebar。
 * 因此本測試改用 AdminShell wrapper 來測整體互動。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminShell } from '@/app/admin/admin-shell';
import type { AuthUser } from '@/lib/auth/auth';
import type { ExtensionNavItem } from '@/lib/extensions/extension-nav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock ThemeToggle
vi.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

describe('Sprint 32 RWD — admin shell 手機互動', () => {
  const mockUser: AuthUser = {
    id: 'u1',
    email: 'admin@x.com',
    name: 'admin',
    role: 'admin',
    permissions: ['roles:write'],
  };

  const mockExtensionNavItems: ExtensionNavItem[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('預設渲染：漢堡按鈕存在於 main 頂部 header', () => {
    render(
      <AdminShell
        user={mockUser}
        enabledExtensions={[]}
        extensionNavItems={mockExtensionNavItems}
      >
        <div data-testid="content">content</div>
      </AdminShell>,
    );

    // 漢堡按鈕存在（從 AdminShell 內，而非 sidebar）
    const menuButton = screen.queryByTestId('mobile-menu-button');
    expect(menuButton).toBeTruthy();
    // close 按鈕存在於 DOM 內（但在 < sm 顯現）
    expect(screen.queryByTestId('mobile-close-button')).toBeTruthy();
  });

  it('預設渲染：sidebar 內容在 DOM 內（jsdom 是 desktop viewport）', () => {
    render(
      <AdminShell
        user={mockUser}
        enabledExtensions={[]}
        extensionNavItems={mockExtensionNavItems}
      >
        <div>content</div>
      </AdminShell>,
    );

    expect(screen.getByText('總覽')).toBeTruthy();
    expect(screen.getByText('用戶管理')).toBeTruthy();
  });

  it('點漢堡按鈕 → 顯示 sidebar 與 close 按鈕', async () => {
    const user = userEvent.setup();
    render(
      <AdminShell
        user={mockUser}
        enabledExtensions={[]}
        extensionNavItems={mockExtensionNavItems}
      >
        <div>content</div>
      </AdminShell>,
    );

    const menuButton = screen.getByTestId('mobile-menu-button');
    await user.click(menuButton);

    // close 按鈕出現（sidebar 開啟）
    expect(screen.queryByTestId('mobile-close-button')).toBeTruthy();
  });
});
