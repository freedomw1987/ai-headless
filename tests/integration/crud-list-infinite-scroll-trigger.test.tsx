/**
 * Sprint A1 TDD — InfiniteScrollTrigger client component
 *
 * 測試重點:
 * - 預設不顯示「已顯示全部」(hasMore=true 時)
 * - hasMore=false 時顯示「已顯示全部 N 筆」
 * - 觸發 IntersectionObserver 時呼叫 router.push(`?page=N+1`)
 * - isPending=true 時顯示「載入中...」
 * - 保留現有 query string (q / sort / order / pageSize)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { InfiniteScrollTrigger } from '@/app/admin/crud/[spec]/infinite-scroll-trigger';

// Mock next/navigation — 用 mutable 變數以便每個 test 改變
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

class MockIntersectionObserver {
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
}

beforeEach(() => {
  mockPush.mockClear();
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  intersectionCallback = null;
  mockSearchParams = new URLSearchParams('page=2');
  mockPathname = '/admin/crud/order';
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = MockIntersectionObserver;
});

describe('Sprint A1 — InfiniteScrollTrigger', () => {
  it('hasMore=true 時: 渲染 sentinel, 提示「捲動以載入更多」', () => {
    render(<InfiniteScrollTrigger page={1} hasMore={true} total={100} />);
    expect(screen.getByText('捲動以載入更多')).toBeTruthy();
  });

  it('hasMore=false 時: 顯示「已顯示全部 N 筆」', () => {
    render(<InfiniteScrollTrigger page={5} hasMore={false} total={100} />);
    expect(screen.getByText('已顯示全部 100 筆')).toBeTruthy();
  });

  it('IntersectionObserver 監聽 sentinel ref', () => {
    render(<InfiniteScrollTrigger page={1} hasMore={true} total={100} />);
    expect(mockObserve).toHaveBeenCalledTimes(1);
  });

  it('sentinel 進入視窗 → 呼叫 router.push 帶 ?page=N+1', () => {
    render(<InfiniteScrollTrigger page={2} hasMore={true} total={100} />);

    act(() => {
      intersectionCallback!([{ isIntersecting: true }]);
    });

    expect(mockPush).toHaveBeenCalledWith('/admin/crud/order?page=3');
  });

  it('sentinel 離開視窗 → 不呼叫 router.push', () => {
    render(<InfiniteScrollTrigger page={2} hasMore={true} total={100} />);

    act(() => {
      intersectionCallback!([{ isIntersecting: false }]);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('hasMore=false → 移除 IntersectionObserver, 不再觸發', () => {
    const { rerender } = render(<InfiniteScrollTrigger page={5} hasMore={true} total={100} />);
    expect(mockObserve).toHaveBeenCalledTimes(1);

    rerender(<InfiniteScrollTrigger page={5} hasMore={false} total={100} />);
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('保留現有 query string (q / sort / order / pageSize) — 只覆寫 page', () => {
    mockSearchParams = new URLSearchParams('q=alice&sort=createdAt&order=desc&pageSize=20&page=1');
    render(<InfiniteScrollTrigger page={1} hasMore={true} total={100} />);

    act(() => {
      intersectionCallback!([{ isIntersecting: true }]);
    });

    // 應該帶齊 q / sort / order / pageSize + page=2
    expect(mockPush).toHaveBeenCalledTimes(1);
    const calledUrl = (mockPush.mock.calls[0] as unknown as [string])[0];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('q=alice');
    expect(calledUrl).toContain('sort=createdAt');
    expect(calledUrl).toContain('order=desc');
    expect(calledUrl).toContain('pageSize=20');
  });
});
