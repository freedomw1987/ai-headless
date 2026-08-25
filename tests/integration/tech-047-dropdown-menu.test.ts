/**
 * Sprint 18 Stage 2 — dropdown-menu 元件 + list row actions
 *
 * 🅓 設計：
 * - 新增 components/ui/dropdown-menu.tsx（shadcn 標準 6 sub-components）
 * - list page row 最後一格：原本「檢視」+「編輯」改成「⋯」DropdownMenu
 *   - DropdownMenuTrigger：MoreHorizontal icon Button variant="ghost"
 *   - DropdownMenuContent + DropdownMenuItem（檢視、編輯、刪除）
 *
 * 守護測試：
 * 1. components/ui/dropdown-menu.tsx 存在
 * 2. 用 @radix-ui/react-dropdown-menu
 * 3. 6 個 sub-components 全部 export
 * 4. list page 用 DropdownMenu
 * 5. list page 用 MoreHorizontal icon
 * 6. DropdownMenuItem 有「檢視」「編輯」「刪除」三個動作
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const DROPDOWN_PATH = resolve(ROOT, 'components/ui/dropdown-menu.tsx');
const LIST_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');

describe('Sprint 18 Stage 2 — dropdown-menu 元件', () => {
  describe('dropdown-menu 元件檔案', () => {
    it('components/ui/dropdown-menu.tsx 存在', () => {
      expect(existsSync(DROPDOWN_PATH)).toBe(true);
    });

    it('dropdown-menu 用 @radix-ui/react-dropdown-menu', () => {
      const content = readFileSync(DROPDOWN_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@radix-ui\/react-dropdown-menu['"]/);
    });

    it('dropdown-menu 是 client component', () => {
      const content = readFileSync(DROPDOWN_PATH, 'utf-8');
      expect(content).toMatch(/['"]use client['"]/);
    });

    it('dropdown-menu export 至少 6 個 sub-components', () => {
      const content = readFileSync(DROPDOWN_PATH, 'utf-8');
      // shadcn 標準：DropdownMenu / DropdownMenuTrigger / DropdownMenuContent / DropdownMenuItem / DropdownMenuLabel / DropdownMenuSeparator
      // 用 export const X OR export { X, Y, Z, ... } 群組
      const namedExports = content.match(/export\s+\{[\s\S]*?\}/);
      expect(namedExports).toBeTruthy();
      const names = (namedExports![0].match(/^\s*([A-Z]\w+)/gm) ?? []).map((m) => m.trim());
      expect(names.length).toBeGreaterThanOrEqual(6);
      expect(names).toEqual(expect.arrayContaining([
        'DropdownMenu',
        'DropdownMenuTrigger',
        'DropdownMenuContent',
        'DropdownMenuItem',
        'DropdownMenuLabel',
        'DropdownMenuSeparator',
      ]));
    });
  });

  describe('list page 整合', () => {
    it('list page 用 DropdownMenu（透過 ListRowActions）', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // list page 是 Server Component，不直接用 DropdownMenu，
      // 但透過 ListRowActions（client component）使用
      expect(content).toMatch(/ListRowActions/);
      // 確認 ListRowActions 內含 DropdownMenu
      const rowActionsPath = resolve(ROOT, 'components/admin/list-row-actions.tsx');
      const rowActionsContent = readFileSync(rowActionsPath, 'utf-8');
      expect(rowActionsContent).toMatch(/DropdownMenu/);
    });

    it('list page 用 MoreHorizontal icon（透過 ListRowActions）', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // list page 是 Server Component，不直接用 MoreHorizontal
      // 透過 ListRowActions 使用
      const rowActionsPath = resolve(ROOT, 'components/admin/list-row-actions.tsx');
      const rowActionsContent = readFileSync(rowActionsPath, 'utf-8');
      expect(rowActionsContent).toMatch(/import.*MoreHorizontal.*from\s+['"]lucide-react['"]/);
    });

    it('list page DropdownMenuItem 包含檢視、編輯、刪除三個動作（透過 ListRowActions）', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // list page 是 Server Component，不直接用 DropdownMenuItem
      // 透過 ListRowActions 內含三個動作
      const rowActionsPath = resolve(ROOT, 'components/admin/list-row-actions.tsx');
      const rowActionsContent = readFileSync(rowActionsPath, 'utf-8');
      // DropdownMenuItem 區塊
      const itemBlock = rowActionsContent.match(/<DropdownMenuItem[\s\S]*?<\/DropdownMenuContent>/);
      expect(itemBlock).toBeTruthy();
      expect(itemBlock![0]).toMatch(/檢視/);
      expect(itemBlock![0]).toMatch(/編輯/);
      expect(itemBlock![0]).toMatch(/刪除/);
    });
  });
});