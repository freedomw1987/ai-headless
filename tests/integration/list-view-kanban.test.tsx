/**
 * Sprint 35-1 — KanbanView 元件測試
 *
 * 設計：
 * - 接受 groupByField prop（必填）
 * - 將 rows 按 groupByField 分組
 * - 顯示為多 column 布局（CSS grid）
 * - 每 column header 顯示組名 + 數量
 * - 每 row 渲染為卡片（類似 TodoListView）
 * - 空 column 顯示 empty state
 * - 沒有 groupByField 時 → 拋出錯誤（或顯示提示）
 *
 * Gate 1 TDD
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanView } from '@/app/admin/crud/[spec]/list-views/kanban-view';

const columns = [
  { name: 'title', label: '標題' },
  { name: 'status', label: '狀態' },
  { name: 'priority', label: '優先級' },
];

const rows = [
  { id: 'r1', cells: [
    { fieldName: 'title', value: 'Task A', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'open', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'high', isCheckbox: false, isDate: false },
  ] },
  { id: 'r2', cells: [
    { fieldName: 'title', value: 'Task B', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'in_progress', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'high', isCheckbox: false, isDate: false },
  ] },
  { id: 'r3', cells: [
    { fieldName: 'title', value: 'Task C', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'done', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'low', isCheckbox: false, isDate: false },
  ] },
  { id: 'r4', cells: [
    { fieldName: 'title', value: 'Task D', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'open', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'low', isCheckbox: false, isDate: false },
  ] },
];

describe('Sprint 35-1 — KanbanView', () => {
  it('按 groupByField 分組（每個 unique value 一個 column）', () => {
    const { container } = render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="status"
        primaryField="title"
      />,
    );
    // 3 unique status values → 3 columns (用 kanban-column-XXX 但排除 -header-)
    const allKanbanEls = container.querySelectorAll('[data-testid^="kanban-column-"]');
    const kanbanColumns = Array.from(allKanbanEls).filter(
      (el) => !el.getAttribute('data-testid')?.includes('-header-'),
    );
    expect(kanbanColumns.length).toBe(3);
  });

  it('每 column header 顯示組名 + 數量', () => {
    render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="status"
        primaryField="title"
      />,
    );
    // 'open' 有 2 筆（r1 + r4）
    const openHeader = screen.getByTestId('kanban-column-header-open');
    expect(openHeader.textContent).toContain('open');
    expect(openHeader.textContent).toContain('2');
    // 'in_progress' 有 1 筆
    expect(screen.getByTestId('kanban-column-header-in_progress').textContent).toContain('1');
    // 'done' 有 1 筆
    expect(screen.getByTestId('kanban-column-header-done').textContent).toContain('1');
  });

  it('每 column 內渲染對應 rows 的卡片', () => {
    render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="status"
        primaryField="title"
      />,
    );
    // open column 內有 r1 和 r4
    const openColumn = screen.getByTestId('kanban-column-open');
    expect(openColumn.textContent).toContain('Task A');
    expect(openColumn.textContent).toContain('Task D');
    // done column 內有 r3
    const doneColumn = screen.getByTestId('kanban-column-done');
    expect(doneColumn.textContent).toContain('Task C');
  });

  it('沒指定 groupByField 時顯示提示', () => {
    render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        primaryField="title"
      />,
    );
    expect(screen.getByTestId('kanban-no-group-field')).toBeTruthy();
  });

  it('空 rows 時顯示空狀態', () => {
    render(
      <KanbanView
        rows={[]}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="status"
        primaryField="title"
      />,
    );
    expect(screen.getByTestId('kanban-empty-state')).toBeTruthy();
  });

  it('checkbox 切換 selection', async () => {
    const onSelectionChange = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
        renderActions={() => null}
        groupByField="status"
        primaryField="title"
      />,
    );
    const card = screen.getByTestId('kanban-card-r1');
    const checkbox = card.querySelector('button[role="checkbox"]') as HTMLElement;
    await user.click(checkbox);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1']));
  });

  it('selected card 顯示 selected 樣式', () => {
    render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set(['r1'])}
        onSelectionChange={() => {}}
        renderActions={() => null}
        groupByField="status"
        primaryField="title"
      />,
    );
    const card = screen.getByTestId('kanban-card-r1');
    expect(card.getAttribute('data-selected')).toBe('true');
  });

  it('actions 透過 renderActions prop 渲染', () => {
    render(
      <KanbanView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={(rowId) => <button data-testid={`action-${rowId}`}>Edit</button>}
        groupByField="status"
        primaryField="title"
      />,
    );
    expect(screen.getByTestId('action-r1')).toBeTruthy();
  });
});