/**
 * Sprint 38-1 — CalendarView 元件測試
 *
 * 設計：
 * - 接受 dateField prop（必填）
 * - 按月份顯示當月所有 rows（依 dateField 值）
 * - 月曆網格（7 columns x 5-6 rows）
 * - 每個 day cell 顯示該日期的 cards（最多 3 個 + "+N more"）
 * - 月份切換 prev/next 按鈕
 * - 響應式（mobile 簡化）
 *
 * Gate 1 TDD
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  { id: 'r2', cells: [
    { fieldName: 'title', value: 'Task B', isCheckbox: false, isDate: false },
    { fieldName: 'dueDate', value: '2026-08-15', isCheckbox: false, isDate: true },
  ] },
  { id: 'r3', cells: [
    { fieldName: 'title', value: 'Task C', isCheckbox: false, isDate: false },
    { fieldName: 'dueDate', value: '2026-09-01', isCheckbox: false, isDate: true },
  ] },
];

describe('Sprint 38-1 — CalendarView', () => {
  it('沒指定 dateField 時顯示提示', () => {
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
      />,
    );
    expect(screen.getByTestId('calendar-no-date-field')).toBeTruthy();
  });

  it('空 rows 時顯示提示', () => {
    render(
      <CalendarView
        rows={[]}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        dateField="dueDate"
      />,
    );
    expect(screen.getByTestId('calendar-empty')).toBeTruthy();
  });

  it('render 月曆網格', () => {
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        dateField="dueDate"
      />,
    );
    // 7 columns (週日到週六)
    const headers = screen.getAllByTestId('calendar-weekday');
    expect(headers.length).toBe(7);
  });

  it('render 月份標題 (含年月)', () => {
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        dateField="dueDate"
      />,
    );
    expect(screen.getByTestId('calendar-month-label').textContent).toMatch(/2026/);
  });

  it('日期對應的 day cell 有事件', () => {
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        dateField="dueDate"
      />,
    );
    // 2026-08-15 應該有 r1, r2 (2 個 cards)
    const day20260815 = screen.getByTestId('calendar-day-2026-08-15');
    expect(day20260815.textContent).toContain('Task A');
    expect(day20260815.textContent).toContain('Task B');
  });

  it('每個 day cell 最多顯示 3 個 + "+N more"', () => {
    const manyRows = [
      { id: 'r1', cells: [{ fieldName: 'title', value: 'A', isCheckbox: false, isDate: false }, { fieldName: 'dueDate', value: '2026-08-15', isCheckbox: false, isDate: true }] },
      { id: 'r2', cells: [{ fieldName: 'title', value: 'B', isCheckbox: false, isDate: false }, { fieldName: 'dueDate', value: '2026-08-15', isCheckbox: false, isDate: true }] },
      { id: 'r3', cells: [{ fieldName: 'title', value: 'C', isCheckbox: false, isDate: false }, { fieldName: 'dueDate', value: '2026-08-15', isCheckbox: false, isDate: true }] },
      { id: 'r4', cells: [{ fieldName: 'title', value: 'D', isCheckbox: false, isDate: false }, { fieldName: 'dueDate', value: '2026-08-15', isCheckbox: false, isDate: true }] },
      { id: 'r5', cells: [{ fieldName: 'title', value: 'E', isCheckbox: false, isDate: false }, { fieldName: 'dueDate', value: '2026-08-15', isCheckbox: false, isDate: true }] },
    ];
    render(
      <CalendarView
        rows={manyRows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        dateField="dueDate"
      />,
    );
    const dayCell = screen.getByTestId('calendar-day-2026-08-15');
    // 5 個 events → 只顯示 3 + "+2 more"
    expect(dayCell.textContent).toContain('+2');
  });

  it('點擊 prev/next 按鈕切換月份', async () => {
    const user = userEvent.setup();
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
        dateField="dueDate"
      />,
    );

    expect(screen.getByTestId('calendar-month-label').textContent).toContain('2026');

    // 點 next
    await user.click(screen.getByTestId('calendar-next-month'));
    expect(screen.getByTestId('calendar-month-label').textContent).toMatch(/2026|2027/);
  });

  it('checkbox 切換 selection', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CalendarView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
        renderActions={() => null}
        primaryField="title"
        dateField="dueDate"
      />,
    );

    // 找 r1 的 checkbox
    const day20260815 = screen.getByTestId('calendar-day-2026-08-15');
    const checkbox = day20260815.querySelector('button[role="checkbox"]') as HTMLElement;
    await user.click(checkbox);
    expect(onSelectionChange).toHaveBeenCalled();
  });
});