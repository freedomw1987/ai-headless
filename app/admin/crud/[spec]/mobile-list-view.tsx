// Sprint E1 (CRUD 列表頁增強 v1.1) — MobileListView
//
// 卡片式視圖，用於 mobile (< 768px) 取代擠壓的表格。
//
// 設計：
// - 每張 card 顯示：checkbox + primary 欄位 (大字體) + 次要欄位 metadata + 操作按鈕
// - 選取的 card 顯示 highlight (bg-muted)
// - 空狀態顯示「無資料」訊息
// - 操作按鈕透過 renderActions prop 由 parent 注入（沿用 ListRowActions）
// - RWD 防呆：card 預設 overflow-hidden，metadata 用 min-w-0 + truncate，
//   長字串欄位值會被 maxLength 截斷避免爆 card
//
// Gate 1 TDD: 見 tests/integration/crud-list-mobile-view.test.tsx

'use client';

import { Checkbox } from '@/components/ui/checkbox';

type CellDisplay = {
  fieldName: string;
  value: string;
  isCheckbox: boolean;
  isDate: boolean;
};

type Column = {
  name: string;
  label: string;
};

type Row = {
  id: string;
  cells: CellDisplay[];
};

type Props = {
  specName: string;
  columns: Column[];
  rows: Row[];
  selectedIds: Set<string>;
  onSelectionChange: (newSelected: Set<string>) => void;
  /** 操作按鈕（注入 ListRowActions） */
  renderActions: (rowId: string) => React.ReactNode;
  /** 標題欄位（顯示為大字體），預設 'title' 或第一欄 */
  primaryField?: string;
  /**
   * 長欄位值截斷上限（字元數）。超過會加 "..."。
   * 預設 50。設 0 表示不截斷。
   * 為什麼：避免 blog.content 等長 HTML 欄位把 card 撐高撐寬破版。
   */
  maxLength?: number;
};

/** 從 cells 找 cell by fieldName */
function findCell(cells: CellDisplay[], fieldName: string): CellDisplay | undefined {
  return cells.find((c) => c.fieldName === fieldName);
}

/** 截斷字串到 maxLength 字元，加 "..." */
function truncate(value: string, maxLength: number): string {
  if (maxLength <= 0) return value;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

export function MobileListView({
  specName,
  columns,
  rows,
  selectedIds,
  onSelectionChange,
  renderActions,
  primaryField,
  maxLength = 50,
}: Props) {
  // 決定 primary 欄位：先看 prop，其次看有沒有 'title'，最後 fallback 第一欄
  const primaryName =
    primaryField
    ?? (columns.find((c) => c.name === 'title')?.name)
    ?? columns[0]?.name
    ?? '';

  if (rows.length === 0) {
    return (
      <div
        data-testid="mobile-empty-state"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        目前沒有符合條件的資料
      </div>
    );
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

  return (
    <div
      data-testid="mobile-list-view"
      data-spec={specName}
      className="space-y-2 md:hidden"
    >
      {rows.map((row) => {
        const primaryCell = findCell(row.cells, primaryName);
        const isSelected = selectedIds.has(row.id);

        // 次要欄位：除了 primary 跟 checkbox 欄位以外
        const metaCells = row.cells.filter(
          (c) => c.fieldName !== primaryName && !c.isCheckbox,
        );

        return (
          <div
            key={row.id}
            data-testid={`mobile-card-${row.id}`}
            data-selected={isSelected ? 'true' : 'false'}
            className={[
              // overflow-hidden: 防止長內容撐開 card（破 RWD 的主因）
              'flex items-start gap-3 rounded-lg border p-3 bg-card overflow-hidden transition-colors',
              isSelected ? 'bg-muted border-primary' : '',
            ].join(' ')}
          >
            {/* Checkbox */}
            <Checkbox
              data-testid={`mobile-card-${row.id}-checkbox`}
              checked={isSelected}
              onCheckedChange={() => toggleRow(row.id)}
              aria-label={`選取 ${primaryCell?.value ?? row.id}`}
            />

            {/* 主內容 */}
            <div className="flex-1 min-w-0">
              {/* 標題 */}
              <div
                data-testid={`mobile-card-${row.id}-title`}
                className="text-base font-medium truncate"
              >
                {primaryCell?.value ?? ''}
              </div>

              {/* 已完成 ✓ */}
              {(() => {
                const completedCell = findCell(row.cells, 'completed');
                if (!completedCell || completedCell.value !== '✓') return null;
                return (
                  <span
                    data-testid={`mobile-card-${row.id}-completed-mark`}
                    className="text-green-600 text-sm"
                    aria-label="已完成"
                  >
                    ✓ 已完成
                  </span>
                );
              })()}

              {/* metadata */}
              {metaCells.length > 0 && (
                <div
                  data-testid={`mobile-card-${row.id}-meta`}
                  className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground"
                >
                  {metaCells.map((c) => {
                    const col = columns.find((cc) => cc.name === c.fieldName);
                    const displayValue = c.value ? truncate(c.value, maxLength) : '';
                    if (!displayValue) return null;
                    return (
                      <span
                        key={c.fieldName}
                        // min-w-0 + truncate: 讓 flex item 可縮，文字溢出加省略號
                        className="flex min-w-0 items-baseline gap-1"
                      >
                        <span className="shrink-0 text-muted-foreground/80">
                          {col?.label ?? c.fieldName}：
                        </span>
                        <span
                          data-testid={`mobile-card-${row.id}-meta-${c.fieldName}`}
                          className="min-w-0 truncate"
                        >
                          {displayValue}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="shrink-0">{renderActions(row.id)}</div>
          </div>
        );
      })}
    </div>
  );
}