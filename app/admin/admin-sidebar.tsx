/**
 * US-102 — Admin Sidebar (Client Component)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth/auth';

const NAV_ITEMS = [
  { href: '/admin', label: '總覽', exact: true },
  { href: '/admin/users', label: '用戶管理' },
  { href: '/admin/extensions', label: 'Extensions' },
  { href: '/admin/orders', label: '訂單' },
];

export function AdminSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold">AI Headless</h2>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
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
        <div className="text-sm">
          <div className="font-medium">{user.name ?? user.email}</div>
          <div className="text-xs text-muted-foreground">{user.role}</div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          登出
        </Button>
      </div>
    </aside>
  );
}