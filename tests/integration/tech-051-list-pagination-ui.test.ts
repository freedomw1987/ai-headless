// Sprint A — list page 從按鈕 pagination 改為 infinite scroll
// (從 Sprint 19 Stage 2 改寫)
//
// TDD 守護測試 — 寫失敗測試 → 實作 → 通過
//
// 變更摘要：
// - 移除 <Pagination> 元件，改用 <InfiniteScrollTrigger> client component
// - 仍保留 ?page=N URL 語意，server component 從 page=1 累積到 page=N
// - 保留「共 N 筆資料」「顯示第 X 到 Y 筆」資訊文字

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Sprint B5: list page 把 InfiniteScrollTrigger 整合進 CrudListClient
// 所以 'list page 結構' 測試改 grep CrudListClient
const LIST_PAGE = resolve('app/admin/crud/[spec]/crud-list-client.tsx');
const TRIGGER = resolve('app/admin/crud/[spec]/infinite-scroll-trigger.tsx');

describe('Sprint A — list page infinite scroll', () => {
  describe('list page — InfiniteScrollTrigger 整合', () => {
    it('list page 引入 InfiniteScrollTrigger 元件', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/import\s*\{[^}]*\bInfiniteScrollTrigger\b[^}]*\}\s*from\s+['"]@\/app\/admin\/crud\/\[spec\]\/infinite-scroll-trigger['"]/);
    });

    it('list page 在表格底部使用 <InfiniteScrollTrigger>', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/<InfiniteScrollTrigger/);
      expect(content).toMatch(/hasMore=\{page\s*<\s*totalPages\}/);
    });

    it('list page 不再使用 Pagination / PaginationLink / PaginationNext 等舊元件', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).not.toMatch(/<Pagination>/);
      expect(content).not.toMatch(/<PaginationLink/);
      expect(content).not.toMatch(/<PaginationNext/);
      expect(content).not.toMatch(/<PaginationPrevious/);
    });
  });

  describe('list page — URL 同步', () => {
    const PAGE = resolve('app/admin/crud/[spec]/page.tsx');
    it('list page 用 Next.js <Link> 組成連結', () => {
      const content = readFileSync(PAGE, 'utf-8');
      expect(content).toMatch(/import\s+Link\s+from\s+['"]next\/link['"]/);
    });

    it('list page searchParams 接收 page + pageSize', () => {
      const content = readFileSync(PAGE, 'utf-8');
      expect(content).toMatch(/searchParams:\s*Promise<\{[^}]*page[^}]*pageSize/s);
    });
  });

  describe('list page — 分頁資訊可見', () => {
    const PAGE = resolve('app/admin/crud/[spec]/page.tsx');
    it('list page 顯示「共 N 筆資料」資訊（header 區，在 page.tsx）', () => {
      const content = readFileSync(PAGE, 'utf-8');
      expect(content).toMatch(/共\s*\{total\}\s*筆資料/);
    });

    it('CrudListClient 顯示「已載入 X / Y 筆」分頁資訊 (Sprint A infinite scroll)', () => {
      const content = readFileSync(resolve('app/admin/crud/[spec]/crud-list-client.tsx'), 'utf-8');
      expect(content).toMatch(/已載入\s*\{rows\.length\}/);
      expect(content).toMatch(/總\{total\}|共\s*\{total\}/);
    });
  });

  describe('InfiniteScrollTrigger 元件存在', () => {
    it('元件有 IntersectionObserver 監聽', () => {
      const content = readFileSync(TRIGGER, 'utf-8');
      expect(content).toMatch(/IntersectionObserver/);
    });

    it('元件有 rootMargin 200px 觸發距離', () => {
      const content = readFileSync(TRIGGER, 'utf-8');
      expect(content).toMatch(/rootMargin:\s*['"]200px['"]/);
    });

    it('元件有 useTransition + router.push', () => {
      const content = readFileSync(TRIGGER, 'utf-8');
      expect(content).toMatch(/useTransition/);
      expect(content).toMatch(/router\.push/);
    });
  });
});
