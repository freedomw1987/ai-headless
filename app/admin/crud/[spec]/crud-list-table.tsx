// Sprint B1 (CRUD 列表頁增強 v1.1) — Row Checkbox + 全選邏輯
// Sprint B5 — 支援自訂 header cell (含 sortable)
//
// Client component 包裝原本的 table，加上:
// - 每 row 左側 checkbox (data-testid=row-checkbox)
// - Header 「全選」checkbox (data-testid=select-all-checkbox) + indeterminate 三態
// - 點擊切換 selectedIds state (透過 onSelectionChange 傳出去)
//
// 設計重點:
// - 受控組件: selectedIds / onSelectionChange 由 parent (CrudListClient) 管理
// - renderHeader prop 讓 parent 提供 sortable header JSX (含 SortableHeaderCell)
// - 不影響既有 cell 內容與操作欄
//
// Gate 1 TDD: 見 tests/integration/crud-list-row-checkbox.test.tsx

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

type Column = {
  name: string;
  label: string;
};

type Row = {
  id: string;
  cells: React.ReactNode[];
};

type Props = {
  columns: Column[];
  rows: Row[];
  selectedIds: Set<string>;
  onSelectionChange: (newSelected: Set<string>) => void;
  actionsHeader?: React.ReactNode;
  renderActions?: (rowId: string) => React.ReactNode;
  /** Sprint B5: 自訂 header cell JSX，預設用 column.label */
  renderHeader?: (column: Column) => React.ReactNode;
};

export function CrudListTable({
  columns,
  rows,
  selectedIds,
  onSelectionChange,
  actionsHeader,
  renderActions,
  renderHeader,
}: Props) {
  // 計算全選狀態
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id));
  const indeterminate = someSelected && !allSelected;

  function toggleRow(rowId: string) {
    const next = new Set(selectedIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelectionChange(next);
  }

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(rows.map((r) => r.id)));
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              data-testid="select-all-checkbox"
              checked={indeterminate ? 'indeterminate' : allSelected}
              onCheckedChange={toggleAll}
              aria-label="全選"
            />
          </TableHead>
          {columns.map((c) => (
            <TableHead key={c.name}>
              {renderHeader ? renderHeader(c) : c.label}
            </TableHead>
          ))}
          {renderActions && (
            <TableHead className="w-[100px] text-right">
              {actionsHeader ?? '操作'}
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} data-state={selectedIds.has(row.id) ? 'selected' : undefined}>
            <TableCell className="w-[40px]">
              <Checkbox
                data-testid="row-checkbox"
                checked={selectedIds.has(row.id)}
                onCheckedChange={() => toggleRow(row.id)}
                aria-label={`選取 ${row.id}`}
              />
            </TableCell>
            {row.cells.map((cell, idx) => (
              <TableCell key={idx}>{cell}</TableCell>
            ))}
            {renderActions && (
              <TableCell className="text-right">{renderActions(row.id)}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
