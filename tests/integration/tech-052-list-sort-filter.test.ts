// Sprint 19 Stage 3 — list sort + filter TDD 守護測試
//
// 範圍：
// 1. dynamic-handler 支援 ?sort= ?order= ?q= query
// 2. route.ts 讀 sort/order/q
// 3. list page UI 加 sortable header + 搜尋 input
//
// TDD: 寫失敗測試 → 實作 → 通過

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HANDLER = resolve('lib/runtime/dynamic-handler.ts');
const ROUTE = resolve('app/api/crud/[spec]/route.ts');
// Sprint B5: SortableHeaderCell 整合進 CrudListClient
const LIST_PAGE = resolve('app/admin/crud/[spec]/crud-list-client.tsx');
const SORTABLE_HEADER = resolve('components/admin/sortable-header-cell.tsx');

describe('Sprint 19 Stage 3 — list sort + filter', () => {
  describe('handler — sort + filter 支援', () => {
    it('handler 從 ctx.query 讀取 sort 欄位', () => {
      const content = readFileSync(HANDLER, 'utf-8');
      // 讀 ctx.query.sort
      expect(content).toMatch(/ctx\.query\??\.sort/);
    });

    it('handler 從 ctx.query 讀取 order 方向（asc / desc）', () => {
      const content = readFileSync(HANDLER, 'utf-8');
      expect(content).toMatch(/ctx\.query\??\.order/);
    });

    it('handler 套用 orderBy 動態排序（欄位 + 方向）', () => {
      const content = readFileSync(HANDLER, 'utf-8');
      // orderBy: { [sortField]: order }
      expect(content).toMatch(/orderBy:\s*\{\s*\[/);
    });

    it('handler 預設 orderBy 為 createdAt desc（向後相容）', () => {
      const content = readFileSync(HANDLER, 'utf-8');
      // 沒 sort 時仍用 createdAt desc
      // 可能是直接寫死 createdAt 或變數預設為 'createdAt'
      const hasDefault =
        /createdAt:\s*['"]desc['"]/.test(content) ||
        (/sortField/.test(content) && /['"]createdAt['"]/.test(content));
      expect(hasDefault).toBe(true);
    });

    it('handler 對 sort 欄位做白名單檢查（SQL injection 防護）', () => {
      const content = readFileSync(HANDLER, 'utf-8');
      // 檢查 sort 欄位是否在 spec fields 白名單內
      // 簡化：檢查代碼包含 hasField 或 allowedFields 或 includes check
      const hasWhitelist =
        /hasField|allowedFields|fields\??\.some|fields\??\.includes/.test(content);
      expect(hasWhitelist).toBe(true);
    });

    it('handler 從 ctx.query 讀取 q 搜尋', () => {
      const content = readFileSync(HANDLER, 'utf-8');
      expect(content).toMatch(/ctx\.query\??\.q/);
    });

    it('handler 套用 OR contains 搜尋（多欄位）', () => {
      const content = readFileSync(HANDLER, 'utf-8');
      // contains + OR（可寫 contains: rawQ 或 contains: q）
      expect(content).toMatch(/contains:\s*(?:rawQ|q)/);
    });
  });

  describe('route.ts — 讀 sort + order + q', () => {
    it('GET handler 讀 sort query', () => {
      const content = readFileSync(ROUTE, 'utf-8');
      expect(content).toMatch(/searchParams\.get\(['"]sort['"]\)/);
    });

    it('GET handler 讀 order query', () => {
      const content = readFileSync(ROUTE, 'utf-8');
      expect(content).toMatch(/searchParams\.get\(['"]order['"]\)/);
    });

    it('GET handler 讀 q query', () => {
      const content = readFileSync(ROUTE, 'utf-8');
      expect(content).toMatch(/searchParams\.get\(['"]q['"]\)/);
    });

    it('GET handler 把 sort + order + q 傳給 handlers.list()', () => {
      const content = readFileSync(ROUTE, 'utf-8');
      // query object 包含 sort + order + q
      expect(content).toMatch(/query:\s*\{[^}]*sort[^}]*order[^}]*q/s);
    });
  });

  describe('list page — sort + filter UI', () => {
    // Sprint B5: searchParams + form GET 仍在 page.tsx (Server Component)
    const PAGE = resolve('app/admin/crud/[spec]/page.tsx');
    it('list page 從 searchParams 讀 sort + order + q', () => {
      const content = readFileSync(PAGE, 'utf-8');
      expect(content).toMatch(/searchParams:\s*Promise<\{[^}]*sort[^}]*order[^}]*q/s);
    });

    it('list page 顯示搜尋 input（搜尋全部欄位）', () => {
      const content = readFileSync(PAGE, 'utf-8');
      // <Input type="search" name="q"> 或類似
      expect(content).toMatch(/name=["']q["']/);
    });

    it('list page 用 form GET 提交搜尋', () => {
      const content = readFileSync(PAGE, 'utf-8');
      // <form method="GET"> 含 q input
      expect(content).toMatch(/<form[^>]*method=["']GET["']/);
    });

    it('CrudListClient 用 SortableHeaderCell 包覆 sortable 連結', () => {
      // Sprint B5: SortableHeaderCell 整合進 CrudListClient (透過 renderHeader prop)
      const clientContent = readFileSync(resolve('app/admin/crud/[spec]/crud-list-client.tsx'), 'utf-8');
      expect(clientContent).toMatch(/<SortableHeaderCell/);
      const cellContent = readFileSync(SORTABLE_HEADER, 'utf-8');
      // client wrapper 內含 sort + order URL params
      expect(cellContent).toMatch(/params\.set\(['"]sort['"]/);
      expect(cellContent).toMatch(/params\.set\(['"]order['"]/);
    });

    it('SortableHeaderCell 顯示方向箭頭（根據 order 動態選擇 icon）', () => {
      const cellContent = readFileSync(SORTABLE_HEADER, 'utf-8');
      expect(cellContent).toMatch(/ChevronUp|ChevronDown|ArrowUpDown/);
      // 根據 isSorted + order 動態選擇 icon
      expect(cellContent).toMatch(/isSorted\s*\?/);
    });
  });
});
