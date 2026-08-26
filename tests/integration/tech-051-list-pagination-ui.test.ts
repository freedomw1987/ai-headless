// Sprint 19 Stage 2 — list page 嵌入 pagination UI + URL 同步
//
// TDD 守護測試 — 寫失敗測試 → 實作 → 通過
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LIST_PAGE = resolve('app/admin/crud/[spec]/page.tsx');
const PAGINATION = resolve('components/ui/pagination.tsx');

describe('Sprint 19 Stage 2 — list page 嵌入 pagination UI', () => {
  describe('list page — pagination UI 整合', () => {
    it('list page 引入 Pagination 元件', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/import\s*\{[^}]*\bPagination\b[^}]*\}\s*from\s+['"]@\/components\/ui\/pagination['"]/);
    });

    it('list page 用 PaginationContent + PaginationItem 結構', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/<Pagination>/);
      expect(content).toMatch(/<PaginationContent>/);
    });

    it('list page 顯示「上一頁」PaginationPrevious（page>1 時）', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/<PaginationPrevious/);
    });

    it('list page 顯示「下一頁」PaginationNext（page<totalPages 時）', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/<PaginationNext/);
    });

    it('list page 顯示頁碼 PaginationLink（中間頁）', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/<PaginationLink[^>]*>/);
    });

    it('list page 顯示當前頁 isActive', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/<PaginationLink[^>]*isActive/);
    });
  });

  describe('list page — URL 同步', () => {
    it('list page 用 Next.js <Link> 組成分頁 URL', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      // 既有 from 'next/link' import
      expect(content).toMatch(/import\s+Link\s+from\s+['"]next\/link['"]/);
      // 在 pagination 部分用 Link 或 page URL 構造
      // 簡單驗證：list page 內有 buildPageHref 或 page= URL 字串
      expect(content).toMatch(/(?:buildPageHref|page=|page=&)/);
    });

    it('list page searchParams 接收 page + pageSize', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/searchParams:\s*Promise<\{[^}]*page[^}]*pageSize/s);
    });
  });

  describe('list page — 分頁資訊可見', () => {
    it('list page 顯示「共 N 筆資料」資訊（header 區）', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/共\s*\{total\}\s*筆資料/);
    });

    it('list page 顯示「顯示 X 到 Y 筆」分頁資訊', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      // 顯示第 (page - 1) * pageSize + 1 到 ...
      expect(content).toMatch(/顯示第.*?page\s*-\s*1/);
    });

    it('list page Pagination 只在 totalPages>1 時顯示', () => {
      const content = readFileSync(LIST_PAGE, 'utf-8');
      expect(content).toMatch(/\{totalPages\s*>\s*1\s*&&\s*\(/);
    });
  });

  describe('PaginationLink — 接受 Next.js Link 包裝', () => {
    it('Pagination 元件使用 <a> 元素（標準 HTML）', () => {
      const content = readFileSync(PAGINATION, 'utf-8');
      // PaginationLink 是 <a> rendered（shadcn 標準）
      expect(content).toMatch(/PaginationLink[\s\S]*?<a/);
    });
  });
});
