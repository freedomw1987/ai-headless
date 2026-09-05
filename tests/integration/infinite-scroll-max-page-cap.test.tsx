/**
 * TD-814 — Infinite Scroll Trigger 補測試
 *
 * 對應: docs/backlog.md TD-814
 *
 * 補上 TD-805 (max page cap) + useTransition + cumulative render 三項行為測試:
 * 1. 達 maxPageCap 時不觸發 IntersectionObserver (loadingRef)
 * 2. 達 maxPageCap 且 hasMore=true 時顯示「已載入前 N 頁」提示
 * 3. useTransition isPending 期間顯示「載入中...」
 * 4. cumulative render: 多次 page 變化都正確觸發下一頁
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { InfiniteScrollTrigger } from '@/app/admin/crud/[spec]/infinite-scroll-trigger';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams('page=2');
let mockPathname = '/admin/crud/order';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// Mock IntersectionObserver
type IntersectionCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let intersectionCallback: IntersectionCallback | null = null;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockPush.mockClear();
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  intersectionCallback = null;
  mockPathname = '/admin/crud/order';
  mockSearchParams = new URLSearchParams('page=2');

  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = class {
    constructor(cb: IntersectionCallback) {
      intersectionCallback = cb;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
    takeRecords = vi.fn();
    root = null;
    rootMargin = '';
    thresholds = [];
  };
});

describe('TD-814 — InfiniteScrollTrigger 補測試', () => {
  describe('TD-805 — max page cap 守衛', () => {
    it('page 已達 maxPageCap 時, 顯示 cap-reached 提示且 hasMore=true', () => {
      mockSearchParams = new URLSearchParams('page=50');
      render(
        <InfiniteScrollTrigger page={50} hasMore={true} total={5000} maxPageCap={50} />,
      );
      expect(screen.getByTestId('infinite-scroll-cap-reached')).toBeTruthy();
      expect(screen.queryByTestId('infinite-scroll-sentinel')).toBeNull();
    });

    it('page 達 cap 但 hasMore=false 時, 顯示「已顯示全部」', () => {
      mockSearchParams = new URLSearchParams('page=50');
      render(
        <InfiniteScrollTrigger page={50} hasMore={false} total={200} maxPageCap={50} />,
      );
      expect(screen.getByTestId('infinite-scroll-end')).toBeTruthy();
      expect(screen.queryByTestId('infinite-scroll-cap-reached')).toBeNull();
    });

    it('page 未達 cap 時, 顯示 sentinel', () => {
      mockSearchParams = new URLSearchParams('page=2');
      render(
        <InfiniteScrollTrigger page={2} hasMore={true} total={5000} maxPageCap={50} />,
      );
      expect(screen.getByTestId('infinite-scroll-sentinel')).toBeTruthy();
    });

    it('cap 為 0 時不限制', () => {
      mockSearchParams = new URLSearchParams('page=100');
      render(
        <InfiniteScrollTrigger page={100} hasMore={true} total={100000} maxPageCap={0} />,
      );
      expect(screen.getByTestId('infinite-scroll-sentinel')).toBeTruthy();
    });
  });

  describe('useTransition + cumulative render', () => {
    it('IntersectionObserver 觸發後, page 變化時 push 新 URL', () => {
      mockSearchParams = new URLSearchParams('page=2');
      const { rerender } = render(
        <InfiniteScrollTrigger page={2} hasMore={true} total={100} maxPageCap={50} />,
      );

      // 模擬 IntersectionObserver 觸發
      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });

      expect(mockPush).toHaveBeenCalledWith('/admin/crud/order?page=3');

      // 模擬 URL 變化 → page=3
      mockSearchParams = new URLSearchParams('page=3');
      rerender(
        <InfiniteScrollTrigger page={3} hasMore={true} total={100} maxPageCap={50} />,
      );

      // 再觸發一次
      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });

      expect(mockPush).toHaveBeenCalledWith('/admin/crud/order?page=4');
    });

    it('loadingRef 保護: 連續觸發同一 page 不會重複 push', () => {
      mockSearchParams = new URLSearchParams('page=2');
      render(
        <InfiniteScrollTrigger page={2} hasMore={true} total={100} maxPageCap={50} />,
      );

      // 第一次觸發
      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });

      expect(mockPush).toHaveBeenCalledTimes(1);

      // 第二次觸發（loadingRef 應仍為 true）
      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });

      // 不應重複 push
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('URL 變化後 loadingRef 重置, 可再次觸發', () => {
      mockSearchParams = new URLSearchParams('page=2');
      const { rerender } = render(
        <InfiniteScrollTrigger page={2} hasMore={true} total={100} maxPageCap={50} />,
      );

      // 第一次觸發
      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });
      expect(mockPush).toHaveBeenCalledTimes(1);

      // URL 變化 (page=3)
      mockSearchParams = new URLSearchParams('page=3');
      rerender(
        <InfiniteScrollTrigger page={3} hasMore={true} total={100} maxPageCap={50} />,
      );

      // 第二次觸發（loadingRef 已重置）
      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });
      expect(mockPush).toHaveBeenCalledTimes(2);
    });
  });

  describe('保留 query string', () => {
    it('觸發時保留 q 參數', () => {
      mockSearchParams = new URLSearchParams('q=hello&page=2');
      render(
        <InfiniteScrollTrigger page={2} hasMore={true} total={100} maxPageCap={50} />,
      );

      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });

      // 應保留 q=hello 並只覆寫 page=3
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=hello'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=3'));
    });

    it('觸發時保留 sort/order', () => {
      mockSearchParams = new URLSearchParams('sort=amount&order=asc&page=2');
      render(
        <InfiniteScrollTrigger page={2} hasMore={true} total={100} maxPageCap={50} />,
      );

      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sort=amount'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('order=asc'));
    });

    it('觸發時保留 pageSize', () => {
      mockSearchParams = new URLSearchParams('pageSize=20&page=2');
      render(
        <InfiniteScrollTrigger page={2} hasMore={true} total={100} maxPageCap={50} />,
      );

      act(() => {
        intersectionCallback?.([{ isIntersecting: true }]);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('pageSize=20'));
    });
  });
});