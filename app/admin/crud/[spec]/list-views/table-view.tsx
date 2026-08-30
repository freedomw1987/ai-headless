// Sprint 33 — TableView
//
// 包裝 Sprint A-E 的 CrudListTable + MobileListView。
// - Desktop (≥ 768px): CrudListTable 完整表格
// - Mobile (< 768px): MobileListView 卡片列表
// - CSS responsive 自動切換（保留 Sprint A-E 功能）
//
// Gate 1 TDD：見 tests/integration/list-view-table.test.tsx

'use client';

import { CrudListTable } from '@/app/admin/crud/[spec]/crud-list-table';
import { MobileListView } from '@/app/admin/crud/[spec]/mobile-list-view';
import { Card } from '@/components/ui/card';
import type { CellDisplay } from '@/lib/runtime/cell-display';

type Column = {
  name: string;
  label: string;
};

type Props = {
  rows: { id: string; cells: CellDisplay[] }[];
  columns: Column[];
  selectedIds: Set<string>;
  onSelectionChange: (newSelected: Set<string>) => void;
  renderActions: (rowId: string) => React.ReactNode;
  renderHeader?: (col: Column) => React.ReactNode;
  actionsHeader?: string;
  specName?: string;
  /** Sprint 40-5: 可見欄位 (column toggle) - 過濾 cells 只顯示選擇的欄位 */
  visibleColumns?: Set<string>;
};

export function TableView({
  rows,
  columns,
  selectedIds,
  onSelectionChange,
  renderActions,
  renderHeader,
  actionsHeader = '操作',
  specName,
  visibleColumns,
}: Props) {
  // Sprint 40-5: 過濾 cells 只保留可見欄位
  // 用 columns 順序決定 cells 順序 (避免 fields 順序跟 cells 順序不一致時錯位)
  const filteredRows = visibleColumns
    ? rows.map((row) => ({
        id: row.id,
        cells: columns
          .filter((col) => visibleColumns.has(col.name))
          .map((col) => row.cells.find((c) => c.fieldName === col.name))
          .filter((c): c is CellDisplay => c !== undefined),
      }))
    : rows;

  return (
    <>
      {/* Desktop (≥ 768px): 表格 */}
      <div className="hidden md:block">
        <Card>
          <CrudListTable
            columns={visibleColumns ? columns.filter((col) => visibleColumns.has(col.name)) : columns}
            rows={filteredRows.map((row) => ({
              id: row.id,
              cells: row.cells.map((cell) => {
                if (cell.isCheckbox) {
                  return cell.value === '✓'
                    ? <span className="text-green-600">✓</span>
                    : null;
                }
                return cell.value;
              }),
            }))}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            renderActions={renderActions}
            renderHeader={renderHeader}
            actionsHeader={actionsHeader}
          />
        </Card>
      </div>

      {/* Mobile (< 768px): 卡片視圖 */}
      {specName && (
        <div className="block md:hidden">
          <MobileListView
            specName={specName}
            columns={visibleColumns ? columns.filter((col) => visibleColumns.has(col.name)) : columns}
            rows={filteredRows}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            renderActions={renderActions}
            primaryField="title"
          />
        </div>
      )}
    </>
  );
}