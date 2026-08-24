'use client';

import { Button } from '@/components/ui/button';

export type PaginationProps = {
  currentPage: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ currentPage, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        共 {total} 筆 · 第 {currentPage} 頁 / 共 {totalPages} 頁
      </div>
      <div className="space-x-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => onChange(currentPage - 1)}>
          上一頁
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onChange(currentPage + 1)}>
          下一頁
        </Button>
      </div>
    </div>
  );
}