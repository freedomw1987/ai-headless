/**
 * Sprint 17 Stage 1.1 — list page UI 改進（用 shadcn/ui 元件）
 * Sprint B5 — 架構變更：shadcn Table 整合進 CrudListTable
 *
 * 🅓 設計：list page 完全改用 shadcn/ui 元件
 * - Table / TableHeader / TableBody / TableRow / TableHead / TableCell（搬到 CrudListTable）
 * - Button + Plus icon
 * - Badge for status
 * - Empty for 空狀態（仍在 page.tsx）
 * - Card + CardHeader for 標題區
 *
 * 守護測試：
 * 1. list page import shadcn Empty (空狀態仍在 page.tsx)
 * 2. CrudListTable 用 shadcn Table
 * 3. badge.tsx 元件存在
 * 4. empty.tsx 元件存在
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PAGE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/page.tsx');
const BADGE_PATH = resolve(ROOT, 'components/ui/badge.tsx');
const EMPTY_PATH = resolve(ROOT, 'components/ui/empty.tsx');
const CRUD_LIST_TABLE_PATH = resolve(ROOT, 'app/admin/crud/[spec]/crud-list-table.tsx');

describe('Sprint 17 Stage 1.1 + Sprint B5 — shadcn list page UI', () => {
  describe('shadcn 元件存在', () => {
    it('components/ui/badge.tsx 存在', () => {
      expect(existsSync(BADGE_PATH)).toBe(true);
    });

    it('components/ui/empty.tsx 存在', () => {
      expect(existsSync(EMPTY_PATH)).toBe(true);
    });
  });

  describe('list page 結構（page.tsx — Server Component）', () => {
    it('import shadcn Button', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/button['"]/);
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
      expect(content).toMatch(/<Empty[\s>]/);
      expect(content).toMatch(/<EmptyTitle/);
      expect(content).toMatch(/<EmptyDescription/);
      expect(content).toMatch(/<EmptyContent/);
    });
  });

  describe('Sprint B5 — CrudListTable 用 shadcn Table', () => {
    it('import shadcn Table', () => {
      const content = readFileSync(CRUD_LIST_TABLE_PATH, 'utf-8');
      expect(content).toMatch(/from\s+['"]@\/components\/ui\/table['"]/);
    });

    it('使用 Table / TableHeader / TableBody / TableRow / TableHead / TableCell', () => {
      const content = readFileSync(CRUD_LIST_TABLE_PATH, 'utf-8');
      expect(content).toMatch(/<Table[\s>]/);
      expect(content).toMatch(/<TableHeader/);
      expect(content).toMatch(/<TableBody/);
      expect(content).toMatch(/<TableRow/);
      expect(content).toMatch(/<TableHead/);
      expect(content).toMatch(/<TableCell/);
    });

    it('Page.tsx 不再直接 import shadcn Table (改由 CrudListTable 用)', () => {
      const content = readFileSync(PAGE_PATH, 'utf-8');
      expect(content).not.toMatch(/from\s+['"]@\/components\/ui\/table['"]/);
    });
  });
});
