/**
 * Sprint C2 TDD — ColumnTogglePopover
 *
 * 測試重點:
 * - 點擊 trigger button 打開 Popover
 * - Popover 內列出所有 columns 的 Checkbox
 * - 點 checkbox → 切換 onChange
 * - 「全選/全不選」按鈕 toggle
 * - 「重設」按鈕 → 清除 localStorage 該 spec 的設定
 * - 變更即時更新到 localStorage
 * - Popover 顯示目前選了幾個 / 共幾個
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnTogglePopover } from '@/app/admin/crud/[spec]/column-toggle-popover';

describe('Sprint C2 — ColumnTogglePopover', () => {
  const columns = [
    { name: 'title', label: '標題' },
    { name: 'completed', label: '已完成' },
    { name: 'priority', label: '優先度' },
    { name: 'dueDate', label: '到期日' },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('點擊 trigger button → 打開 Popover 含所有欄位', async () => {
    const user = userEvent.setup();
    render(<ColumnTogglePopover specName="todo" columns={columns} visible={new Set(['title', 'completed', 'priority', 'dueDate'])} onChange={vi.fn()} />);

    // 點 trigger
    const trigger = screen.getByTestId('column-toggle-trigger');
    await user.click(trigger);

    // Popover 內容出現
    const content = screen.getByTestId('column-toggle-content');
    expect(content).toBeTruthy();

    // 4 個欄位 checkbox 都在
    expect(within(content).getByLabelText('標題')).toBeTruthy();
    expect(within(content).getByLabelText('已完成')).toBeTruthy();
    expect(within(content).getByLabelText('優先度')).toBeTruthy();
    expect(within(content).getByLabelText('到期日')).toBeTruthy();
  });

  it('顯示「已選 N / M 個欄位」', async () => {
    const user = userEvent.setup();
    render(<ColumnTogglePopover specName="todo" columns={columns} visible={new Set(['title', 'completed'])} onChange={vi.fn()} />);

    await user.click(screen.getByTestId('column-toggle-trigger'));
    const content = screen.getByTestId('column-toggle-content');
    expect(within(content).getByText(/已選 \d+ \/ \d+/)).toBeTruthy();
  });

  it('取消勾選一個欄位 → onChange 被呼叫 + localStorage 更新', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColumnTogglePopover specName="todo" columns={columns} visible={new Set(['title', 'completed', 'priority', 'dueDate'])} onChange={onChange} />);

    await user.click(screen.getByTestId('column-toggle-trigger'));
    const checkbox = screen.getByLabelText('已完成');
    await user.click(checkbox);

    // onChange 收到不含 'completed' 的 Set
    expect(onChange).toHaveBeenCalled();
    const newSet = onChange.mock.calls[0]?.[0] as Set<string>;
    expect(newSet.has('completed')).toBe(false);
    expect(newSet.has('title')).toBe(true);

    // localStorage 同步
    const stored = JSON.parse(localStorage.getItem('crud-list-columns:todo') ?? '[]');
    expect(stored).toEqual(['title', 'priority', 'dueDate']);
  });

  it('點「全選」→ 所有欄位都選 + localStorage 包含全部', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColumnTogglePopover specName="todo" columns={columns} visible={new Set(['title'])} onChange={onChange} />);

    await user.click(screen.getByTestId('column-toggle-trigger'));
    await user.click(screen.getByTestId('select-all-button'));

    const newSet = onChange.mock.calls[0]?.[0] as Set<string>;
    expect(newSet.size).toBe(4);
    expect(newSet.has('title')).toBe(true);
    expect(newSet.has('dueDate')).toBe(true);
  });

  it('點「全不選」→ 清空 + 清空 localStorage', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColumnTogglePopover specName="todo" columns={columns} visible={new Set(['title', 'completed'])} onChange={onChange} />);

    await user.click(screen.getByTestId('column-toggle-trigger'));
    await user.click(screen.getByTestId('deselect-all-button'));

    const newSet = onChange.mock.calls[0]?.[0] as Set<string>;
    expect(newSet.size).toBe(0);

    // localStorage 應該存空陣列（讓 user 知道「全不選」是 intentional）
    const stored = JSON.parse(localStorage.getItem('crud-list-columns:todo') ?? 'null');
    expect(stored).toEqual([]);
  });

  it('點「重設」→ 清除 localStorage + onChange 收到完整預設', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    // 預先存一個 prefs
    localStorage.setItem('crud-list-columns:todo', JSON.stringify(['title']));

    render(<ColumnTogglePopover specName="todo" columns={columns} visible={new Set(['title'])} onChange={onChange} />);

    await user.click(screen.getByTestId('column-toggle-trigger'));
    await user.click(screen.getByTestId('reset-button'));

    // localStorage 清除
    expect(localStorage.getItem('crud-list-columns:todo')).toBeNull();

    // onChange 收到完整預設 (所有欄位可見)
    const newSet = onChange.mock.calls[0]?.[0] as Set<string>;
    expect(newSet.size).toBe(4);
  });

  it('初始 visible 已反映 checkbox 狀態', async () => {
    const user = userEvent.setup();
    render(<ColumnTogglePopover specName="todo" columns={columns} visible={new Set(['title', 'completed'])} onChange={vi.fn()} />);

    await user.click(screen.getByTestId('column-toggle-trigger'));

    const titleCheckbox = screen.getByLabelText('標題') as HTMLInputElement;
    const completedCheckbox = screen.getByLabelText('已完成') as HTMLInputElement;
    const priorityCheckbox = screen.getByLabelText('優先度') as HTMLInputElement;

    expect(titleCheckbox.getAttribute('data-state')).toBe('checked');
    expect(completedCheckbox.getAttribute('data-state')).toBe('checked');
    expect(priorityCheckbox.getAttribute('data-state')).toBe('unchecked');
  });
});
