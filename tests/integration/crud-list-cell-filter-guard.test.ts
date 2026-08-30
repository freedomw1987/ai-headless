/**
 * Sprint 40-5 — TableView cell filter source-code guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TABLEVIEW_PATH = 'app/admin/crud/[spec]/list-views/table-view.tsx';

describe('Sprint 40-5 — TableView cell filter source-code guard', () => {
  it('TableView 應該接 visibleColumns prop', () => {
    const source = readFileSync(TABLEVIEW_PATH, 'utf-8');
    expect(source).toMatch(/visibleColumns/);
  });

  it('TableView 應該用 visibleColumns 過濾 cells', () => {
    const source = readFileSync(TABLEVIEW_PATH, 'utf-8');
    const usesFilter = /visibleColumns\.has\(/.test(source) ||
      /cells\s*\.?\s*filter\s*\(/.test(source);
    expect(usesFilter, 'TableView 沒用 visibleColumns 過濾 cells').toBe(true);
  });
});