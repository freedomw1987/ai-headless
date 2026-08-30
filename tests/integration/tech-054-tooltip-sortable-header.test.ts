/**
 * Sprint 20 Stage 2 — Tooltip 元件 + sortable header 場景
 *
 * 🅓 設計：
 * - Tooltip 元件 = shadcn 標準（Radix UI @radix-ui/react-tooltip，內建鍵盤 + a11y）
 * - 場景：list page sortable header 加 Tooltip「點擊切換排序」+ 顯示目前排序狀態
 * - 為什麼選 sortable header：Sprint 19 Stage 3 加的排序功能互動不明顯，新用戶不知道可以點
 * - 架構：list page 是 Server Component，Tooltip 是 client → 抽 SortableHeaderCell client wrapper
 *
 * 守護測試：
 * 1. Tooltip 元件存在
 * 2. Tooltip 從 @radix-ui/react-tooltip import
 * 3. Tooltip exports Tooltip / TooltipTrigger / TooltipContent / TooltipProvider
 * 4. SortableHeaderCell client wrapper 存在
 * 5. SortableHeaderCell 用 TooltipProvider > Tooltip > TooltipTrigger > TooltipContent
 * 6. TooltipContent 顯示「點擊切換排序」文案
 * 7. TooltipContent 顯示當前排序狀態（升冪 / 降冪 / 未排序）
 * 8. list page 用 SortableHeaderCell（Server Component 用 client wrapper）
 * 9. 移除 list page 內直接用的 buildSortHref function（已移到 client wrapper）
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const TOOLTIP_PATH = resolve(ROOT, 'components/ui/tooltip.tsx');
const SORTABLE_HEADER_PATH = resolve(ROOT, 'components/admin/sortable-header-cell.tsx');
const LIST_PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');

describe('Sprint 20 Stage 2 — Tooltip 元件 + sortable header 場景', () => {
  describe('Tooltip 元件', () => {
    it('components/ui/tooltip.tsx 存在', () => {
      const content = readFileSync(TOOLTIP_PATH, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('Tooltip 從 @radix-ui/react-tooltip import', () => {
      const content = readFileSync(TOOLTIP_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@radix-ui\/react-tooltip['"]/);
    });

    it('Tooltip exports Tooltip / TooltipTrigger / TooltipContent / TooltipProvider', () => {
      const content = readFileSync(TOOLTIP_PATH, 'utf-8');
      expect(content).toMatch(/export\s+\{[^}]*\bTooltip\b[^}]*\}/);
      expect(content).toMatch(/export\s+\{[^}]*\bTooltipTrigger\b[^}]*\}/);
      expect(content).toMatch(/export\s+\{[^}]*\bTooltipContent\b[^}]*\}/);
      expect(content).toMatch(/export\s+\{[^}]*\bTooltipProvider\b[^}]*\}/);
    });
  });

  describe('SortableHeaderCell client wrapper', () => {
    it('components/admin/sortable-header-cell.tsx 存在（client component）', () => {
      const content = readFileSync(SORTABLE_HEADER_PATH, 'utf-8');
      expect(content).toMatch(/['"]use client['"]/);
    });

    it('SortableHeaderCell 用 TooltipProvider 包覆（每個 cell 自帶 provider 隔離狀態）', () => {
      // P3 記錄：未來可重構為 SortableHeader 整個 TableHeader 共享 Provider
      const content = readFileSync(SORTABLE_HEADER_PATH, 'utf-8');
      expect(content).toMatch(/import\s+\{[^}]*\bTooltipProvider\b[^}]*\}[^;]*from\s+['"]@\/components\/ui\/tooltip['"]/);
      expect(content).toMatch(/<TooltipProvider[^>]*>/);
    });

    it('SortableHeaderCell 用 Tooltip + TooltipTrigger asChild 包 Link', () => {
      const content = readFileSync(SORTABLE_HEADER_PATH, 'utf-8');
      expect(content).toMatch(/<Tooltip>[\s\S]*?<TooltipTrigger\s+asChild>[\s\S]*?<Link/);
    });

    it('TooltipContent 顯示「點擊切換排序」文案', () => {
      const content = readFileSync(SORTABLE_HEADER_PATH, 'utf-8');
      expect(content).toMatch(/<TooltipContent[^>]*>[\s\S]*?點擊切換排序/);
    });

    it('TooltipContent 顯示當前排序狀態（升冪 / 降冪 / 未排序）', () => {
      const content = readFileSync(SORTABLE_HEADER_PATH, 'utf-8');
      // 三種狀態
      expect(content).toMatch(/['"]未排序['"]/);
      expect(content).toMatch(/升冪|升序/);
      expect(content).toMatch(/降冪|降序/);
    });
  });

  describe('list page 整合', () => {
    it('list page 用 SortableHeaderCell（不改為 client component）', () => {
      // Sprint B 改架構: SortableHeaderCell 從 page.tsx 搬到 CrudListClient (client component)
      const crudListClientPath = resolve(ROOT, 'app/admin/crud/[spec]/crud-list-client.tsx');
      const crudListClientContent = readFileSync(crudListClientPath, 'utf-8');
      expect(crudListClientContent).toMatch(/import.*\{[^}]*\bSortableHeaderCell\b[^}]*\}.*from\s+['"]@\/components\/admin\/sortable-header-cell['"]/);
      expect(crudListClientContent).toMatch(/<SortableHeaderCell/);
    });

    it('list page 已移除直接用 Tooltip（避免把 Server Component 變 client）', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]@\/components\/ui\/tooltip['"]/);
    });

    it('list page 移除已 unused 的 buildSortHref function（邏輯移到 client wrapper）', () => {
      const content = readFileSync(LIST_PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/function\s+buildSortHref\s*\(/);
    });
  });
});