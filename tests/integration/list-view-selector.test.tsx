/**
 * Sprint 33-5 — ViewSelector 元件測試
 *
 * 設計：toolbar 上的 dropdown 切換不同 view
 * - 顯示所有可用 views (從 buildListUIConfig 來)
 * - 切換時呼叫 onChange
 * - 當前選中的 view 顯示為 active
 *
 * Gate 1 TDD
 * 注意：用 vanilla DOM API（不用 @testing-library/jest-dom matchers）
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewSelector } from '@/app/admin/crud/[spec]/list-views/view-selector';

const views = [
  { type: 'table' as const, label: '表格' },
  { type: 'todo-list' as const, label: '待辦清單', primaryField: 'title' },
];

describe('Sprint 33-5 — ViewSelector', () => {
  it('渲染 trigger button 帶當前 active view label', () => {
    render(
      <ViewSelector
        views={views}
        activeView="table"
        onChange={() => {}}
      />,
    );
    const trigger = screen.getByTestId('view-selector-trigger');
    expect(trigger.textContent).toContain('表格');
  });

it('點擊 trigger 打開 dropdown 列出所有 views', async () => {
    const user = userEvent.setup();
    render(
      <ViewSelector
        views={views}
        activeView="table"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByTestId('view-selector-trigger'));

    // Radix DropdownMenu 用 portal, dropdown 内容在 document.body
    expect(document.body.querySelector('[data-testid="view-selector-item-table"]')).toBeTruthy();
    expect(document.body.querySelector('[data-testid="view-selector-item-todo-list"]')).toBeTruthy();
  });

  it('選擇 view → 呼叫 onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ViewSelector
        views={views}
        activeView="table"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTestId('view-selector-trigger'));
    await user.click(screen.getByTestId('view-selector-item-todo-list'));

    expect(onChange).toHaveBeenCalledWith('todo-list');
  });

  it('active view 在 dropdown 顯示為 selected', async () => {
    const user = userEvent.setup();
    render(
      <ViewSelector
        views={views}
        activeView="todo-list"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByTestId('view-selector-trigger'));

    const todoItem = screen.getByTestId('view-selector-item-todo-list');
    expect(todoItem.getAttribute('data-selected')).toBe('true');
  });
});