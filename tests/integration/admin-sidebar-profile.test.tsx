/**
 * Sprint 29-2 — UserProfile 美化測試 (Sprint 29-2 redesign)
 *
 * 設計（用戶選定 A 方案）：
 * - Avatar 40px + name + email + role badge
 * - 下方：3 個 icon-only 按鈕在一行（設定 / Theme / 登出）
 * - 每個 icon 按鈕有 tooltip（a11y）
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '@/app/admin/user-profile';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

const adminUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  image: null as string | null,
  role: 'admin' as const,
};

const userWithImage = {
  ...adminUser,
  image: 'https://example.com/avatar.jpg',
};

const userNoName = {
  ...adminUser,
  name: null,
};

describe('UserProfile — Avatar (Sprint 29-2)', () => {
  it('user.image 有 URL 時顯示 <img>', () => {
    render(<UserProfile user={userWithImage} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    expect(img.getAttribute('alt')).toContain('Admin');
  });

  it('user.image 為 null 時顯示字母頭像（取 name 第一字 uppercase）', () => {
    render(<UserProfile user={adminUser} />);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('name 為 null 時 fallback 到 email 第一字 uppercase', () => {
    render(<UserProfile user={userNoName} />);
    expect(screen.getByText('A')).toBeTruthy(); // "Admin" 因為 test fixture 用 'admin@example.com'
  });

  it('Avatar 40px (h-10 w-10)', () => {
    const { container } = render(<UserProfile user={adminUser} />);
    const avatar = container.querySelector('[data-testid=user-avatar]');
    expect(avatar?.className).toContain('h-10');
    expect(avatar?.className).toContain('w-10');
  });
});

describe('UserProfile — Name + Email + Role', () => {
  it('顯示用戶 name', () => {
    render(<UserProfile user={adminUser} />);
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('顯示 email（小字）', () => {
    render(<UserProfile user={adminUser} />);
    expect(screen.getByText('admin@example.com')).toBeTruthy();
  });

  it('name 為 null 時 email 仍顯示（小字行）', () => {
    render(<UserProfile user={userNoName} />);
    // 就算 name fallback 到 email，email 小字行還是會顯示（會有兩個相同文字）
    const emails = screen.getAllByText('admin@example.com');
    expect(emails.length).toBeGreaterThanOrEqual(1);
    // user-email testid 存在
    expect(screen.getByTestId('user-email')).toBeTruthy();
  });

  it('role 顯示為 badge', () => {
    render(<UserProfile user={adminUser} />);
    const badge = screen.getByTestId('user-role-badge');
    expect(badge.textContent).toBe('admin');
  });
});

describe('UserProfile — Action buttons (icon-only row, Sprint 29-2)', () => {
  it('3 個 icon-only 按鈕在一行：設定、Theme、登出', () => {
    const { container } = render(<UserProfile user={adminUser} />);
    const actions = container.querySelector('[data-testid=user-profile-actions]');
    expect(actions).toBeTruthy();
    // 3 個 button (theme 是 toggle button)
    const buttons = actions?.querySelectorAll('button, a');
    expect(buttons?.length).toBeGreaterThanOrEqual(3);
  });

  it('「設定」 icon-only 連結到 /admin/settings', () => {
    render(<UserProfile user={adminUser} />);
    const link = screen.getByRole('link', { name: /設定/ });
    expect(link.getAttribute('href')).toBe('/admin/settings');
  });

  it('「登出」 icon-only 是 button 觸發 signOut', async () => {
    const user = userEvent.setup();
    const { signOut } = await import('next-auth/react');
    render(<UserProfile user={adminUser} />);
    const logoutBtn = screen.getByRole('button', { name: /登出/ });
    await user.click(logoutBtn);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/admin/login' });
  });

  it('每個 icon 按鈕有 aria-label / tooltip（a11y）', () => {
    render(<UserProfile user={adminUser} />);
    // 設定
    expect(screen.getByRole('link', { name: /設定/ })).toBeTruthy();
    // 登出
    expect(screen.getByRole('button', { name: /登出/ })).toBeTruthy();
    // Theme toggle 應該有 sr-only text label
    expect(screen.getByRole('button', { name: /主題/ })).toBeTruthy();
  });
});

describe('UserProfile — 移除舊的 full-width buttons', () => {
  it('不再有「設定」全寬按鈕', () => {
    render(<UserProfile user={adminUser} />);
    // 「設定」現在是 link 不是寬按鈕
    const link = screen.getByRole('link', { name: /設定/ });
    expect(link.className).not.toContain('w-full');
  });
});