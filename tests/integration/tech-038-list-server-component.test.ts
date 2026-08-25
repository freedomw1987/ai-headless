/**
 * Sprint 16 TECH-038a + 038b — list page Server Component 重構
 *
 * 守護測試（structure-based，不啟 dev server）：
 * 1. list page (page.tsx) 不再 import dynamic-list-client
 * 2. list page 直接 fetch items（從 spec + dynamic handler）
 * 3. list page 在 server side 套用 formatter（從 extension）
 * 4. list page 在 server side 渲染 customRenderer（從 extension）
 * 5. 4 個 spec（blog/event/todo/order）的 list page 都為 Server Component
 * 6. dynamic-list-client.tsx 可被刪除（或僅剩測試用途）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');
const CLIENT_PATH = resolve(ROOT, 'app/admin/crud/[spec]/dynamic-list-client.tsx');

describe('Sprint 16 TECH-038 — list page Server Component 重構', () => {
  describe('list page (page.tsx) 結構', () => {
    it('不再 import DynamicListClient', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).not.toContain("from './dynamic-list-client'");
      expect(content).not.toContain("import { DynamicListClient }");
    });

    it('不再 import useEffect / useState（確認為 Server Component）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]react['"]/);
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

    it('在 server side 渲染表格（tbody 內含 cells）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/<tbody/);
      expect(content).toMatch(/<td\b/);
    });

    it('「檢視」連結保留（不刪除既有導航功能）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/href=\{`\/admin\/crud\/\$\{specName\}\/\$\{row\.id\}\`\}/);
    });

    it('「新增」連結保留', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/href=\{`\/admin\/crud\/\$\{specName\}\/new`\}/);
    });
  });

  describe('dynamic-list-client.tsx', () => {
    it('已被刪除（不需要 client component 了）', () => {
      expect(existsSync(CLIENT_PATH)).toBe(false);
    });
  });

  describe('renderCell helper（server side 渲染優先級）', () => {
    it('支援 formatter > 預設（customRenderer 留 Sprint 16 Stage 2）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/function renderCell|const renderCell/);
      expect(content).toMatch(/formatter/);
    });

    it('customRenderer field 顯示 placeholder + 註明 Sprint 16 Stage 2', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/customRenderer/);
      expect(content).toMatch(/Sprint 16 Stage 2/);
    });
  });
});