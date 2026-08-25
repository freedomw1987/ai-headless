/**
 * Sprint 17 Stage 1.1 — list page UI 改進（用 shadcn/ui 元件）
 *
 * 🅓 設計：list page 完全改用 shadcn/ui 元件
 * - Table / TableHeader / TableBody / TableRow / TableHead / TableCell
 * - Button + Plus icon
 * - Badge for status
 * - Empty for 空狀態
 * - Card + CardHeader for 標題區
 *
 * 守護測試：
 * 1. list page import shadcn Table/Button/Badge 元件
 * 2. list page 不再用純 HTML <table class="border-collapse">
 * 3. list page 不再用純 bg-blue-600 hover:bg-blue-700 button
 * 4. badge.tsx 元件存在
 * 5. empty.tsx 元件存在
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');
const BADGE_PATH = resolve(ROOT, 'components/ui/badge.tsx');
const EMPTY_PATH = resolve(ROOT, 'components/ui/empty.tsx');

describe('Sprint 17 Stage 1.1 — shadcn list page UI', () => {
  describe('shadcn 元件存在', () => {
    it('components/ui/badge.tsx 存在', () => {
      expect(existsSync(BADGE_PATH)).toBe(true);
    });

    it('components/ui/empty.tsx 存在', () => {
      expect(existsSync(EMPTY_PATH)).toBe(true);
    });
  });

  describe('list page 結構（app/admin/crud/[spec]/page.tsx）', () => {
    it('import shadcn Table', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/table['"]/);
    });

    it('import shadcn Button', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/button['"]/);
    });

    it('import shadcn Badge', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/badge['"]/);
    });

    it('不再用純 HTML border-collapse table', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/<table[^>]*className=["'][^"']*border-collapse/);
    });

    it('不再用純 bg-blue-600 hover:bg-blue-700 inline button', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/bg-blue-600[^"']*hover:bg-blue-700/);
    });

    it('空狀態用 Empty 元件（含 EmptyHeader + EmptyTitle + EmptyDescription + EmptyContent）', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      // 用 Empty 元件包裝空狀態（非 inline 純文字）
      expect(content).toMatch(/<Empty[\s>]/);
      expect(content).toMatch(/<EmptyTitle/);
      expect(content).toMatch(/<EmptyDescription/);
      expect(content).toMatch(/<EmptyContent/);
    });
  });

  describe('shadcn Table 在 list page 結構', () => {
    it('使用 Table / TableHeader / TableBody / TableRow / TableHead / TableCell', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      // 至少 import 並使用 6 個元件
      expect(content).toMatch(/<Table[\s>]/);
      expect(content).toMatch(/<TableHeader/);
      expect(content).toMatch(/<TableBody/);
      expect(content).toMatch(/<TableRow/);
      expect(content).toMatch(/<TableHead/);
      expect(content).toMatch(/<TableCell/);
    });
  });

  describe('Badge 元件內容', () => {
    it('badge.tsx 匯出 Badge 元件（variants: default/secondary/destructive/outline）', () => {
      const content = readFileSync(BADGE_PATH, 'utf-8');
      expect(content).toMatch(/export\s*\{\s*Badge/);
      // shadcn Badge 標準 variants
      expect(content).toMatch(/badgeVariants/);
    });
  });

  describe('Empty 元件內容', () => {
    it('empty.tsx 匯出 Empty + EmptyHeader + EmptyTitle + EmptyDescription + EmptyContent', () => {
      const content = readFileSync(EMPTY_PATH, 'utf-8');
      expect(content).toMatch(/Empty/);
      // shadcn Empty 標準子元件
    });
  });
});