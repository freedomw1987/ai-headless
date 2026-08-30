/**
 * Sprint 40-1 — CalendarView 缺少 actions 守護測試
 *
 * Bug: CalendarView 接受 renderActions prop 但 JSX 沒渲染
 * 用戶在 calendar view 無法編輯/刪除記錄（沒有 ⋯ menu）
 *
 * Gate 1 TDD：寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarView } from '@/app/admin/crud/[spec]/list-views/calendar-view';

const columns = [
  { name: 'title', label: '標題' },
  { name: 'dueDate', label: '截止日期' },
];

const rows = [
  { id: 'r1', cells: [
    { fieldName: 'title', value: 'Task A', isCheckbox: false, isDate: false },
    { fieldName: 'dueDate', value: '2026-08-15', isCheckbox: false, isDate: true },
  ] },
];

describe('CalendarView — actions 渲染', () => {
  it('每張 card 顯示 actions (renderActions prop)', () => {
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={(rowId) => <button data-testid={`action-${rowId}`}>Edit</button>}
        primaryField="title"
        dateField="dueDate"
      />,
    );
    expect(screen.getByTestId('action-r1')).toBeTruthy();
  });

  it('沒指定 renderActions 時不報錯', () => {
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        primaryField="title"
        dateField="dueDate"
      />,
    );
    expect(screen.getByTestId('calendar-day-2026-08-15')).toBeTruthy();
  });
});