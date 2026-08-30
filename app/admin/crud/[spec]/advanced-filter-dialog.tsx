// Sprint D2 (CRUD 列表頁增強 v1.1) — Advanced Filter Dialog
//
// Client component — 進階篩選 Dialog (5 種類型)
//
// 設計:
// - 從 toolbar 的「篩選」按鈕開啟
// - 內部維護 rows state，每 row = (field, operator, value)
// - 套用 → onApply(filters)
// - 清除 → 清空 rows
//
// Gate 1 TDD: 見 tests/integration/advanced-filter-dialog.test.tsx

'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type Filter,
  type FilterableField,
  type Operator,
  getOperatorsForField,
  operatorLabel,
} from '@/lib/crud/list-query';

type Row = {
  id: string;
  field: string;
  operator: Operator;
  value: unknown;
};

function defaultOperatorForType(type: string): Operator {
  const ops = getOperatorsForField(type as FilterableField['type']);
  return ops[0] ?? 'contains';
}

function rowToFilter(row: Row, fields: FilterableField[]): Filter | null {
  const field = fields.find((f) => f.name === row.field);
  if (!field) return null;
  // 把 value 包成序列化格式
  if (field.type === 'boolean') {
    return { field: row.field, operator: row.operator, value: null };
  }
  if (field.type === 'number' && row.operator === 'between') {
    if (!Array.isArray(row.value)) return null;
    return { field: row.field, operator: row.operator, value: row.value };
  }
  if (field.type === 'enum') {
    if (!Array.isArray(row.value)) return { field: row.field, operator: row.operator, value: [] };
    return { field: row.field, operator: row.operator, value: row.value };
  }
  return { field: row.field, operator: row.operator, value: row.value };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FilterableField[];
  filters: Filter[];
  onApply: (filters: Filter[]) => void;
};

export function AdvancedFilterDialog({
  open,
  onOpenChange,
  fields,
  filters,
  onApply,
}: Props) {
  // 從 filters 初始化 rows
  const [rows, setRows] = useState<Row[]>(() =>
    filters.map((f, i) => ({
      id: `row-${i}-${Date.now()}`,
      field: f.field,
      operator: f.operator,
      value: f.value,
    })),
  );

  // 當 filters prop 變動（外部更新）時同步 rows
  useEffect(() => {
    setRows(
      filters.map((f, i) => ({
        id: `row-${i}-${Date.now()}`,
        field: f.field,
        operator: f.operator,
        value: f.value,
      })),
    );
  }, [open, filters]);

  function addRow() {
    const firstField = fields[0];
    if (!firstField) return;
    const newRow: Row = {
      id: `row-new-${Date.now()}`,
      field: firstField.name,
      operator: defaultOperatorForType(firstField.type),
      value: '',
    };
    setRows((prev) => [...prev, newRow]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // 當 field 變動時重設 operator + value
        if (patch.field && patch.field !== r.field) {
          const newField = fields.find((f) => f.name === patch.field);
          if (newField) {
            next.operator = defaultOperatorForType(newField.type);
            next.value = newField.type === 'boolean' ? null : '';
          }
        }
        return next;
      }),
    );
  }

  function handleApply() {
    const validFilters = rows
      .map((r) => rowToFilter(r, fields))
      .filter((f): f is Filter => f !== null);
    onApply(validFilters);
    onOpenChange(false);
  }

  function handleClear() {
    setRows([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        data-testid="advanced-filter-content"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            進階篩選
            <span
              data-testid="filter-count-badge"
              className="text-xs text-muted-foreground"
            >
              ({rows.length} 個條件)
            </span>
          </DialogTitle>
          <DialogDescription>
            新增條件設定欄位、運算子和值。支援 5 種類型：字串、數字、列舉、日期、布林。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {rows.map((row) => {
            const field = fields.find((f) => f.name === row.field);
            const operators = field ? getOperatorsForField(field.type) : [];

            return (
              <div
                key={row.id}
                data-testid="filter-row"
                className="flex flex-wrap items-center gap-2 p-2 border rounded"
              >
                {/* Field select */}
                <Select
                  value={row.field}
                  onValueChange={(value) => updateRow(row.id, { field: value })}
                >
                  <SelectTrigger
                    data-testid="field-select"
                    className="w-[140px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Operator select */}
                <Select
                  value={row.operator}
                  onValueChange={(value) =>
                    updateRow(row.id, { operator: value as Operator })
                  }
                >
                  <SelectTrigger
                    data-testid="operator-select"
                    className="w-[100px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op} value={op}>
                        {operatorLabel(op)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Value editor (per field type) */}
                <ValueEditor
                  field={field}
                  row={row}
                  onChange={(value) => updateRow(row.id, { value })}
                />

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.id)}
                  data-testid="remove-filter-button"
                  className="ml-auto"
                >
                  <X />
                </Button>
              </div>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            data-testid="add-filter-button"
            className="w-full"
          >
            <Plus />
            新增條件
          </Button>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={handleClear}
            data-testid="clear-button"
          >
            清除
          </Button>
          <Button
            onClick={handleApply}
            data-testid="apply-button"
          >
            套用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==============================================
// ValueEditor — 根據 field type 切換對應 UI
// ==============================================

function ValueEditor({
  field,
  row,
  onChange,
}: {
  field: FilterableField | undefined;
  row: Row;
  onChange: (value: unknown) => void;
}) {
  if (!field) return null;

  if (field.type === 'boolean') {
    return (
      <Select
        value={row.operator}
        onValueChange={(v) => onChange(v === 'isTrue')}
      >
        <SelectTrigger
          data-testid="boolean-select"
          className="w-[80px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="isTrue">是</SelectItem>
          <SelectItem value="isFalse">否</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (field.type === 'enum') {
    const selected = Array.isArray(row.value) ? (row.value as string[]) : [];
    return (
      <div className="flex gap-2 flex-wrap">
        {field.enumValues?.map((v) => {
          const isChecked = selected.includes(v);
          return (
            <label key={v} className="flex items-center gap-1 text-sm">
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, v]
                    : selected.filter((x) => x !== v);
                  onChange(next);
                }}
              />
              {v}
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === 'datetime') {
    return (
      <Input
        type="datetime-local"
        data-testid="datetime-input"
        value={typeof row.value === 'string' ? row.value : ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-[180px]"
      />
    );
  }

  if (field.type === 'number' && row.operator === 'between') {
    const arr = Array.isArray(row.value) ? (row.value as number[]) : [0, 0];
    return (
      <div className="flex gap-1 items-center">
        <Input
          type="number"
          data-testid="number-input-min"
          value={arr[0]}
          onChange={(e) => onChange([Number(e.target.value), arr[1]])}
          className="w-[80px]"
        />
        <span className="text-xs">~</span>
        <Input
          type="number"
          data-testid="number-input-max"
          value={arr[1]}
          onChange={(e) => onChange([arr[0], Number(e.target.value)])}
          className="w-[80px]"
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <Input
        type="number"
        data-testid="number-input"
        value={typeof row.value === 'number' ? row.value : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[100px]"
      />
    );
  }

  // string (default)
  return (
    <Input
      type="text"
      data-testid="string-input"
      value={typeof row.value === 'string' ? row.value : ''}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-[120px]"
    />
  );
}