// Sprint E2 (CRUD 列表頁增強 v1.1) — useMediaQuery Hook
//
// 偵測 viewport 是否符合 CSS media query。
//
// 設計重點：
// - SSR 安全：無 window 時回傳 false
// - 避免 hydration mismatch：初始 render 回傳固定值，client mount 後才偵測
// - 監聽 resize 自動更新（透過 matchMedia change event）
//
// 用法：
// ```tsx
// const isMobile = useMediaQuery('(max-width: 767px)');
// ```
//
// Gate 1 TDD: 見 tests/integration/use-media-query.test.ts

'use client';

import { useState, useEffect } from 'react';

/**
 * @param query CSS media query string，例如 '(max-width: 767px)'、'(min-width: 768px)'
 * @returns boolean - 是否符合
 */
export function useMediaQuery(query: string): boolean {
  // 初始固定為 false，避免 hydration mismatch
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // SSR / 無 window 環境：保持 false
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    // 監聽變動
    function onChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    // 新 API (Safari 14+)
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }

    // 舊 API fallback
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}