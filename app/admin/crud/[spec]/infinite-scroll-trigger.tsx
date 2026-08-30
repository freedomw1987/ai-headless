// Sprint A1 (CRUD 列表頁增強 v1.1) — InfiniteScrollTrigger
//
// Client component，在列表頁底部偵測 sentinel 進入視窗，自動 push `?page=N+1`
// 觸發 server component 重新 render，把新資料 append 到現有列表。
//
// 設計重點:
// - 不拆架構: page.tsx 還是 server component，這個 trigger 只負責觸發 URL 變化
// - 保留 query string: 搜尋/排序/分頁大小等參數都保留，只覆寫 page
// - useTransition: 避免 scroll 觸發太多次 router.push
// - 觸發距離: 距底部 200px (rootMargin: '200px')
//
// 已知行為:
// - 進頁面時 trigger 若已在 viewport 內（資料量少 + pageSize 小），會立即觸發一次
// - 這是 infinite scroll 標準行為，用戶已選 pageSize=20 後可避免
//
// Gate 1 TDD: 見 tests/integration/crud-list-infinite-scroll-trigger.test.tsx

'use client';

import { useEffect, useRef, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  page: number;
  hasMore: boolean;
  total: number;
};

export function InfiniteScrollTrigger({ page, hasMore, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!hasMore) return;
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loadingRef.current) return;

        loadingRef.current = true;
        startTransition(() => {
          const params = new URLSearchParams(searchParams);
          params.set('page', String(page + 1));
          router.push(`${pathname}?${params.toString()}`);
        });
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, page, pathname, router, searchParams]);

  // URL 變了 (push 完成後) → 重置 loadingRef
  useEffect(() => {
    loadingRef.current = false;
  }, [searchParams]);

  if (!hasMore) {
    return (
      <div
        data-testid="infinite-scroll-end"
        className="text-center py-4 text-sm text-muted-foreground"
      >
        已顯示全部 {total} 筆
      </div>
    );
  }

  return (
    <div
      ref={sentinelRef}
      data-testid="infinite-scroll-sentinel"
      className="text-center py-4 text-sm text-muted-foreground"
    >
      {isPending ? '載入中...' : '捲動以載入更多'}
    </div>
  );
}
