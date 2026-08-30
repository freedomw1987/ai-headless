// Sprint 28 — Role Row Actions
//
// 提供每 row 的「⋯」操作 menu：
// - 矩陣（link 到 /admin/roles/:id/permissions）
// - 刪除（僅 isSystem=false 的自定義 role 才顯示，DELETE /api/admin/roles/:id）
//
// 注意：跟 ListRowActions 不同：
// - 編輯連結到 /admin/roles/:id/permissions（矩陣頁），不是 /admin/crud/:spec/:id
// - 內建 role（isSystem=true）不顯示刪除
// - 刪除走 /api/admin/roles/:id，帶 confirm 警告（有 user 不可刪）
//
// Gate 1 TDD: 見 tests/integration/role-row-actions.test.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Settings2, Trash2 } from 'lucide-react';
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
  roleId: string;
  displayName: string;
  isSystem: boolean;
  /** 此 role 被指派的用戶數（如果有 user 不可刪）*/
  userCount: number;
};

export function RoleRowActions({ roleId, displayName, isSystem, userCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const warning = userCount > 0 ? `\n⚠️ 此 role 有 ${userCount} 個用戶指派` : '';
    if (!confirm(`確定要刪除 role '${displayName}'?${warning}`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
        if (res.ok) {
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? '刪除失敗');
          alert(data.error ?? '刪除失敗');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '刪除失敗');
        alert(e instanceof Error ? e.message : '刪除失敗');
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" data-testid={`role-row-actions-${roleId}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>動作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/roles/${roleId}/permissions`} data-testid={`role-row-matrix-${roleId}`}>
              <Settings2 className="mr-2 h-4 w-4" />
              矩陣
            </Link>
          </DropdownMenuItem>
          {!isSystem && (
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
              data-testid={`role-row-delete-${roleId}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              刪除
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <span className="sr-only" role="alert">{error}</span>
      )}
    </>
  );
}