// Sprint C2 (CRUD 列表頁增強 v1.1) — ColumnTogglePopover
//
// Client component — 顯示欄位設定 Popover。
//
// 設計:
// - 父組件管理 visible state (Set<string>) 和 onChange
// - 點 checkbox → onChange(new Set)
// - 點「全選」/「全不選」/「重設」 → 批次操作
// - 變更即時同步 localStorage (透過 saveColumnPrefs)
// - SSR 安全 (從 column-prefs helper 處理)
//
// Gate 1 TDD: 見 tests/integration/column-toggle-popover.test.tsx

'use client';

import { Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { clearColumnPrefs, saveColumnPrefs } from '@/lib/crud/column-prefs';

type Column = {
  name: string;
  label: string;
};

type Props = {
  specName: string;
  columns: Column[];
  visible: Set<string>;
  onChange: (newVisible: Set<string>) => void;
};

export function ColumnTogglePopover({ specName, columns, visible, onChange }: Props) {
  function toggleColumn(name: string) {
    const next = new Set(visible);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    onChange(next);
    saveColumnPrefs(specName, Array.from(next));
  }

  function selectAll() {
    const next = new Set(columns.map((c) => c.name));
    onChange(next);
    saveColumnPrefs(specName, Array.from(next));
  }

  function deselectAll() {
    onChange(new Set());
    saveColumnPrefs(specName, []);
  }

  function reset() {
    clearColumnPrefs(specName);
    // 重設後恢復為「所有欄位可見」（user-friendly 預設）
    onChange(new Set(columns.map((c) => c.name)));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-testid="column-toggle-trigger">
          <Columns3 />
          欄位
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" data-testid="column-toggle-content">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">顯示欄位</h4>
            <span className="text-xs text-muted-foreground">
              已選 {visible.size} / {columns.length}
            </span>
          </div>

          <div className="border-t pt-2 space-y-1">
            {columns.map((col) => (
              <label
                key={col.name}
                className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={visible.has(col.name)}
                  onCheckedChange={() => toggleColumn(col.name)}
                  aria-label={col.label}
                  data-testid={`column-checkbox-${col.name}`}
                />
                <span className="text-sm">{col.label}</span>
              </label>
            ))}
          </div>

          <div className="border-t pt-2 flex flex-wrap gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              data-testid="select-all-button"
              className="text-xs"
            >
              全選
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAll}
              data-testid="deselect-all-button"
              className="text-xs"
            >
              全不選
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              data-testid="reset-button"
              className="text-xs ml-auto"
            >
              重設
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
