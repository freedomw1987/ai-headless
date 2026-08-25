'use client';

// Sprint 18 Stage 2 — List Pagination Nav
// Sprint 19 Stage 1 — 擴展支援 server-side 分頁（mode='server'）
//
// 兩種模式：
// - client（預設）：所有 items 已 fetch，client side slice + useState
// - server：items 是 server 過濾的當前頁資料，page change 觸發 onPageChange（父層處理 URL 變動）
//
// 顯示「顯示 X 到 Y，共 Z 筆」+ Pagination UI

import { useState } from 'react';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type ClientProps<T> = {
  mode?: 'client';
  items: T[];
  pageSize?: number;
  renderItem: (item: T) => React.ReactNode;
};

type ServerProps = {
  mode: 'server';
  items: unknown[]; // 當前頁 items（已由 server 過濾）
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** URL prefix（如 '/admin/crud/event'），PaginationLink 會組合成 ?page=N */
  basePath: string;
  renderItem: (item: unknown, index: number) => React.ReactNode;
  /** 用於「顯示 X 到 Y」計算 (1-indexed) */
  startIndex?: number;
};

type Props<T> = ClientProps<T> | ServerProps;

export function ListPaginationNav<T extends { id: string | number } = { id: string }>(
  props: Props<T>,
) {
  // Client mode
  if (!props.mode || props.mode === 'client') {
    return <ClientPaginationNav {...(props as ClientProps<T>)} />;
  }
  return <ServerPaginationNav {...(props as ServerProps)} />;
}

// ==============================================
// Client mode（Sprint 18 原本設計）
// ==============================================
function ClientPaginationNav<T extends { id: string | number }>({
  items,
  pageSize = 10,
  renderItem,
}: ClientProps<T>) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, items.length);
  const currentItems = items.slice(start, end);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        顯示 {start + 1} 到 {end} 筆，共 {items.length} 筆
      </div>

      <div className="space-y-2">{currentItems.map((item) => renderItem(item))}</div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(Math.max(1, page - 1));
                }}
                aria-disabled={page === 1}
              />
            </PaginationItem>
            {page > 2 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(1);
                  }}
                >
                  1
                </PaginationLink>
              </PaginationItem>
            )}
            {page > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {page > 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(page - 1);
                  }}
                >
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {page}
              </PaginationLink>
            </PaginationItem>
            {page < totalPages && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(page + 1);
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )}
            {page < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {page < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(totalPages);
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(Math.min(totalPages, page + 1));
                }}
                aria-disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

// ==============================================
// Server mode（Sprint 19 Stage 1）
// ==============================================
function ServerPaginationNav({
  items,
  total,
  page,
  pageSize,
  totalPages,
  basePath,
  renderItem,
  startIndex = 0,
}: ServerProps) {
  const safeStart = startIndex;
  const safeEnd = Math.min(safeStart + items.length, total);

  // URL 構造（page + pageSize）
  const buildHref = (targetPage: number) => {
    if (targetPage === 1) return basePath;
    return `${basePath}?page=${targetPage}&pageSize=${pageSize}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        顯示 {safeStart + 1} 到 {safeEnd} 筆，共 {total} 筆
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => renderItem(item, safeStart + idx))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? (
                <PaginationPrevious href={buildHref(page - 1)}>上一頁</PaginationPrevious>
              ) : (
                <PaginationPrevious href="#" aria-disabled>上一頁</PaginationPrevious>
              )}
            </PaginationItem>
            {page > 2 && (
              <PaginationItem>
                <PaginationLink href={buildHref(1)}>1</PaginationLink>
              </PaginationItem>
            )}
            {page > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {page > 1 && (
              <PaginationItem>
                <PaginationLink href={buildHref(page - 1)}>{page - 1}</PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink href="#" isActive>
                {page}
              </PaginationLink>
            </PaginationItem>
            {page < totalPages && (
              <PaginationItem>
                <PaginationLink href={buildHref(page + 1)}>{page + 1}</PaginationLink>
              </PaginationItem>
            )}
            {page < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {page < totalPages - 1 && (
              <PaginationItem>
                <PaginationLink href={buildHref(totalPages)}>{totalPages}</PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              {page < totalPages ? (
                <PaginationNext href={buildHref(page + 1)}>下一頁</PaginationNext>
              ) : (
                <PaginationNext href="#" aria-disabled>下一頁</PaginationNext>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}