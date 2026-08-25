'use client';

// Sprint 18 Stage 2 — List Row Actions
//
// 每 row 的「⋯」DropdownMenu（檢視、編輯、刪除）。
// 包成 client component 才能用 Radix DropdownMenu（list page 是 Server Component）。

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
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
  specName: string;
  rowId: string;
};

export function ListRowActions({ specName, rowId }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('確認刪除？此操作無法復原。')) return;
    const res = await fetch(`/api/crud/${specName}?id=${rowId}`, { method: 'DELETE' });
    if (res.ok) {
      router.refresh();
    } else {
      alert('刪除失敗');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`row-actions-${rowId}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>動作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/crud/${specName}/${rowId}`}>
            <Eye />
            檢視
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/crud/${specName}/${rowId}/edit`}>
            <Pencil />
            編輯
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 />
          刪除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}