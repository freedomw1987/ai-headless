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
    it('list page 有「編輯」連結到 /edit', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/href=\{?`\/admin\/crud\/\$\{specName\}\/\$\{row\.id\}\/edit`\}?/);
    });

    it('list page 有 Edit icon import（lucide-react）', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/import.*\{[^}]*\bEdit\b[^}]*\}.*from\s+['"]lucide-react['"]/);
    });

    it('list page 編輯按鈕用 Button asChild + Link pattern', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      // 找「編輯」文字附近的 Button asChild 結構
      expect(content).toMatch(/<Button[^>]*asChild[^>]*>\s*<Link[^>]*edit/);
      expect(content).toMatch(/<Edit\s*\/?>/);
      expect(content).toMatch(/編輯/);
    });
  });

  describe('detail page 編輯按鈕', () => {
    it('detail page 有「編輯」連結到 /edit', () => {
      const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
      // 用 .includes() 簡單確認
      expect(content).toMatch(/\/edit['"`]/);
    });

    it('detail page 有 Edit icon import（lucide-react）', () => {
      const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/import.*\{[^}]*\bEdit\b[^}]*\}.*from\s+['"]lucide-react['"]/);
    });

    it('detail page 編輯按鈕是 Button asChild + Link', () => {
      const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
      expect(content).toMatch(/<Button[^>]*asChild/);
      expect(content).toMatch(/<Link[^>]*\/edit/);
    });
  });
});