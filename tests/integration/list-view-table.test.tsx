/**
 * Sprint 33-3 — TableView 元件測試
 *
 * Gate 1 TDD：先寫失敗測試 → 實作 → 通過
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableView } from '@/app/admin/crud/[spec]/list-views/table-view';

vi.mock('@/app/admin/crud/[spec]/crud-list-table', () => ({
  CrudListTable: ({ columns, rows, actionsHeader, renderActions }: any) => (
    <div data-testid="mock-table">
      <div data-testid="table-actions-header">{actionsHeader}</div>
      <div data-testid="rows-count">{rows.length} rows × {columns.length} cols</div>
      {rows.map((row: any) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          {row.cells.map((cell: any, idx: number) => (
            <span key={idx} data-testid={`cell-${row.id}-${idx}`}>{cell}</span>
          ))}
        </div>
      ))}
      {renderActions?.('any')}
    </div>
  ),
}));

const columns = [
  { name: 'title', label: '標題' },
  { name: 'status', label: '狀態' },
];

const rows = [
  { id: 'r1', cells: [
    { fieldName: 'title', value: 'Task 1', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'open', isCheckbox: false, isDate: false },
  ] },
  { id: 'r2', cells: [
    { fieldName: 'title', value: 'Task 2', isCheckbox: false, isDate: false },
    { fieldName: 'status', value: 'done', isCheckbox: false, isDate: false },
  ] },
];

describe('Sprint 33-3 — TableView', () => {
  it('渲染 CrudListTable 帶正確 rows 跟 columns', () => {
    render(
      <TableView
        rows={rows}
        columns={columns}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
      />,
    );
    const rowsCount = screen.getByTestId('rows-count');
    expect(rowsCount.textContent).toContain('2 rows × 2 cols');
  });

  it('checkbox cells (isCheckbox=true) 渲染為 ✓ span 或 null', () => {
    const checkboxRows = [
      { id: 'r1', cells: [
        { fieldName: 'completed', value: '✓', isCheckbox: true, isDate: false },
        { fieldName: 'title', value: 'X', isCheckbox: false, isDate: false },
      ] },
      { id: 'r2', cells: [
        { fieldName: 'completed', value: '', isCheckbox: true, isDate: false },
        { fieldName: 'title', value: 'Y', isCheckbox: false, isDate: false },
      ] },
    ];
    render(
      <TableView
        rows={checkboxRows}
        columns={[{ name: 'completed', label: 'C' }, { name: 'title', label: 'T' }]}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
      />,
    );
    // ✓ span 應該有 green 樣式
    const checkmark = screen.getByText('✓');
    expect(checkmark.className).toContain('text-green-600');
    // 第二個 checkbox 為 null（空值）
    expect(screen.queryByText(/Y/)).toBeTruthy();
  });

  it('actionsHeader 預設為 "操作"', () => {
    render(
      <TableView
        rows={[]}
        columns={[]}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
      />,
    );
    expect(screen.getByTestId('table-actions-header').textContent).toBe('操作');
  });

  it('actionsHeader 可自訂', () => {
    render(
      <TableView
        rows={[]}
        columns={[]}
        selectedIds={new Set()}
        onSelectionChange={() => {}}
        renderActions={() => null}
        actionsHeader="Custom Header"
      />,
    );
    expect(screen.getByTestId('table-actions-header').textContent).toBe('Custom Header');
  });
});