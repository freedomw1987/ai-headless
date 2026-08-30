// Sprint 33-4 — TodoListView 元件
//
// 卡片式列表視圖，適合 status tracking 場景（todo / order tracking / issue 等）。
// - 每 row 一張卡片
// - primary field 大字標題
// - secondary fields 小字 metadata
// - status badge（如果欄位有 status）
// - checkbox 選擇（跟 TableView 一致）
// - mobile-first 設計
//
// Gate 1 TDD：見 tests/integration/list-view-todo-list.test.tsx

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
  specName: string;
  /** 主要顯示欄位（預設為 columns[0]）*/
  primaryField?: string;
};

/** 從 cells 找 cell by fieldName */
function findCell(cells: CellDisplay[], fieldName: string): CellDisplay | undefined {
  return cells.find((c) => c.fieldName === fieldName);
}

export function TodoListView({
  rows,
  columns,
  selectedIds,
  onSelectionChange,
  renderActions,
  primaryField,
}: Props) {
  // 決定 primary field
  const primary =
    primaryField
    ?? columns.find((c) => c.name === 'title')?.name
    ?? columns[0]?.name
    ?? '';

  function toggleRow(rowId: string) {
    const next = new Set(selectedIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelectionChange(next);
  }

  if (rows.length === 0) {
    return (
      <div
        data-testid="todo-empty-state"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        目前沒有資料
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="todo-list-view">
      {rows.map((row) => {
        const primaryCell = findCell(row.cells, primary);
        const statusCell = findCell(row.cells, 'status');
        const isSelected = selectedIds.has(row.id);

        return (
          <div
            key={row.id}
            data-testid={`todo-card-row-${row.id}`}
            data-selected={isSelected ? 'true' : 'false'}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              isSelected && 'bg-muted border-primary',
            )}
          >
            {/* Checkbox */}
            <Checkbox
              data-testid={`todo-card-${row.id}-checkbox`}
              checked={isSelected}
              onCheckedChange={() => toggleRow(row.id)}
              aria-label={`選取 ${primaryCell?.value ?? row.id}`}
            />

            {/* 主內容 */}
            <div className="flex-1 min-w-0">
              {/* primary title */}
              <div
                data-testid={`todo-card-${row.id}-title`}
                className="text-base font-medium truncate"
              >
                {primaryCell?.value ?? ''}
              </div>

              {/* status badge */}
              {statusCell?.value && (
                <Badge
                  variant="secondary"
                  data-testid={`todo-card-${row.id}-status`}
                  className="mt-1"
                >
                  {statusCell.value}
                </Badge>
              )}

              {/* secondary fields */}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {row.cells
                  .filter((c) => c.fieldName !== primary && c.fieldName !== 'status' && !c.isCheckbox)
                  .map((c) => {
                    const col = columns.find((cc) => cc.name === c.fieldName);
                    return (
                      <span key={c.fieldName} className="whitespace-nowrap">
                        {c.value ? `${col?.label ?? c.fieldName}: ${c.value}` : null}
                      </span>
                    );
                  })}
              </div>
            </div>

            {/* actions */}
            <div className="shrink-0">{renderActions(row.id)}</div>
          </div>
        );
      })}
    </div>
  );
}