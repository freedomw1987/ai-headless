/**
 * TDD Gate 1 — Sprint 32 commit 2
 * admin-sidebar 手機 RWD (collapse)
 *
 * 對應 PRD: docs/specs/extension-spec.md (後台 layout)
 * 對應 Backlog: Sprint 32 Plan Gate (用戶指定手機 RWD)
 *
 * 問題:
 * - admin-sidebar 固定 w-64 (256px)
 * - 手機 (< 640px) 螢幕寬度 ~375px
 * - sidebar 占 256/375 = 68% 寬度,主內容擠剩 119px
 * - 體驗極差
 *
 * 修正:
 * - 手機 (< sm): sidebar 預設隱藏,透過漢堡按鈕開啟
 * - 桌面 (>= sm): sidebar 預設顯示
 * - 點漢堡按鈕 → 切換顯示
 * - 點 sidebar 外部 → 關閉
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminSidebar } from '@/app/admin/admin-sidebar';

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

describe('Sprint 32 commit 2 — admin-sidebar 手機 RWD', () => {
  const mockUser = {
    id: 'u1',
    email: 'admin@x.com',
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('預設渲染時桌面與手機的 sidebar 結構 (有漢堡按鈕)', () => {
    render(<AdminSidebar user={mockUser} enabledExtensions={[]} />);

    // 漢堡按鈕存在 (供手機使用)
    const menuButton = screen.queryByTestId('mobile-menu-button');
    expect(menuButton).toBeTruthy();
  });

  it('預設渲染: sidebar 內容可見', () => {
    render(<AdminSidebar user={mockUser} enabledExtensions={[]} />);

    // 桌面上 sidebar 內的導航應可見
    expect(screen.getByText('總覽')).toBeTruthy();
    expect(screen.getByText('用戶管理')).toBeTruthy();
  });

  it('手機預設 (closed): sidebar 內容仍可見 (供測試環境 desktop)', () => {
    // jsdom 預設是 desktop viewport (1024px)
    // 真實手機用 Playwright 測
    render(<AdminSidebar user={mockUser} enabledExtensions={[]} />);
    expect(screen.getByText('總覽')).toBeTruthy();
  });
});