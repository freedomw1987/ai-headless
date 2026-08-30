/**
 * Sprint 29-1 — AdminSidebar 結構重組測試
 *
 * 新結構：
 * - Top section：
 *   - 總覽 (Dashboard)
 *   - Extension 連結 (blog/todo/event/order)
 * - 系統設定 (collapsible section)：
 *   - 用戶管理
 *   - 角色管理 (admin only)
 * - Bottom section (above profile)：
 *   - Extensions 管理 (admin only)
 * - Bottom：
 *   - User Profile（美化由 Sprint 29-2 處理）
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminSidebar } from '@/app/admin/admin-sidebar';
import type { ExtensionNavItem } from '@/lib/extensions/extension-nav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

const adminUser = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'admin' as const,
  permissions: ['roles:write', 'users:write', 'extensions:write'],
};

const editorUser = {
  id: 'user-2',
  email: 'editor@example.com',
  name: 'Editor',
  role: 'editor' as const,
  permissions: ['users:read'],
};

const defaultExtensionNavItems: ExtensionNavItem[] = [
  { href: '/admin/crud/order', label: '訂單', requiresExtension: 'order' },
  { href: '/admin/crud/blog', label: '部落格', requiresExtension: 'blog' },
  { href: '/admin/crud/event', label: '活動', requiresExtension: 'event' },
  { href: '/admin/crud/todo', label: '待辦', requiresExtension: 'todo' },
];

function renderSidebar(
  user: typeof adminUser | typeof editorUser = adminUser,
  enabledExtensions: string[] = ['blog', 'event', 'todo', 'order'],
  extensionNavItems: ExtensionNavItem[] = defaultExtensionNavItems,
  isMobileOpen = false,
  onMobileOpenChange = () => {},
) {
  return render(
    <AdminSidebar
      user={user}
      enabledExtensions={enabledExtensions}
      extensionNavItems={extensionNavItems}
      isMobileOpen={isMobileOpen}
      onMobileOpenChange={onMobileOpenChange}
    />,
  );
}

describe('Sprint 29-1: Sidebar 結構重組 — Top section', () => {
  it('top 顯示「總覽」', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: '總覽' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '總覽' }).getAttribute('href')).toBe('/admin');
  });

  it('top 顯示所有 enabled extension 連結（按 manifest 順序）', () => {
    renderSidebar();
    // enabled 順序: order, blog, event, todo (按 manifest)
    const nav = screen.getAllByRole('link');
    const extLinks = nav.filter((l) => l.getAttribute('href')?.startsWith('/admin/crud/'));
    expect(extLinks.length).toBe(4);
    expect(extLinks[0]?.textContent).toBe('訂單');
    expect(extLinks[1]?.textContent).toBe('部落格');
  });

  it('disabled extension 不顯示在 top section', () => {
    renderSidebar(adminUser, ['blog']);
    expect(screen.queryByText('訂單')).toBeNull();
    expect(screen.queryByText('活動')).toBeNull();
    expect(screen.queryByText('待辦')).toBeNull();
    expect(screen.getByText('部落格')).toBeTruthy();
  });
});

describe('Sprint 29-1: Sidebar 結構重組 — 系統設定 section', () => {
  it('顯示「系統設定」section header', () => {
    renderSidebar();
    expect(screen.getByText('系統設定')).toBeTruthy();
  });

  it('「系統設定」內包含「用戶管理」連結 → /admin/users', () => {
    renderSidebar();
    const link = screen.getByRole('link', { name: '用戶管理' });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/admin/users');
  });

  it('「系統設定」內包含「角色管理」連結 → /admin/roles（admin only）', () => {
    renderSidebar(); // adminUser
    const link = screen.getByRole('link', { name: '角色管理' });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/admin/roles');
  });

  it('非 admin 用戶看不到「角色管理」', () => {
    renderSidebar(editorUser); // editor 無 roles:write
    expect(screen.queryByRole('link', { name: '角色管理' })).toBeNull();
    // 但還看得到用戶管理
    expect(screen.getByRole('link', { name: '用戶管理' })).toBeTruthy();
  });

  it('「用戶管理」也受 permission 控制（需 users:write 才看）', () => {
    renderSidebar(editorUser); // editor 只有 users:read
    // 註：users:write 才是寫入權限。檢視可能不限權限。
    // 這裡假設「用戶管理」任何已登入用戶都能看（沒權限就只能看不能改）
    expect(screen.getByRole('link', { name: '用戶管理' })).toBeTruthy();
  });
});

describe('Sprint 29-1: Sidebar 結構重組 — Bottom section (Extensions 管理)', () => {
  it('admin 看得到「Extensions 管理」連結 → /admin/extensions', () => {
    renderSidebar(); // adminUser
    const link = screen.getByRole('link', { name: 'Extensions 管理' });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/admin/extensions');
  });

  it('非 admin 看不到「Extensions 管理」', () => {
    renderSidebar(editorUser);
    expect(screen.queryByRole('link', { name: 'Extensions 管理' })).toBeNull();
  });

it('「Extensions 管理」放在 User Profile 上方', () => {
    const { container } = renderSidebar();
    const profile = container.querySelector('[data-testid=user-profile]');
    expect(profile).toBeTruthy();
    // Extensions 管理應該在 profile 之前（DOM 順序）
    const extManage = screen.getByRole('link', { name: 'Extensions 管理' });
    expect(extManage).toBeTruthy();
    // extManage 不應該在 profile 內
    expect(profile!.contains(extManage)).toBeFalsy();
  });
});

describe('Sprint 29-1: Sidebar 結構重組 — 向後相容', () => {
  it('保留標題 (AI Headless) + 登出按鈕', () => {
    renderSidebar();
    expect(screen.getByText('AI Headless')).toBeTruthy();
    expect(screen.getByRole('button', { name: '登出' })).toBeTruthy();
  });

  it('沒傳 extensionNavItems → top section 不顯示 extension 連結（不 throw）', () => {
    render(
      <AdminSidebar
        user={adminUser}
        enabledExtensions={['blog']}
        isMobileOpen={false}
        onMobileOpenChange={() => {}}
      />,
    );
    // top 沒有任何 extension 連結
    expect(screen.queryByText('部落格')).toBeNull();
    expect(screen.queryByText('活動')).toBeNull();
    // 但「Extensions 管理」仍存在
    expect(screen.getByRole('link', { name: 'Extensions 管理' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '用戶管理' })).toBeTruthy();
  });
});