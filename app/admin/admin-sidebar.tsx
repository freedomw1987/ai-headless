/**
 * US-102 — Admin Sidebar (Client Component)
 *
 * Sprint 9 加碼：根據 enabledExtensions 過濾顯示 Extension 連結
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth/auth';

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  requiresExtension?: string; // 如果設定，則根據此 extension 是否啟用來顯示
};

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: '總覽', exact: true },
  { href: '/admin/users', label: '用戶管理' },
  { href: '/admin/extensions', label: 'Extensions' },
  { href: '/admin/orders', label: '訂單', requiresExtension: 'order' },
  { href: '/admin/blog', label: '部落格', requiresExtension: 'blog' },
  { href: '/admin/event', label: '活動', requiresExtension: 'event' },
  { href: '/admin/todo', label: '待辦', requiresExtension: 'todo' },
];

export function AdminSidebar({
  user,
  enabledExtensions,
}: {
  user: AuthUser;
  enabledExtensions: string[];
}) {
  const pathname = usePathname();

  // 過濾：根據 enabledExtensions 隱藏 disabled 的 extension 連結
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.requiresExtension) return true;
    return enabledExtensions.includes(item.requiresExtension);
  });

  return (
    <aside className="w-64 border-r bg-background flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold">AI Headless</h2>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
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