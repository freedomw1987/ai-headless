// US-102 — Admin Sidebar (Client Component)
//
// Sprint 9：根據 enabledExtensions 過濾顯示 Extension 連結
// Sprint 12 TECH-023：Extension 連結改從 manifest.nav 自動生成（不再 hardcoded）
// Sprint 32：手機 RWD — sidebar collapse with 漢堡按鈕
// Sprint 29：結構重組
//   - Top: 總覽 + Extension 連結 (blog/todo/event/order)
//   - 系統設定 (section header) → 用戶管理 + 角色管理 (admin only)
//   - Bottom (above profile): Extensions 管理 (admin only)
//   - Bottom: User Profile (美化由 Sprint 29-2 處理)

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth/auth';
import type { ExtensionNavItem } from '@/lib/extensions/extension-nav';
import { hasUIPermission } from '@/lib/auth/ui-permissions';
import { UserProfile } from './user-profile';

type Props = {
  user: AuthUser;
  enabledExtensions: string[];
  extensionNavItems?: ExtensionNavItem[];
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

export function AdminSidebar({
  user,
  enabledExtensions,
  extensionNavItems = [],
  isMobileOpen,
  onMobileOpenChange,
}: Props) {
  const pathname = usePathname();
  const isAdmin = hasUIPermission(user.permissions, 'roles:write');

  // Top section: enabled extensions（過濾 disabled）
  const visibleExtensionItems = extensionNavItems.filter((item) =>
    enabledExtensions.includes(item.requiresExtension),
  );

  return (
    <>
      {/* Sprint 32: 手機 RWD — sidebar 主體 */}
      <aside
        className={cn(
          // 桌面 (>= sm): 固定 w-64
          'sm:w-64 sm:flex sm:flex-col sm:border-r sm:bg-background',
          // 手機 (< sm): fixed 位置,根據 isMobileOpen 切換
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r bg-background transition-transform',
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full sm:translate-x-0',
        )}
        data-testid="admin-sidebar"
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">AI Headless</h2>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          <button
            type="button"
            onClick={() => onMobileOpenChange(false)}
            className="sm:hidden p-1 rounded hover:bg-muted"
            aria-label="關閉選單"
            data-testid="mobile-close-button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top section: 總覽 + Extension 連結 */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            href="/admin"
            onClick={() => onMobileOpenChange(false)}
            data-testid="sidebar-link-dashboard"
            className={cn(
              'block px-3 py-2 rounded text-sm transition-colors',
              pathname === '/admin'
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-muted',
            )}
          >
            總覽
          </Link>
          {visibleExtensionItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onMobileOpenChange(false)}
                data-testid={`sidebar-link-${item.requiresExtension}`}
                className={cn(
                  'block px-3 py-2 rounded text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted',
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* 系統設定 section */}
          <div className="pt-3 mt-3 border-t">
            <h3 className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              系統設定
            </h3>
            <Link
              href="/admin/users"
              onClick={() => onMobileOpenChange(false)}
              data-testid="sidebar-link-users"
              className={cn(
                'block px-3 py-2 rounded text-sm transition-colors',
                pathname.startsWith('/admin/users')
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted',
              )}
            >
              用戶管理
            </Link>
            {isAdmin && (
              <Link
                href="/admin/roles"
                onClick={() => onMobileOpenChange(false)}
                data-testid="sidebar-link-roles"
                className={cn(
                  'block px-3 py-2 rounded text-sm transition-colors',
                  pathname.startsWith('/admin/roles')
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted',
                )}
              >
                角色管理
              </Link>
            )}
          </div>
        </nav>

        {/* Bottom section: Extensions 管理 + User Profile */}
        <div className="border-t">
          {isAdmin && (
            <Link
              href="/admin/extensions"
              onClick={() => onMobileOpenChange(false)}
              data-testid="sidebar-link-extensions-manage"
              className={cn(
                'block px-6 py-3 text-sm transition-colors',
                pathname.startsWith('/admin/extensions')
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted',
              )}
            >
              Extensions 管理
            </Link>
          )}
          <UserProfile user={user} />
        </div>
      </aside>

      {/* Sprint 32: 手機 RWD — backdrop (點擊關閉) */}
      {isMobileOpen && (
        <button
          type="button"
          onClick={() => onMobileOpenChange(false)}
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          aria-label="關閉選單"
          data-testid="mobile-backdrop"
        />
      )}
    </>
  );
}

// User Profile（簡化版，Sprint 29-2 會美化）
// 改用獨立元件，詳見 app/admin/user-profile.tsx