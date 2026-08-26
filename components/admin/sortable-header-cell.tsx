'use client';

// Sprint 20 Stage 2 — Sortable Header Cell with Tooltip
//
// Client wrapper for sortable table header in list page (Server Component)。
// 把 Tooltip 邏輯封裝在這裡，避免把整個 list page 變 client。
//
// 顯示：
// - 點擊切換排序（基礎提示）
// - 當前排序狀態（升冪 / 降冪 / 未排序）
//
// URL 結構：自己用 URLSearchParams 組（Server → Client 不能傳 function prop）

import Link from 'next/link';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Props = {
  label: string;
  fieldName: string;
  currentSort: string;
  currentOrder: 'asc' | 'desc' | ''; // 接受空字串以容許未排序狀態
  q: string;
  pageSize: number;
  specName: string;
};

export function SortableHeaderCell({ label, fieldName, currentSort, currentOrder, q, pageSize, specName }: Props) {
  const isSorted = currentSort === fieldName;
  const nextOrder: 'asc' | 'desc' = isSorted && currentOrder === 'desc' ? 'asc' : 'desc';

  // Sprint 20 Stage 2：client 端自己組 URL（不傳 function 過來）
  const href = (() => {
    const params = new URLSearchParams();
    params.set('sort', fieldName);
    params.set('order', nextOrder);
    if (q) params.set('q', q);
    if (pageSize) params.set('pageSize', String(pageSize));
    return `/admin/crud/${specName}?${params.toString()}`;
  })();

  const Icon = !isSorted
    ? ArrowUpDown
    : currentOrder === 'asc'
      ? ChevronUp
      : ChevronDown;
  const sortStatus = !isSorted
    ? '未排序'
    : currentOrder === 'asc'
      ? '目前：升冪'
      : '目前：降冪';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className="inline-flex items-center gap-1 hover:text-foreground"
            aria-label={`依${label}欄位排序`}
          >
            {label}
            <Icon aria-hidden="true" className={isSorted ? 'h-3 w-3' : 'h-3 w-3 opacity-40'} />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>點擊切換排序</p>
          <p className="text-primary-foreground/70">{sortStatus}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}