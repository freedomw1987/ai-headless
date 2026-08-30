/**
 * Sprint B1 TDD — Row Checkbox + 全選邏輯
 *
 * 測試重點:
 * - Row checkbox 渲染正確
 * - 點擊切換選中狀態
 * - Header checkbox 三態: 全選 / 部分選 (indeterminate) / 全未選
 * - 點全選 → 全部選中 / 取消全選
 * - 不影響其他 row 操作
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrudListTable } from '@/app/admin/crud/[spec]/crud-list-table';

const mockColumns = [
  { name: 'title', label: '標題' },
  { name: 'completed', label: '已完成' },
];

const mockRows = [
  { id: '1', cells: [<span key="t">Todo 1</span>, <span key="c">no</span>] },
  { id: '2', cells: [<span key="t">Todo 2</span>, <span key="c">yes</span>] },
  { id: '3', cells: [<span key="t">Todo 3</span>, <span key="c">no</span>] },
];

describe('Sprint B1 — Row Checkbox + 全選邏輯', () => {
  it('每個 row 都有 checkbox (data-testid=row-checkbox)', () => {
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set()}
        onSelectionChange={vi.fn()}
      />,
    );
    const checkboxes = screen.getAllByTestId('row-checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('Header 有「全選」checkbox (data-testid=select-all-checkbox)', () => {
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set()}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('select-all-checkbox')).toBeTruthy();
  });

  it('selectedIds 空 → 全選 checkbox 未選且 indeterminate=false', () => {
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set()}
        onSelectionChange={vi.fn()}
      />,
    );
    const selectAll = screen.getByTestId('select-all-checkbox');
    expect(selectAll.getAttribute('data-state')).toBe('unchecked');
  });

  it('selectedIds 有部分 → 全選 checkbox indeterminate=true', () => {
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set(['1', '2'])}
        onSelectionChange={vi.fn()}
      />,
    );
    const selectAll = screen.getByTestId('select-all-checkbox');
    expect(selectAll.getAttribute('data-state')).toBe('indeterminate');
  });

  it('selectedIds 全部 → 全選 checkbox checked=true', () => {
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set(['1', '2', '3'])}
        onSelectionChange={vi.fn()}
      />,
    );
    const selectAll = screen.getByTestId('select-all-checkbox');
    expect(selectAll.getAttribute('data-state')).toBe('checked');
  });

  it('點 row checkbox → onSelectionChange 被呼叫, 帶新 selectedIds', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const newSet = onSelectionChange.mock.calls[0]![0] as Set<string>;
    expect(newSet.has('1')).toBe(true);
    expect(newSet.size).toBe(1);
  });

  it('點已選的 row checkbox → 從 selectedIds 移除', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set(['1', '2'])}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);

    const newSet = onSelectionChange.mock.calls[0]![0] as Set<string>;
    expect(newSet.has('1')).toBe(false);
    expect(newSet.has('2')).toBe(true);
  });

  it('點全選 checkbox (空狀態) → 全部選中', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByTestId('select-all-checkbox'));

    const newSet = onSelectionChange.mock.calls[0]![0] as Set<string>;
    expect(newSet.size).toBe(3);
    expect(newSet.has('1')).toBe(true);
    expect(newSet.has('2')).toBe(true);
    expect(newSet.has('3')).toBe(true);
  });

  it('點全選 checkbox (全部已選) → 全部取消', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CrudListTable
        columns={mockColumns}
        rows={mockRows}
        selectedIds={new Set(['1', '2', '3'])}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByTestId('select-all-checkbox'));

    const newSet = onSelectionChange.mock.calls[0]![0] as Set<string>;
    expect(newSet.size).toBe(0);
  });
});
