/**
 * Sprint 18 Stage 2 — pagination 元件 + list 分頁
 *
 * 🅓 設計（簡化方案）：
 * - 不動後端 API（避免破壞既有 contract）
 * - list page (Server Component) 抓最多 100 筆
 * - 加 Pagination 元件（shadcn 標準）+ PaginationNav 邏輯：URL ?page=1
 * - 顯示 page size = 10，每頁 10 筆
 *
 * Sprint 18 範圍：純 client side 分頁（先 UI 元件 + 邏輯）
 * 未來 Sprint 19+：可改為 server side skip/take
 *
 * 守護測試：
 * 1. components/ui/pagination.tsx 存在
 * 2. 用 shadcn pattern（ChevronLeft / ChevronRight / MoreHorizontal icons）
 * 3. list page 載入所有 items（仍是 Server Component fetch all）
 * 4. list page 用 useState or query string 處理當前 page
 * 5. 顯示「顯示 X 到 Y，共 Z 筆」
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PAGINATION_PATH = resolve(ROOT, 'components/ui/pagination.tsx');
const LIST_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');
const LIST_NAV_PATH = resolve(ROOT, 'components/admin/list-pagination-nav.tsx');

describe('Sprint 18 Stage 2 — pagination 元件 + list 分頁', () => {
  describe('pagination 元件檔案', () => {
    it('components/ui/pagination.tsx 存在', () => {
      expect(existsSync(PAGINATION_PATH)).toBe(true);
    });

    it('pagination 用 ChevronLeft / ChevronRight / MoreHorizontal icons', () => {
      const content = readFileSync(PAGINATION_PATH, 'utf-8');
      expect(content).toMatch(/ChevronLeft/);
      expect(content).toMatch(/ChevronRight/);
      expect(content).toMatch(/MoreHorizontal/);
    });

    it('pagination 是 client component', () => {
      const content = readFileSync(PAGINATION_PATH, 'utf-8');
      expect(content).toMatch(/['"]use client['"]/);
    });

    it('pagination export 至少 6 個 sub-components（shadcn 標準）', () => {
      const content = readFileSync(PAGINATION_PATH, 'utf-8');
      const namedExports = content.match(/export\s+\{[\s\S]*?\}/);
      expect(namedExports).toBeTruthy();
      const names = (namedExports![0].match(/^\s*([A-Z]\w+)/gm) ?? []).map((m) => m.trim());
      expect(names.length).toBeGreaterThanOrEqual(6);
      // shadcn 標準 sub-components
      expect(names).toEqual(expect.arrayContaining([
        'Pagination',
        'PaginationContent',
        'PaginationItem',
        'PaginationLink',
        'PaginationNext',
        'PaginationPrevious',
      ]));
    });
  });

  describe('list page 整合', () => {
    it('components/admin/list-pagination-nav.tsx 存在', () => {
      expect(existsSync(LIST_NAV_PATH)).toBe(true);
    });

    it('ListPaginationNav 用 Pagination 元件', () => {
      const content = readFileSync(LIST_NAV_PATH, 'utf-8');
      expect(content).toMatch(/Pagination/);
    });

    it('ListPaginationNav 接收 items + pageSize', () => {
      const content = readFileSync(LIST_NAV_PATH, 'utf-8');
      expect(content).toMatch(/items:/);
      expect(content).toMatch(/pageSize/);
    });

    it('ListPaginationNav 顯示「顯示 X 到 Y，共 Z 筆」', () => {
      const content = readFileSync(LIST_NAV_PATH, 'utf-8');
      expect(content).toMatch(/共/);
      expect(content).toMatch(/筆/);
    });
  });
});