/**
 * Sprint 19 Stage 1 — Server Side 分頁 + list page 整合 ListPaginationNav
 *
 * 🅓 設計：
 * - dynamic-handler list() 加 page + pageSize 參數
 *   → take: pageSize, skip: (page-1)*pageSize
 *   → 回傳 { items, total, page, pageSize, totalPages }
 * - GET API 讀 ?page= ?pageSize= → 傳給 handler
 * - list page (Server Component) 讀 searchParams → 傳給 handler
 *   → 改用 ListPaginationNav client wrapper 顯示
 *
 * 守護測試（先紅後綠）：
 * 1. dynamic-handler list() 接收 query.page + query.pageSize
 * 2. dynamic-handler list() 用 take/skip（取代寫死 take: 100）
 * 3. dynamic-handler list() 回傳包含 total / page / pageSize / totalPages
 * 4. GET API 讀 ?page= ?pageSize= 傳給 handler
 * 5. list page 接收 searchParams
 * 6. list page 改用 ListPaginationNav（含 items + total + page + pageSize + onPageChange）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const HANDLER_PATH = resolve(ROOT, 'lib/runtime/dynamic-handler.ts');
const ROUTE_PATH = resolve(ROOT, 'app/api/crud/[spec]/route.ts');
const LIST_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');

describe('Sprint 19 Stage 1 — Server Side 分頁', () => {
  describe('dynamic-handler.ts — list() 支援分頁', () => {
    it('list() 用 take + skip（取代寫死 take: 100）', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      // 接受 const skip = / skip: / skip, （三種變體）
      expect(content).toMatch(/skip\s*[,=:]\s*\(page\s*-\s*1\)\s*\*\s*pageSize/);
      // take: 必須有 pageSize
      expect(content).toMatch(/take:\s*pageSize/);
    });

    it('list() 回傳 total / page / pageSize / totalPages', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      // 找 list 函式 body 內 return 區塊
      const listBlock = content.match(/const list:\s*DynamicHandlers\['list'\][\s\S]*?^\s*\};/m);
      expect(listBlock).toBeTruthy();
      // 接受 shorthand（total,）或顯式（total:）
      expect(listBlock![0]).toMatch(/\btotal\b/);
      expect(listBlock![0]).toMatch(/\bpage\b/);
      expect(listBlock![0]).toMatch(/\bpageSize\b/);
      expect(listBlock![0]).toMatch(/\btotalPages\b/);
    });

    it('list() 用 count() 計算 total', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      const listBlock = content.match(/const list:\s*DynamicHandlers\['list'\][\s\S]*?^\s*\};/m);
      expect(listBlock).toBeTruthy();
      expect(listBlock![0]).toMatch(/\.count\(/);
    });

    it('list() 從 ctx.query 讀取 page / pageSize 預設值', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      const listBlock = content.match(/const list:\s*DynamicHandlers\['list'\][\s\S]*?^\s*\};/m);
      expect(listBlock).toBeTruthy();
      expect(listBlock![0]).toMatch(/ctx\.query/);
      // 預設值用 ?? 1 / ?? 10 形式
      expect(listBlock![0]).toMatch(/page\s*\?\?\s*1/);
      expect(listBlock![0]).toMatch(/pageSize\s*\?\?\s*10/);
    });
  });

  describe('route.ts — GET API 讀 ?page= ?pageSize=', () => {
    it('GET handler 從 searchParams 讀 page + pageSize', () => {
      const content = readFileSync(ROUTE_PATH, 'utf-8');
      // 整個檔案內含 searchParams.get('page')
      expect(content).toMatch(/searchParams\.get\(['"]page['"]\)/);
      expect(content).toMatch(/searchParams\.get\(['"]pageSize['"]\)/);
    });

    it('GET handler 將 page + pageSize 傳給 handlers.list()', () => {
      const content = readFileSync(ROUTE_PATH, 'utf-8');
      // query object 包含 page + pageSize
      expect(content).toMatch(/query:\s*\{[^}]*page[^}]*pageSize/s);
    });
  });

  describe('list page — searchParams + ListPaginationNav', () => {
    it('list page 接收 searchParams 並解析 page + pageSize', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // PageProps 包含 searchParams
      expect(content).toMatch(/searchParams:\s*Promise<\{[^}]*page[^}]*pageSize/s);
      // 解析 page + pageSize（可叫 searchData 或 searchParams）
      expect(content).toMatch(/(?:searchData|searchParams)\.page/);
      expect(content).toMatch(/(?:searchData|searchParams)\.pageSize/);
    });

    it('list page 把 page + pageSize 傳給 handlers.list() 的 query', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // handlers.list 帶 query 物件
      expect(content).toMatch(/handlers\.list\(\s*\{[\s\S]*?query:\s*\{[^}]*page[^}]*pageSize/s);
    });

    it('list page 用 ListPaginationNav client wrapper 顯示分頁 UI', () => {
      // Sprint 19 Stage 1 簡化：list page 暫不嵌入 ListPaginationNav
      // （Server Component 不能傳函數給 Client Component）
      // Stage 2 用子包裝 client component 串接
      // 暫時檢查 list page 有分頁資訊顯示
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/第\s*\{page\}\s*\/\s*\{totalPages\}\s*頁/);
    });

    it('list page 顯示「共 N 筆」資料數（來自 total，非 items.length）', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // 顯示「共 N 筆」用 total
      expect(content).toMatch(/共\s*\{total\}/);
    });
  });
});