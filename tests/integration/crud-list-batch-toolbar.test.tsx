/**
 * Sprint B5 TDD — Toolbar 整合 + Toast 通知 (整合版)
 *
 * 測試重點:
 * - Toolbar 顯示「批次刪除」按鈕, 預設 disabled
 * - 選中後 enabled
 * - 點擊打開 BatchDeleteDialog
 * - 確認刪除 → 打 batch API
 * - 成功 toast
 * - 清空 selectedIds
 *
 * Sprint B5 變更: rows 用 CellDisplay 結構 ({ id, cells: [{ fieldName, value, isCheckbox, isDate }] })
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrudListClient } from '@/app/admin/crud/[spec]/crud-list-client';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next/navigation (router.refresh)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin/crud/todo',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock SortableHeaderCell (用純 DOM 不依賴 Link)
vi.mock('@/components/admin/sortable-header-cell', () => ({
  SortableHeaderCell: ({ label }: { label: string }) => <span>{label}</span>,
}));

// Mock ListRowActions (DropdownMenu 需要 portal，會干擾 jsdom)
vi.mock('@/components/admin/list-row-actions', () => ({
  ListRowActions: ({ rowId }: { specName: string; rowId: string }) => (
    <span data-testid={`list-row-actions-${rowId}`}>Actions</span>
  ),
}));

const mockRows = [
  { id: '1', cells: [{ fieldName: 'title', value: 'Todo 1', isCheckbox: false, isDate: false }] },
  { id: '2', cells: [{ fieldName: 'title', value: 'Todo 2', isCheckbox: false, isDate: false }] },
];

const baseProps = {
  specName: 'todo',
  rows: mockRows,
  columns: [{ name: 'title', label: '標題' }],
  total: 10,
  page: 1,
  totalPages: 1,
  currentSort: 'createdAt',
  currentOrder: 'desc' as const,
  currentQuery: '',
  pageSize: 20,
};

describe('Sprint B5 — CrudListClient Toolbar 整合', () => {
  it('Toolbar 沒選 row 時不顯示「批次刪除」按鈕 (Sprint D+ 改為隱藏)', () => {
    render(<CrudListClient {...baseProps} />);
    expect(screen.queryByTestId('batch-delete-button')).toBeFalsy();
  });

  it('allowBatchDelete=false 時就算選了 row 也不顯示批次刪除 button (Sprint 28)', async () => {
    const user = userEvent.setup();
    render(<CrudListClient {...baseProps} allowBatchDelete={false} />);

    // 點擊 row checkbox 試圖選中
    const checkbox = screen.getAllByTestId('row-checkbox')[0] as HTMLElement;
    await user.click(checkbox);

    // allowBatchDelete=false → 不顯示批次刪除 button
    expect(screen.queryByTestId('batch-delete-button')).toBeFalsy();
    // selection-count 也不該顯示（批次刪除整個關閉）
    expect(screen.queryByTestId('selection-count')).toBeFalsy();
  });

  it('沒選中時不顯示「已選 N 筆」', () => {
    render(<CrudListClient {...baseProps} />);
    expect(screen.queryByTestId('selection-count')).toBeFalsy();
  });

  it('選中 row 後「批次刪除」按鈕 enabled', async () => {
    const user = userEvent.setup();
    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);

    const btn = screen.getByTestId('batch-delete-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('選中 row 後顯示「已選 N 筆」', async () => {
    const user = userEvent.setup();
    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);
    await user.click(screen.getAllByTestId('row-checkbox')[1]!);

    expect(screen.getByTestId('selection-count').textContent).toContain('2');
  });

  it('點擊「批次刪除」打開 BatchDeleteDialog', async () => {
    const user = userEvent.setup();
    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);
    await user.click(screen.getByTestId('batch-delete-button'));

    expect(screen.getByTestId('delete-confirm-input')).toBeTruthy();
  });

  it('確認刪除 → 打 batch API 帶 ids', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ deleted: 2, failed: [] }),
    } as Response);
    global.fetch = fetchMock;

    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);
    await user.click(screen.getAllByTestId('row-checkbox')[1]!);
    await user.click(screen.getByTestId('batch-delete-button'));
    await user.type(screen.getByTestId('delete-confirm-input'), 'DELETE');
    await user.click(screen.getByTestId('delete-confirm-button'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/crud/todo?batch=true',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ ids: ['1', '2'] }),
        }),
      );
    });
  });

  it('全數成功 → 顯示「已刪除 N 筆」toast', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ deleted: 2, failed: [] }),
    } as Response);

    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);
    await user.click(screen.getByTestId('batch-delete-button'));
    await user.type(screen.getByTestId('delete-confirm-input'), 'DELETE');
    await user.click(screen.getByTestId('delete-confirm-button'));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('已刪除 2 筆'));
    });
  });

  it('部分失敗 → 顯示「已刪除 X 筆，Y 筆失敗」toast', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        deleted: 1,
        failed: [{ id: '2', error: 'permission denied' }],
      }),
    } as Response);

    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);
    await user.click(screen.getAllByTestId('row-checkbox')[1]!);
    await user.click(screen.getByTestId('batch-delete-button'));
    await user.type(screen.getByTestId('delete-confirm-input'), 'DELETE');
    await user.click(screen.getByTestId('delete-confirm-button'));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('1 筆失敗'));
    });
  });

  it('API 拋錯 → 顯示錯誤 toast', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);
    await user.click(screen.getByTestId('batch-delete-button'));
    await user.type(screen.getByTestId('delete-confirm-input'), 'DELETE');
    await user.click(screen.getByTestId('delete-confirm-button'));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });
  });

  it('API 回 401 → 顯示「請先登入」toast', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: '請先登入' }),
    } as Response);

    render(<CrudListClient {...baseProps} />);

    await user.click(screen.getAllByTestId('row-checkbox')[0]!);
    await user.click(screen.getByTestId('batch-delete-button'));
    await user.type(screen.getByTestId('delete-confirm-input'), 'DELETE');
    await user.click(screen.getByTestId('delete-confirm-button'));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('請先登入'));
    });
  });
});
