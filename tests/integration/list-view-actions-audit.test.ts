/**
 * Sprint 40-2 — 所有 view 都有 renderActions JSX 守護測試
 *
 * Bug 啟示（Sprint 40-1）：CalendarView 接受 renderActions prop 但 JSX 沒用
 * → 用戶沒法編輯/刪除月曆上的記錄
 *
 * 守護測試：每個 view component 的 source 必須有 renderActions(...) 呼叫
 *
 * Gate 1 TDD：source-code guard
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const VIEW_FILES = [
  { name: 'TableView', path: 'app/admin/crud/[spec]/list-views/table-view.tsx' },
  { name: 'TodoListView', path: 'app/admin/crud/[spec]/list-views/todo-list-view.tsx' },
  { name: 'KanbanView', path: 'app/admin/crud/[spec]/list-views/kanban-view.tsx' },
  { name: 'CalendarView', path: 'app/admin/crud/[spec]/list-views/calendar-view.tsx' },
  { name: 'GalleryView', path: 'app/admin/crud/[spec]/list-views/gallery-view.tsx' },
];

describe('Sprint 40-2 — 所有 view 都有呼叫 renderActions', () => {
  for (const { name, path } of VIEW_FILES) {
    it(`${name} 確實使用 renderActions prop (呼叫或傳遞給子組件)`, () => {
      const source = readFileSync(path, 'utf-8');
      // 確保 source 裡有 renderActions(...) 呼叫 或  renderActions={...} 傳遞
      // Pattern 1: renderActions(...) - 直接呼叫
      // Pattern 2: renderActions?.(...) - optional chain
      // Pattern 3: renderActions={renderActions} - 傳遞給子組件 (TableView pattern)
      const hasCall =
        /renderActions[\?\.]*\s*\(/.test(source) ||
        /renderActions=\{renderActions\}/.test(source);
      expect(hasCall, `${name} 應該呼叫或傳遞 renderActions`).toBe(true);
    });
  }
});