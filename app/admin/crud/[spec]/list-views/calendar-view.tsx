// Sprint 38-1 — CalendarView 元件
//
// 月曆視圖，依 dateField 分組顯示：
// - 7 columns × 5-6 rows 月曆網格
// - 每個 day cell 顯示該日期的 cards (最多 3 個 + "+N more")
// - 月份切換 prev/next 按鈕
// - 響應式 (mobile 簡化)
// - 支援 selection + actions
//
// Gate 1 TDD: 見 tests/integration/list-view-calendar.test.tsx

'use client';

import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  /** Optional: 自訂每 row 的動作按鈕 */
  renderActions?: (rowId: string) => React.ReactNode;
  primaryField?: string;
  /** 必填: 日期欄位名稱 (e.g., 'dueDate', 'startAt') */
  dateField?: string;
};

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MAX_VISIBLE_PER_DAY = 3;

function findCell(cells: CellDisplay[], fieldName: string): CellDisplay | undefined {
  return cells.find((c) => c.fieldName === fieldName);
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function dateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildMonthGrid(year: number, month: number) {
  // month 是 0-indexed (0=Jan)
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 計算需要幾週
  const totalCells = startWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);

  const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];
  // 上月補位
  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month, -startWeekday + i + 1);
    cells.push({ date: d, isCurrentMonth: false });
  }
  // 本月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // 下月補位 (湊滿 weeks * 7)
  const remaining = weeks * 7 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  return cells;
}

export function CalendarView({
  rows,
  columns,
  selectedIds,
  onSelectionChange,
  renderActions,
  primaryField,
  dateField,
}: Props) {
  // 沒指定 dateField → 提示
  if (!dateField) {
    return (
      <div
        data-testid="calendar-no-date-field"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        Calendar view 需指定 dateField (日期欄位名稱, 例如 'dueDate')
      </div>
    );
  }

  // 沒資料 → 空狀態
  if (rows.length === 0) {
    return (
      <div
        data-testid="calendar-empty"
        className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
      >
        目前沒有資料
      </div>
    );
  }

  // 預設 primary field
  const primary =
    primaryField
    ?? columns.find((c) => c.name === 'title')?.name
    ?? columns[0]?.name
    ?? '';

  // 預設顯示月份: 第一筆有日期資料的月份
  const initialMonth = useMemo(() => {
    for (const row of rows) {
      const cell = findCell(row.cells, dateField);
      if (cell?.value) {
        const d = parseDate(cell.value);
        if (d) return { year: d.getFullYear(), month: d.getMonth() };
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [rows, dateField]);

  const [year, setYear] = useState(initialMonth.year);
  const [month, setMonth] = useState(initialMonth.month);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  // 按日期分組
  const byDate = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const row of rows) {
      const cell = findCell(row.cells, dateField);
      const d = cell?.value ? parseDate(cell.value) : null;
      if (!d) continue;
      const key = dateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }, [rows, dateField]);

  const monthGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function toggleRow(rowId: string) {
    const next = new Set(selectedIds);
    if (next.has(rowId)) next.delete(rowId);
    else next.add(rowId);
    onSelectionChange(next);
  }

  return (
    <div data-testid="calendar-view" className="space-y-2">
      {/* Header: 月份切換 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          data-testid="calendar-prev-month"
          onClick={prevMonth}
          aria-label="上個月"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div
          data-testid="calendar-month-label"
          className="text-lg font-medium"
        >
          {year} 年 {month + 1} 月
        </div>
        <Button
          variant="ghost"
          size="icon"
          data-testid="calendar-next-month"
          onClick={nextMonth}
          aria-label="下個月"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 週標題 */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            data-testid="calendar-weekday"
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {wd}
          </div>
        ))}

        {/* 月曆網格 */}
        {monthGrid.map(({ date, isCurrentMonth }) => {
          const key = dateKey(date);
          const dayRows = byDate.get(key) ?? [];
          const day = date.getDate();
          return (
            <div
              key={key}
              data-testid={`calendar-day-${key}`}
              data-current-month={isCurrentMonth ? 'true' : 'false'}
              className={cn(
                'min-h-24 border rounded-md p-1 space-y-0.5',
                isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground',
                day === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear() &&
                  'ring-1 ring-primary',
              )}
            >
              <div className="text-xs font-medium">{day}</div>
              {dayRows.slice(0, MAX_VISIBLE_PER_DAY).map((row) => {
                const primaryCell = findCell(row.cells, primary);
                const isSelected = selectedIds.has(row.id);
                return (
                  <div
                    key={row.id}
                    className={cn(
                      'group flex items-center gap-1 text-xs px-1 py-0.5 rounded',
                      isSelected && 'bg-primary/10',
                    )}
                  >
                    <Checkbox
                      data-testid={`calendar-day-${key}-checkbox-${row.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(row.id)}
                      aria-label={`選取 ${primaryCell?.value ?? row.id}`}
                      className="h-3 w-3"
                    />
                    <span className="truncate flex-1">{primaryCell?.value ?? ''}</span>
                    {/* actions - mobile 永遠顯示, desktop hover 才顯示 (跟 GalleryView 一致) */}
                    {renderActions && (
                      <div
                        data-testid={`calendar-day-${key}-actions-${row.id}`}
                        className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        {renderActions(row.id)}
                      </div>
                    )}
                  </div>
                );
              })}
              {dayRows.length > MAX_VISIBLE_PER_DAY && (
                <div className="text-xs text-muted-foreground">
                  +{dayRows.length - MAX_VISIBLE_PER_DAY} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}