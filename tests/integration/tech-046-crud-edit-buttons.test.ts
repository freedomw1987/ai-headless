/**
 * Sprint 18 Stage 1 — CRUD 編輯按鈕（list + detail）
 *
 * 🅓 設計：
 * - list page：每 row 加「編輯」Button asChild + Edit icon → /admin/crud/<spec>/<id>/edit
 * - detail page：標題區加「編輯」Button asChild + Edit icon → /admin/crud/<spec>/<id>/edit
 * - 兩處用 shadcn Button variant="outline"（與「檢視」/「返回」視覺一致）
 *
 * 守護測試：
 * 1. list page 有「編輯」連結到 /edit
 * 2. list page 有 Edit icon import
 * 3. list page 編輯按鈕是 Button asChild + Link
 * 4. detail page 有「編輯」連結到 /edit
 * 5. detail page 有 Edit icon import
 * 6. detail page 編輯按鈕是 Button asChild + Link
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const LIST_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');
const DETAIL_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/[id]/dynamic-detail-client.tsx');

describe('Sprint 18 Stage 1 — CRUD 編輯按鈕', () => {
  describe('list page 編輯按鈕', () => {
    it('list page 透過 ListRowActions 提供「編輯」連結到 /edit', () => {
      // Sprint 18 Stage 2：list page 是 Server Component，編輯按鈕搬遷到 ListRowActions (client component)
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/ListRowActions/);
      // ListRowActions 內含「編輯」連結
      const rowActionsPath = resolve(ROOT, 'components/admin/list-row-actions.tsx');
      const rowActionsContent = readFileSync(rowActionsPath, 'utf-8');
      expect(rowActionsContent).toMatch(/\/admin\/crud\/\$\{specName\}\/\$\{rowId\}\/edit/);
    });

    it('ListRowActions 用 Pencil icon（取代 Edit）', () => {
      const rowActionsPath = resolve(ROOT, 'components/admin/list-row-actions.tsx');
      const rowActionsContent = readFileSync(rowActionsPath, 'utf-8');
      expect(rowActionsContent).toMatch(/import.*\{[^}]*\bPencil\b[^}]*\}.*from\s+['"]lucide-react['"]/);
    });

    it('ListRowActions 編輯按鈕是 DropdownMenuItem + Link pattern', () => {
      const rowActionsPath = resolve(ROOT, 'components/admin/list-row-actions.tsx');
      const rowActionsContent = readFileSync(rowActionsPath, 'utf-8');
      // DropdownMenuItem 包 Link + Pencil icon + 編輯文字
      expect(rowActionsContent).toMatch(/<DropdownMenuItem[\s\S]*?編輯[\s\S]*?<\/DropdownMenuItem>/);
    });
  });

  describe('detail page 編輯按鈕', () => {
    it('detail page 有 Edit icon import（lucide-react）', () => {
      const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/import.*\{[^}]*\bEdit\b[^}]*\}.*from\s+['"]lucide-react['"]/);
    });

    // Sprint 20 Stage 1 — 編輯按鈕改為 SheetTrigger（不再是 Button asChild + Link → /edit）
    // 詳細 Sheet 行為見 tech-053-sheet-edit-drawer.test.ts
    it('detail page 編輯按鈕改為 SheetTrigger + Button（不再是 Link → /edit）', () => {
      const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
      // SheetTrigger 包 Button
      expect(content).toMatch(/<SheetTrigger\s+asChild>[\s\S]*?<Button[^>]*variant=["']outline["']/);
      // 沒有 Link 到 /edit 了
      expect(content).not.toMatch(/<Link[^>]*href=\{`\/admin\/crud\/\$\{specName\}\/\$\{id\}\/edit`\}>/);
    });
  });
});