/**
 * Sprint 9 補完 — AdminSidebar 單元測試
 *
 * 對應：app/admin/admin-sidebar.tsx
 *
 * 守護：disable extension 時，Sidebar 必須隱藏對應 nav 連結
 *
 * 涵蓋：
 * 1. 全啟用 → 顯示所有 4 個 extension 連結
 * 2. 全部啟用 → 顯示 users + extensions + 4 個 ext 連結
 * 3. 單一 disabled → 隱藏對應連結
 * 4. 多個 disabled → 只顯示 enabled 的
 * 5. 全部 disabled → 只剩 users + extensions + overview
 * 6. 空陣列 → 等同全部 disabled
 * 7. 不在 NAV_ITEMS 的 extension name → 忽略
 *
 * 注意：
 * - 需要 mock next/navigation 的 usePathname
 * - 需要 mock next-auth/react 的 signOut（避免 auth 副作用）
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminSidebar } from '@/app/admin/admin-sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

const fakeUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'admin' as const,
};

describe('AdminSidebar — 基礎渲染', () => {
  it('渲染標題 + 用戶資訊 + 登出按鈕', () => {
    render(
      <AdminSidebar user={fakeUser} enabledExtensions={['blog', 'event', 'todo', 'order']} />,
    );
    expect(screen.getByText('AI Headless')).toBeTruthy();
    expect(screen.getByText('admin@example.com')).toBeTruthy();
    expect(screen.getByText('登出')).toBeTruthy();
  });

  it('永遠顯示「總覽」、「用戶管理」、「Extensions」（不需 extension 啟用）', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={[]} />);
    expect(screen.getByText('總覽')).toBeTruthy();
    expect(screen.getByText('用戶管理')).toBeTruthy();
    expect(screen.getByText('Extensions')).toBeTruthy();
  });
});

describe('AdminSidebar — Extension 過濾', () => {
  it('全部啟用 → 顯示所有 4 個 extension 連結', () => {
    render(
      <AdminSidebar user={fakeUser} enabledExtensions={['blog', 'event', 'todo', 'order']} />,
    );
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 blog 禁用 → 部落格連結消失，其他 3 個仍在', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={['event', 'todo', 'order']} />);
    expect(screen.queryByText('部落格')).toBeNull();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 event 禁用 → 活動連結消失，其他 3 個仍在', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={['blog', 'todo', 'order']} />);
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 todo 禁用 → 待辦連結消失', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={['blog', 'event', 'order']} />);
    expect(screen.queryByText('待辦')).toBeNull();
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 order 禁用 → 訂單連結消失', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={['blog', 'event', 'todo']} />);
    expect(screen.queryByText('訂單')).toBeNull();
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
  });

  it('多個禁用 → 只顯示 enabled 的（blog + order）', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={['blog', 'order']} />);
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.queryByText('待辦')).toBeNull();
  });

  it('全部禁用 → 4 個 extension 連結全部消失', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={[]} />);
    expect(screen.queryByText('部落格')).toBeNull();
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.queryByText('待辦')).toBeNull();
    expect(screen.queryByText('訂單')).toBeNull();
    // 但基礎連結仍在
    expect(screen.getByText('總覽')).toBeTruthy();
    expect(screen.getByText('用戶管理')).toBeTruthy();
  });

  it('傳入不認得的 extension name → 沒對應 nav item，無影響', () => {
    // 故意傳不認得的 name，不應該 throw 或顯示什麼
    render(
      <AdminSidebar user={fakeUser} enabledExtensions={['blog', 'unknown-ext', 'todo']} />,
    );
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
    // 不應該 throw
  });
});

describe('AdminSidebar — Nav Link href', () => {
  it('正確的 href', () => {
    render(
      <AdminSidebar user={fakeUser} enabledExtensions={['blog', 'event', 'todo', 'order']} />,
    );
    const blogLink = screen.getByRole('link', { name: '部落格' });
    expect(blogLink.getAttribute('href')).toBe('/admin/blog');

    const eventLink = screen.getByRole('link', { name: '活動' });
    expect(eventLink.getAttribute('href')).toBe('/admin/event');
  });

  it('disabled 的 extension 連結根本不存在', () => {
    render(<AdminSidebar user={fakeUser} enabledExtensions={['event']} />);
    expect(screen.queryByRole('link', { name: '部落格' })).toBeNull();
    expect(screen.queryByRole('link', { name: '待辦' })).toBeNull();
    expect(screen.queryByRole('link', { name: '訂單' })).toBeNull();
    // event 連結仍在
    expect(screen.getByRole('link', { name: '活動' })).toBeTruthy();
  });
});