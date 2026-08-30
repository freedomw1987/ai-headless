// Sprint 29-2 — User Profile 美化 (用戶選 A 方案)
//
// 設計：
// - Avatar 40px（h-10 w-10）+ name + email + role badge
// - 下方：3 個 icon-only 按鈕在一行（設定 / Theme / 登出）
// - 每個 icon 按鈕有 aria-label（a11y）
//
// Gate 1 TDD: 見 tests/integration/admin-sidebar-profile.test.tsx

'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/lib/auth/auth';

type Props = {
  user: AuthUser;
};

/**
 * 計算頭像 fallback 字母（uppercase）
 */
function getInitial(user: AuthUser): string {
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return '?';
}

export function UserProfile({ user }: Props) {
  const initial = getInitial(user);
  const displayName = user.name || user.email;
  const hasImage = Boolean(user.image);

  return (
    <div className="p-4 border-t" data-testid="user-profile">
      {/* Avatar + Name + Email + Role */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar 40px */}
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image!}
            alt={`${displayName} 頭像`}
            data-testid="user-avatar"
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            data-testid="user-avatar"
            className={cn(
              'h-10 w-10 rounded-full shrink-0',
              'flex items-center justify-center',
              'bg-primary text-primary-foreground font-medium text-base',
            )}
          >
            {initial}
          </div>
        )}

        {/* Name + Email + role badge */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground truncate" data-testid="user-email">
            {user.email}
          </div>
          <Badge
            variant="secondary"
            data-testid="user-role-badge"
            className="mt-1 text-xs"
          >
            {user.role}
          </Badge>
        </div>
      </div>

      {/* Action buttons - icon-only row (Sprint 29-2 重設計) */}
      <div
        className="flex items-center justify-between gap-2"
        data-testid="user-profile-actions"
      >
        {/* 設定 */}
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <Link
            href="/admin/settings"
            aria-label="設定"
            data-testid="profile-settings-button"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* 登出 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          aria-label="登出"
          data-testid="profile-logout-button"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}