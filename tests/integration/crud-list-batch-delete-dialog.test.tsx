/**
 * Sprint B2 TDD — Batch Delete Dialog (DELETE 確認)
 *
 * 測試重點:
 * - Dialog 顯示「批次刪除 N 筆資料」標題
 * - 預設 confirm button disabled
 * - 輸入「DELETE」後 enabled
 * - 輸入其他字保持 disabled
 * - 點確認呼叫 onConfirm
 * - 點取消呼叫 onCancel
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchDeleteDialog } from '@/app/admin/crud/[spec]/batch-delete-dialog';

const mockItems = [
  { id: '1', label: 'Todo 1' },
  { id: '2', label: 'Todo 2' },
  { id: '3', label: 'Todo 3' },
  { id: '4', label: 'Todo 4' },
  { id: '5', label: 'Todo 5' },
  { id: '6', label: 'Todo 6' }, // 超過前 5 筆
];

describe('Sprint B2 — BatchDeleteDialog', () => {
  it('渲染標題「批次刪除 N 筆資料」', () => {
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    expect(screen.getByText(/批次刪除 6 筆資料/)).toBeTruthy();
  });

  it('列出前 5 筆預覽', () => {
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    expect(screen.getByText('Todo 1')).toBeTruthy();
    expect(screen.getByText('Todo 2')).toBeTruthy();
    expect(screen.getByText('Todo 5')).toBeTruthy();
    expect(screen.queryByText('Todo 6')).toBeFalsy(); // 第 6 筆不列出
  });

  it('顯示「此操作無法復原」警告', () => {
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    expect(screen.getByText(/此操作無法復原/)).toBeTruthy();
  });

  it('有輸入框 data-testid=delete-confirm-input', () => {
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    expect(screen.getByTestId('delete-confirm-input')).toBeTruthy();
  });

  it('有 confirm button data-testid=delete-confirm-button', () => {
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    expect(screen.getByTestId('delete-confirm-button')).toBeTruthy();
  });

  it('預設 confirm button disabled', () => {
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    const btn = screen.getByTestId('delete-confirm-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('輸入「DELETE」後 confirm button enabled', async () => {
    const user = userEvent.setup();
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    await user.type(screen.getByTestId('delete-confirm-input'), 'DELETE');
    const btn = screen.getByTestId('delete-confirm-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('輸入「delete」(小寫) 保持 disabled', async () => {
    const user = userEvent.setup();
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    await user.type(screen.getByTestId('delete-confirm-input'), 'delete');
    const btn = screen.getByTestId('delete-confirm-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('點確認 → onConfirm 被呼叫', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        isDeleting={false}
      />,
    );
    await user.type(screen.getByTestId('delete-confirm-input'), 'DELETE');
    await user.click(screen.getByTestId('delete-confirm-button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('點取消 → onCancel 被呼叫', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={onCancel}
        isDeleting={false}
      />,
    );
    // 取消按鈕在 dialog footer
    const cancelBtn = screen.getByRole('button', { name: /取消/ });
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('isDeleting=true → 兩個按鈕都 disabled 且顯示「刪除中」', () => {
    render(
      <BatchDeleteDialog
        open={true}
        items={mockItems}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDeleting={true}
      />,
    );
    expect(screen.getByText(/刪除中/)).toBeTruthy();
    const cancelBtn = screen.getByRole('button', { name: /取消/ }) as HTMLButtonElement;
    const confirmBtn = screen.getByTestId('delete-confirm-button') as HTMLButtonElement;
    expect(cancelBtn.disabled).toBe(true);
    expect(confirmBtn.disabled).toBe(true);
  });
});
