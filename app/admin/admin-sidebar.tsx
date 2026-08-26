// US-102 — Admin Sidebar (Client Component)
//
// Sprint 9：根據 enabledExtensions 過濾顯示 Extension 連結
// Sprint 12 TECH-023：Extension 連結改從 manifest.nav 自動生成（不再 hardcoded）

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth/auth';
import type { ExtensionNavItem } from '@/lib/extensions/extension-nav';
import { hasUIPermission } from '@/lib/auth/ui-permissions';

type StaticNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  adminOnly?: boolean;
};

// Sprint 12：NAV_ITEMS 只剩系統內建連結（總覽/用戶/Extensions）
// Extension 連結改從 props 注入（由父層從 manifest.nav 生成）
// Sprint 21 Task 10：加 Roles 入口（admin only）
const STATIC_NAV_ITEMS: StaticNavItem[] = [
  { href: '/admin', label: '總覽', exact: true },
  { href: '/admin/users', label: '用戶管理' },
  { href: '/admin/roles', label: 'Roles', adminOnly: true as const },
  { href: '/admin/extensions', label: 'Extensions' },
];

type ExtensionNavProp = ExtensionNavItem; // alias for clarity

export function AdminSidebar({
  user,
  enabledExtensions,
  extensionNavItems = [],
}: {
  user: AuthUser;
  enabledExtensions: string[];
  extensionNavItems?: ExtensionNavProp[];
}) {
  const pathname = usePathname();

  // 過濾系統內建連結（不需 extension 啟用）
  const visibleStaticItems = STATIC_NAV_ITEMS;

  // 過濾 extension 連結（依 enabledExtensions 隱藏 disabled）
  const visibleExtensionItems = extensionNavItems.filter((item) =>
    enabledExtensions.includes(item.requiresExtension),
  );

  const allVisibleItems: Array<{ href: string; label: string; exact?: boolean }> = [
    ...visibleStaticItems,
    ...visibleExtensionItems,
  ];

  // 過濾 admin only 項目 (Sprint 24: 改用動態版)
  // roles:write = roles 矩陣權限 (= admin 預設)
  const isAdmin = hasUIPermission(user.permissions, 'roles:write');
  const filteredItems = allVisibleItems.filter((item) => {
    const staticItem = STATIC_NAV_ITEMS.find((s) => s.href === item.href);
    if (staticItem?.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside className="w-64 border-r bg-background flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold">AI Headless</h2>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
      </nav>
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground mb-2">
          {user.email}
          <br />
          <span className="font-medium">{user.role}</span>
        </div>
        <div className="mb-2">
          <ThemeToggle />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          登出
        </Button>
      </div>
    </aside>
  );
}