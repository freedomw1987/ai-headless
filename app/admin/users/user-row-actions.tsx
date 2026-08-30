// Sprint 28 — Users Row Actions
//
// 提供每 row 的「⋯」操作 menu：
// - 編輯（link 到 /admin/users/:id/edit）
// - 停用（DELETE /api/users/:id，軟刪除）
//
// 注意：跟 ListRowActions 不同：
// - 確認訊息是「停用」而非「刪除」（User 是軟刪除）
// - DELETE 走 /api/users/:id（auth API），不是 /api/crud/:spec
// - 編輯路徑是 /admin/users/:id/edit，不是 /admin/crud/:spec/:id
//
// Gate 1 TDD: 見 tests/integration/user-row-actions.test.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Pencil, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
  userId: string;
};

export function UserRowActions({ userId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDisable() {
    if (!confirm('確定要停用這個帳號？')) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (res.ok) {
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? '停用失敗');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '停用失敗');
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" data-testid={`user-row-actions-${userId}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>動作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${userId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              編輯
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDisable}
            disabled={isPending}
            className="text-destructive focus:text-destructive"
            data-testid={`user-row-disable-${userId}`}
          >
            <PowerOff className="mr-2 h-4 w-4" />
            停用
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <span className="sr-only" role="alert">{error}</span>
      )}
    </>
  );
}