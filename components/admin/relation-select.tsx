'use client';

/**
 * ==============================================
 *  RelationSelect — 關聯欄位自動載入選擇器
 * ==============================================
 *
 * 對應：docs/specs/json-spec.md §3.2.4 Relation
 *       docs/system-design.md §5.1 L2 業務規則
 *
 * 自動從 /api/crud/{kebabModel} 載入選項，無需手動設定。
 *
 * 用於取代 ui-generator 對 reference 欄位生成的 placeholder Select。
 */

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string };

type RelationSelectProps = {
  /** Model 名稱（首字母大寫）— 自動轉為 kebab-case 載入 */
  model: string;
  /** 當前選中的 ID */
  value?: string;
  /** 選擇變更回調 */
  onChange: (value: string) => void;
  /** 顯示欄位（默認 'name'）*/
  labelField?: string;
  /** 額外 pageSize（預設 100）*/
  pageSize?: number;
  /** 禁用 */
  disabled?: boolean;
  /** Placeholder */
  placeholder?: string;
  /** 自訂 className */
  className?: string;
};

/**
 * 將 "Author" 轉 "author"（kebab-case 簡化版）
 */
function toKebab(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

/**
 * 標準化 API 響應為 options 陣列
 */
function normalizeOptions(data: unknown, labelField: string): Option[] {
  let items: unknown[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    items = (obj.items ?? obj.data ?? obj.results ?? []) as unknown[];
  }

  return items
    .filter((it): it is Record<string, unknown> => 
      Boolean(it) && typeof it === 'object'
    )
    .map((item) => ({
      value: String(item.id ?? ''),
      label: String(item[labelField] ?? item.id ?? ''),
    }))
    .filter((o) => o.value);
}

export function RelationSelect({
  model,
  value,
  onChange,
  labelField = 'name',
  pageSize = 100,
  disabled = false,
  placeholder = '選擇...',
  className,
}: RelationSelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const kebabModel = toKebab(model);

    setLoading(true);

    fetch(`/api/crud/${kebabModel}?page=1&pageSize=${pageSize}`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setOptions(normalizeOptions(data, labelField));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [model, labelField, pageSize]);

  // 根據當前 value 找到對應 label
  const selectedLabel = value
    ? options.find((o) => o.value === value)?.label
    : undefined;

  return (
    <Select
      value={value ?? ''}
      onValueChange={onChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className={cn(className)}>
        <SelectValue placeholder={loading ? '載入中...' : placeholder}>
          {selectedLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 && !loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            (無可用選項)
          </div>
        ) : (
          options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}