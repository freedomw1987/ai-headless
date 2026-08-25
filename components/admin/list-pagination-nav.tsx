'use client';

// Sprint 18 Stage 2 — List Pagination Nav
//
// 簡化方案：client side 分頁（不動後端 API）。
// - 接收所有 items（Server Component 已抓取）+ pageSize
// - 用 useState 管理當前頁
// - 顯示「顯示 X 到 Y，共 Z 筆」+ Pagination UI

import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Props<T> = {
  items: T[];
  pageSize?: number;
  renderItem: (item: T) => React.ReactNode;
};

export function ListPaginationNav<T extends { id: string | number }>({
  items,
  pageSize = 10,
  renderItem,
}: Props<T>) {
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