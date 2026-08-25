/**
 * Sprint 9 + Sprint 12 TECH-023 — AdminSidebar 單元測試
 *
 * Sprint 12 改動：extension nav items 改從 props 注入（由父層從 manifest.nav 生成）
 * 不再 hardcoded 在 sidebar 內。
 *
 * 守護：
 * - disable extension → Sidebar 必須隱藏對應 nav 連結
 * - 系統內建連結（總覽/用戶/Extensions）永遠顯示
 * - 沒 extensionNavItems prop → 不顯示 extension 連結（向後相容）
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminSidebar } from '@/app/admin/admin-sidebar';
import type { ExtensionNavItem } from '@/lib/extensions/extension-nav';

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

// Sprint 12：模擬從 manifest.nav 生成的 nav items
const defaultExtensionNavItems: ExtensionNavItem[] = [
  { href: '/admin/orders', label: '訂單', requiresExtension: 'order' },
  { href: '/admin/blog', label: '部落格', requiresExtension: 'blog' },
  { href: '/admin/event', label: '活動', requiresExtension: 'event' },
  { href: '/admin/todo', label: '待辦', requiresExtension: 'todo' },
];

function renderSidebar(
  enabledExtensions: string[],
  extensionNavItems = defaultExtensionNavItems,
) {
  return render(
    <AdminSidebar
      user={fakeUser}
      enabledExtensions={enabledExtensions}
      extensionNavItems={extensionNavItems}
    />,
  );
}

describe('AdminSidebar — 基礎渲染', () => {
  it('渲染標題 + 用戶資訊 + 登出按鈕', () => {
    renderSidebar(['blog']);
    expect(screen.getByText('AI Headless')).toBeTruthy();
    expect(screen.getByText('admin@example.com')).toBeTruthy();
    expect(screen.getByText('admin')).toBeTruthy();
    expect(screen.getByRole('button', { name: '登出' })).toBeTruthy();
  });

  it('永遠顯示「總覽」、「用戶管理」、「Extensions」（不需 extension 啟用）', () => {
    renderSidebar([]);
    expect(screen.getByText('總覽')).toBeTruthy();
    expect(screen.getByText('用戶管理')).toBeTruthy();
    expect(screen.getByText('Extensions')).toBeTruthy();
  });
});

describe('AdminSidebar — Extension 過濾', () => {
  it('全部啟用 → 顯示所有 4 個 extension 連結', () => {
    renderSidebar(['blog', 'event', 'todo', 'order']);
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 blog 禁用 → 部落格連結消失，其他 3 個仍在', () => {
    renderSidebar(['event', 'todo', 'order']);
    expect(screen.queryByText('部落格')).toBeNull();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 event 禁用 → 活動連結消失，其他 3 個仍在', () => {
    renderSidebar(['blog', 'todo', 'order']);
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 todo 禁用 → 待辦連結消失', () => {
    renderSidebar(['blog', 'event', 'order']);
    expect(screen.queryByText('待辦')).toBeNull();
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
  });

  it('只有 order 禁用 → 訂單連結消失', () => {
    renderSidebar(['blog', 'event', 'todo']);
    expect(screen.queryByText('訂單')).toBeNull();
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('活動')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
  });

  it('多個禁用 → 只顯示 enabled 的（blog + order）', () => {
    renderSidebar(['blog', 'order']);
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('訂單')).toBeTruthy();
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.queryByText('待辦')).toBeNull();
  });

  it('全部禁用 → 4 個 extension 連結全部消失', () => {
    renderSidebar([]);
    expect(screen.queryByText('部落格')).toBeNull();
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.queryByText('待辦')).toBeNull();
    expect(screen.queryByText('訂單')).toBeNull();
    // 但基礎連結仍在
    expect(screen.getByText('總覽')).toBeTruthy();
    expect(screen.getByText('用戶管理')).toBeTruthy();
  });

  it('傳入 enabledExtensions 包含不認得的 name → 沒對應 nav item，不 throw', () => {
    renderSidebar(['blog', 'unknown-ext', 'todo']);
    expect(screen.getByText('部落格')).toBeTruthy();
    expect(screen.getByText('待辦')).toBeTruthy();
  });
});

describe('AdminSidebar — Nav Link href', () => {
  it('正確的 href', () => {
    renderSidebar(['blog', 'event', 'todo', 'order']);
    const blogLink = screen.getByRole('link', { name: '部落格' });
    expect(blogLink.getAttribute('href')).toBe('/admin/blog');

    const eventLink = screen.getByRole('link', { name: '活動' });
    expect(eventLink.getAttribute('href')).toBe('/admin/event');
  });

  it('disabled 的 extension 連結根本不存在', () => {
    renderSidebar(['event']);
    expect(screen.queryByRole('link', { name: '部落格' })).toBeNull();
    expect(screen.queryByRole('link', { name: '待辦' })).toBeNull();
    expect(screen.queryByRole('link', { name: '訂單' })).toBeNull();
    expect(screen.getByRole('link', { name: '活動' })).toBeTruthy();
  });
});

describe('AdminSidebar — extensionNavItems prop（向後相容）', () => {
  it('沒傳 extensionNavItems → 不顯示 extension 連結（不 throw）', () => {
    render(
      <AdminSidebar user={fakeUser} enabledExtensions={['blog', 'event']} />,
    );
    expect(screen.queryByText('部落格')).toBeNull();
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.getByText('總覽')).toBeTruthy();
  });

  it('傳空陣列 → 也不顯示 extension 連結', () => {
    renderSidebar(['blog'], []);
    expect(screen.queryByText('部落格')).toBeNull();
    expect(screen.queryByText('活動')).toBeNull();
  });
});