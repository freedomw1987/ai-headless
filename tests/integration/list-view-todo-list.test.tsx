/**
 * Sprint 33-4 — TodoListView 元件測試
 *
 * 設計：status tracking 場景
 * - 每 row 一張卡片（primary field 大字 + secondary fields 小字 + status badge）
 * - 支援 checkbox 選擇（跟 TableView 一致）
 * - 支援每 row 的 actions (renderActions)
 * - 響應式（mobile-first）
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoListView } from '@/app/admin/crud/[spec]/list-views/todo-list-view';

const columns = [
  { name: 'title', label: '標題' },
  { name: 'status', label: '狀態' },
  { name: 'priority', label: '優先級' },
];

const rows = [
  { id: 'r1', cells: [
    { fieldName: 'title', value: '完成 Sprint 33', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'in_progress', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'high', isCheckbox: false, isDate: false },
  ] },
  { id: 'r2', cells: [
    { fieldName: 'title', value: '寫 docs', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'done', isCheckbox: false, isDate: false },
    { fieldName: 'priority', value: 'low', isCheckbox: false, isDate: false },
  ] },
];

describe('Sprint 33-4 — TodoListView', () => {
  it('渲染每 row 一張卡片', () => {
    const { container } = render(
      <TodoListView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
        primaryField="title"
      />,
    );
    const cards = container.querySelectorAll('[data-testid^="todo-card-row-"]');
    expect(cards.length).toBe(2);
  });

  it('primary field 顯示為大字標題', () => {
    render(
      <TodoListView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
        primaryField="title"
      />,
    );
    // 第一張卡的標題
    const card1Title = screen.getByTestId('todo-card-r1-title');
    expect(card1Title.textContent).toBe('完成 Sprint 33');
  });

  it('checkbox 點擊切換 selection', async () => {
    const onSelectionChange = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <TodoListView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
        renderActions={() => null}
        specName="todo"
        primaryField="title"
      />,
    );

    const checkbox = screen.getByTestId('todo-card-r1-checkbox');
    await user.click(checkbox);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1']));
  });

  it('selected card 顯示 selected 樣式', () => {
    render(
      <TodoListView
        rows={rows}
        columns={columns}
        selectedIds={new Set(['r1'])}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
        primaryField="title"
      />,
    );
    const card1 = screen.getByTestId('todo-card-row-r1');
    expect(card1.getAttribute('data-selected')).toBe('true');
  });

  it('沒指定 primaryField 時 fallback 到第一個欄位', () => {
    render(
      <TodoListView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
      />,
    );
    // 第一個 column 是 'title'，所以標題應該是 "完成 Sprint 33"
    const card1Title = screen.getByTestId('todo-card-r1-title');
    expect(card1Title.textContent).toBe('完成 Sprint 33');
  });

  it('actions 透過 renderActions prop 渲染', () => {
    render(
      <TodoListView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={(rowId) => <button data-testid={`action-${rowId}`}>Edit</button>}
        specName="todo"
        primaryField="title"
      />,
    );
    expect(screen.getByTestId('action-r1')).toBeTruthy();
    expect(screen.getByTestId('action-r2')).toBeTruthy();
  });

  it('空 rows 時顯示空狀態', () => {
    render(
      <TodoListView
        rows={[]}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        specName="todo"
        primaryField="title"
      />,
    );
    expect(screen.getByTestId('todo-empty-state')).toBeTruthy();
  });
});