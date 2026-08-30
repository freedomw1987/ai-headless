/**
 * Sprint E2 — useMediaQuery Hook TDD
 *
 * 設計：
 * - 偵測 viewport 是否符合 CSS media query
 * - SSR 安全：初始 false，client mount 後才偵測（避免 hydration mismatch）
 * - 監聽 window resize 自動更新
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

describe('useMediaQuery', () => {
  // 預先 mock window.matchMedia
  function setMatchMedia(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  it('SSR 環境（無 window.matchMedia）回傳 false', () => {
    // mock matchMedia 不存在
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('client mount 後偵測 matchMedia，回傳正確 boolean', () => {
    setMatchMedia(true);
    const { result } = renderHook(() =>
      useMediaQuery('(max-width: 767px)'),
    );
    // 因為 renderHook 同步觸發 effect，現在應該是 true
    expect(result.current).toBe(true);
  });

  it('matchMedia 不存在時仍可正常使用 (不 crash)', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });

    expect(() => {
      renderHook(() => useMediaQuery('(max-width: 767px)'));
    }).not.toThrow();
  });

  it('viewport 變動時自動更新', () => {
    let mockMatches = false;
    const listeners: Array<(e: { matches: boolean }) => void> = [];

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return mockMatches;
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
          listeners.push(cb);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

    // 觸發 resize 事件
    act(() => {
      mockMatches = true;
      listeners.forEach((cb) => cb({ matches: true }));
    });

    expect(result.current).toBe(true);

    // 再切回 false
    act(() => {
      mockMatches = false;
      listeners.forEach((cb) => cb({ matches: false }));
    });

    expect(result.current).toBe(false);
  });

  it('unmount 時移除 listener', () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener,
        dispatchEvent: vi.fn(),
      })),
    });

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  // 注意：不測「window 完全不存在」的場景 — 因為 React 內部需要 window。
  // 真實 SSR 場景是 window 存在但 matchMedia 不存在（舊瀏覽器或某些環境）。
});