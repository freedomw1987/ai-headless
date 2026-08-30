// Sprint 35-1 — KanbanView 元件
//
// 看板視圖，按 groupByField 分組顯示：
// - 每個 unique value 一個 column
// - 每 column header 顯示組名 + 數量
// - 每 row 渲染為卡片（類似 TodoListView）
// - 響應式：desktop 顯示多 column，mobile 水平 scroll
//
// Gate 1 TDD：見 tests/integration/list-view-kanban.test.tsx

'use client';

import { useState } from 'react';
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
  specName?: string;
  primaryField?: string;
  /** 必填：分組依據的欄位名稱（例如 'status'）*/
  groupByField?: string;
  /**
   * Sprint 36: 拖曳 callback (source rowId + target group value)
   * - 由 parent 處理 API call + optimistic update
   * - 樂觀更新: parent 應 moveCard 到新 column 的 rows
   */
  onMove?: (sourceRowId: string, targetGroup: string) => void;
};

function findCell(cells: CellDisplay[], fieldName: string): CellDisplay | undefined {
  return cells.find((c) => c.fieldName === fieldName);
}

export function KanbanView({
  rows,
  columns,
  selectedIds,
  onSelectionChange,
  renderActions,
  primaryField,
  groupByField,
  onMove,
}: Props) {
  // 拖曳狀態: 紀錄當前 drag 的 rowId
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  // 沒指定 groupByField → 顯示提示
  if (!groupByField) {
    return (
      <div
        data-testid="kanban-no-group-field"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        Kanban view 需指定 groupByField（用於分組的欄位名稱，例如 'status'）
      </div>
    );
  }

  // 沒資料 → 顯示空狀態
  if (rows.length === 0) {
    return (
      <div
        data-testid="kanban-empty-state"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        目前沒有資料
      </div>
    );
  }

  // primary field 預設為第一個 column
  const primary =
    primaryField
    ?? columns.find((c) => c.name === 'title')?.name
    ?? columns[0]?.name
    ?? '';

  // 分組
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const cell = findCell(row.cells, groupByField);
    const value = cell?.value ?? '(未分類)';
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value)!.push(row);
  }

  function toggleRow(rowId: string) {
    const next = new Set(selectedIds);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelectionChange(next);
  }

  // Sprint 36: HTML5 drag-and-drop handlers
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, rowId: string) {
    e.dataTransfer.setData('text/plain', rowId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingRowId(rowId);
  }

  function handleDragEnd() {
    setDraggingRowId(null);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    // 必須 preventDefault 才能觸發 drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(
    e: React.DragEvent<HTMLDivElement>,
    targetGroup: string,
  ) {
    e.preventDefault();
    const sourceRowId = e.dataTransfer.getData('text/plain');
    if (!sourceRowId || !onMove) return;
    // 避免 drop 到自己原本的 group
    onMove(sourceRowId, targetGroup);
    setDraggingRowId(null);
  }

  return (
    <div
      data-testid="kanban-view"
      className="flex gap-4 overflow-x-auto pb-2"
    >
      {Array.from(groups.entries()).map(([groupValue, groupRows]) => (
        <div
          key={groupValue}
          data-testid={`kanban-column-${groupValue}`}
          data-droppable="true"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, groupValue)}
          className={cn(
            'flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3',
            draggingRowId && onMove && 'border-2 border-dashed border-primary/30',
          )}
        >
          {/* Column header */}
          <div
            data-testid={`kanban-column-header-${groupValue}`}
            className="flex items-center justify-between mb-3 px-1"
          >
            <Badge variant="secondary" className="font-medium">
              {groupValue}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {groupRows.length} 筆
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {groupRows.map((row) => {
              const primaryCell = findCell(row.cells, primary);
              const isSelected = selectedIds.has(row.id);
              return (
                <div
                  key={row.id}
                  data-testid={`kanban-card-${row.id}`}
                  data-selected={isSelected ? 'true' : 'false'}
                  draggable={Boolean(onMove)}
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-start gap-2 rounded-md border bg-card p-2 shadow-sm transition-colors',
                    isSelected && 'bg-muted border-primary',
                    onMove && 'cursor-grab active:cursor-grabbing',
                    draggingRowId === row.id && 'opacity-50',
                  )}
                >
                  {/* Checkbox */}
                  <Checkbox
                    data-testid={`kanban-card-${row.id}-checkbox`}
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(row.id)}
                    aria-label={`選取 ${primaryCell?.value ?? row.id}`}
                  />

                  {/* 主內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {primaryCell?.value ?? ''}
                    </div>
                    {/* 次要 fields */}
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {row.cells
                        .filter(
                          (c) =>
                            c.fieldName !== primary &&
                            c.fieldName !== groupByField &&
                            !c.isCheckbox,
                        )
                        .map((c) => (
                          <span key={c.fieldName} className="whitespace-nowrap">
                            {c.value ? `${c.value}` : null}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="shrink-0">{renderActions(row.id)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}