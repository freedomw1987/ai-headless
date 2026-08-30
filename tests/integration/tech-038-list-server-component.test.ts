/**
 * Sprint 16 TECH-038a + 038b — list page Server Component 重構
 * Sprint B5 — 架構變更：list page 引入 CrudListClient (client component)
 *
 * 守護測試（structure-based，不啟 dev server）：
 * 1. list page (page.tsx) 仍為 Server Component (無 useState/useEffect)
 * 2. list page 直接 fetch items（從 spec + dynamic handler）
 * 3. list page 用 cell-display.ts 處理 formatter > 預設優先級
 * 4. list page 把 table + toolbar 整合交給 CrudListClient
 * 5. dynamic-list-client.tsx 已被刪除
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');
const CLIENT_PATH = resolve(ROOT, 'app/admin/crud/[spec]/dynamic-list-client.tsx');
const CELL_DISPLAY_PATH = resolve(ROOT, 'lib/runtime/cell-display.ts');
const CRUD_LIST_CLIENT_PATH = resolve(ROOT, 'app/admin/crud/[spec]/crud-list-client.tsx');
const CRUD_LIST_TABLE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/crud-list-table.tsx');

describe('Sprint 16 TECH-038 + Sprint B5 — list page 結構', () => {
  describe('list page (page.tsx) Server Component', () => {
    it('不再 import DynamicListClient', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).not.toContain("from './dynamic-list-client'");
      expect(content).not.toContain("import { DynamicListClient }");
    });

    it('仍為 Server Component（無 useState / useEffect）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      // 不 import React hooks
      expect(content).not.toMatch(/import\s+\{[^}]*\buseState\b[^}]*\}\s+from\s+['"]react['"]/);
      expect(content).not.toMatch(/import\s+\{[^}]*\buseEffect\b[^}]*\}\s+from\s+['"]react['"]/);
    });

    it('import dynamic handler 用於 server side fetch items', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/createDynamicHandlers/);
    });

    it('import loadFormatters 用於 server side 套用 formatter', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/loadFormatters/);
    });

    it('Sprint 16 Stage 2 才支援 customRenderer（不 import loadCustomRenderers）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/loadCustomRenderers/);
    });

    it('Sprint B5: 表格渲染交給 CrudListClient（client component）', () => {
      const pageContent = readFileSync(PAGE_PATH, 'utf-8');
      const clientContent = readFileSync(CRUD_LIST_CLIENT_PATH, 'utf-8');
      // page.tsx 用 CrudListClient
      expect(pageContent).toMatch(/CrudListClient/);
      // CrudListClient 用 CrudListTable
      expect(clientContent).toMatch(/CrudListTable/);
      // CrudListTable 用 shadcn TableBody / TableCell
      const tableContent = readFileSync(CRUD_LIST_TABLE_PATH, 'utf-8');
      expect(tableContent).toMatch(/<TableBody/);
      expect(tableContent).toMatch(/<TableCell/);
    });

    it('「檢視」連結保留（透過 CrudListClient.renderActions → ListRowActions）', () => {
      const clientContent = readFileSync(CRUD_LIST_CLIENT_PATH, 'utf-8');
      expect(clientContent).toMatch(/ListRowActions/);
      const rowActionsPath = resolve(ROOT, 'components/admin/list-row-actions.tsx');
      const rowActionsContent = readFileSync(rowActionsPath, 'utf-8');
      expect(rowActionsContent).toMatch(/href=\{`\/admin\/crud\/\$\{specName\}\/\$\{rowId\}`\}/);
    });

    it('「新增」按鈕不在 CrudListClient toolbar (Sprint D+ 移除，僅保留 page header 的大按鈕)', () => {
      const clientContent = readFileSync(CRUD_LIST_CLIENT_PATH, 'utf-8');
      // toolbar 內不應再有 `href=.../new` 連結
      expect(clientContent).not.toMatch(/href=\{?[`'"]?\/admin\/crud\/\$\{specName\}\/new/);
    });
  });

  describe('dynamic-list-client.tsx', () => {
    it('已被刪除（不需要舊 client component 了）', () => {
      expect(existsSync(CLIENT_PATH)).toBe(false);
    });
  });

  describe('Sprint B5 — cell-display.ts 取代 renderCell helper', () => {
    it('cell-display.ts 存在且處理 formatter > 預設優先級', () => {
      expect(existsSync(CELL_DISPLAY_PATH)).toBe(true);
      const content = readFileSync(CELL_DISPLAY_PATH, 'utf-8');
      expect(content).toMatch(/renderCellDisplay|buildDisplayRows/);
      expect(content).toMatch(/formatter/);
    });

    it('page.tsx 用 buildDisplayRows（取代舊 renderCell helper）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/buildDisplayRows/);
    });
  });
});
