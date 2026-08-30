/**
 * Sprint D2 TDD — AdvancedFilterDialog
 *
 * 5 種類型 UI:
 * - string: text input (contains / equals / startsWith)
 * - number: number input + select operator (gte/gt/eq/lt/lte/between)
 * - enum: 多選 checkbox (in / notIn)
 * - datetime: datetime input (from / to)
 * - boolean: select (isTrue / isFalse)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedFilterDialog } from '@/app/admin/crud/[spec]/advanced-filter-dialog';
import type { FilterableField } from '@/lib/crud/list-query';

const fields: FilterableField[] = [
  { name: 'title', type: 'string' },
  { name: 'count', type: 'number' },
  { name: 'priority', type: 'enum', enumValues: ['low', 'medium', 'high'] },
  { name: 'dueDate', type: 'datetime' },
  { name: 'completed', type: 'boolean' },
];

describe('Sprint D2 — AdvancedFilterDialog', () => {
  it('open=false → Dialog 不渲染內容', () => {
    render(
      <AdvancedFilterDialog
        open={false}
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[]}
        onApply={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('advanced-filter-content')).toBeNull();
  });

  it('open=true → 顯示「新增條件」按鈕 + 「套用」按鈕 + 「清除」按鈕', () => {
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[]}
        onApply={vi.fn()}
      />,
    );
    const content = screen.getByTestId('advanced-filter-content');
    expect(within(content).getByText('新增條件')).toBeTruthy();
    expect(within(content).getByText('套用')).toBeTruthy();
    expect(within(content).getByText('清除')).toBeTruthy();
  });

  it('點「新增條件」→ 加一個 row，可選 field + operator', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[]}
        onApply={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('add-filter-button'));

    const rows = screen.getAllByTestId('filter-row');
    expect(rows.length).toBe(1);

    // Field select trigger 存在
    const fieldTrigger = within(rows[0]!).getByTestId('field-select');
    expect(fieldTrigger).toBeTruthy();
  });

  it('預填 filters → 顯示對應 row 數', () => {
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[
          { field: 'title', operator: 'contains', value: 'x' },
          { field: 'completed', operator: 'isTrue', value: null },
        ]}
        onApply={vi.fn()}
      />,
    );

    const rows = screen.getAllByTestId('filter-row');
    expect(rows.length).toBe(2);
  });

  it('選 string field → 顯示 string input', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'title', operator: 'contains', value: '台北' }]}
        onApply={vi.fn()}
      />,
    );

    const row = screen.getByTestId('filter-row');
    const stringInput = within(row).getByTestId('string-input');
    expect((stringInput as HTMLInputElement).value).toBe('台北');
  });

  it('選 number field → 顯示 number input', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'count', operator: 'gte', value: 10 }]}
        onApply={vi.fn()}
      />,
    );

    const row = screen.getByTestId('filter-row');
    const numberInput = within(row).getByTestId('number-input');
    expect((numberInput as HTMLInputElement).value).toBe('10');
  });

  it('選 enum field → 顯示 checkbox group', () => {
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'priority', operator: 'in', value: ['high', 'medium'] }]}
        onApply={vi.fn()}
      />,
    );

    const row = screen.getByTestId('filter-row');
    const checkboxes = within(row).getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3);
  });

  it('選 datetime field → 顯示 datetime input', () => {
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'dueDate', operator: 'from', value: '2024-06-01T00:00' }]}
        onApply={vi.fn()}
      />,
    );

    const row = screen.getByTestId('filter-row');
    const dateInput = within(row).getByTestId('datetime-input');
    expect((dateInput as HTMLInputElement).value).toBe('2024-06-01T00:00');
  });

  it('選 boolean field → 顯示「是 / 否」select', () => {
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'completed', operator: 'isTrue', value: null }]}
        onApply={vi.fn()}
      />,
    );

    const row = screen.getByTestId('filter-row');
    const booleanSelect = within(row).getByTestId('boolean-select');
    expect(booleanSelect).toBeTruthy();
  });

  it('選 number + between operator → 顯示 min/max 兩個輸入', () => {
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'count', operator: 'between', value: [5, 15] }]}
        onApply={vi.fn()}
      />,
    );

    const row = screen.getByTestId('filter-row');
    expect(within(row).getByTestId('number-input-min')).toBeTruthy();
    expect(within(row).getByTestId('number-input-max')).toBeTruthy();
  });

  it('點 row 內的「移除」按鈕 → 該 row 消失', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'title', operator: 'contains', value: 'x' }]}
        onApply={vi.fn()}
      />,
    );

    const rowsBefore = screen.getAllByTestId('filter-row');
    expect(rowsBefore.length).toBe(1);

    await user.click(screen.getByTestId('remove-filter-button'));

    expect(screen.queryAllByTestId('filter-row')).toHaveLength(0);
  });

  it('點「套用」→ onApply 收到所有 rows 的 filters', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[{ field: 'title', operator: 'contains', value: '台北' }]}
        onApply={onApply}
      />,
    );

    await user.click(screen.getByTestId('apply-button'));

    expect(onApply).toHaveBeenCalled();
    expect(onApply.mock.calls[0]?.[0]).toEqual([
      { field: 'title', operator: 'contains', value: '台北' },
    ]);
  });

  it('點「清除」→ 移除所有 rows', async () => {
    const user = userEvent.setup();
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[
          { field: 'title', operator: 'contains', value: 'x' },
          { field: 'completed', operator: 'isTrue', value: null },
        ]}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('filter-row')).toHaveLength(2);

    await user.click(screen.getByTestId('clear-button'));

    expect(screen.queryAllByTestId('filter-row')).toHaveLength(0);
  });

  it('title 顯示當前 filter 數量 badge', () => {
    render(
      <AdvancedFilterDialog
        open
        onOpenChange={vi.fn()}
        fields={fields}
        filters={[
          { field: 'title', operator: 'contains', value: 'a' },
          { field: 'title', operator: 'equals', value: 'b' },
        ]}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByTestId('filter-count-badge').textContent).toMatch(/2/);
  });
});