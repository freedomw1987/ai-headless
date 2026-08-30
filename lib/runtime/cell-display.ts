// Sprint B5 (CRUD 列表頁增強 v1.1) — Cell Display Helper
//
// 集中 cell 渲染邏輯 (formatter > 預設)，讓 server + client 兩端共用。
//
// 設計重點:
// - formatter 是純函數 (value, record) → string，可序列化、可在 client 跑
// - customRenderer 是 React component (有 client side state)，本期不支援
//   (會在後續 sprint 用 SSR → string 序列化 或 dynamic import 解)
// - checkbox / date / 預設字串格式化

import type { UIField } from '@/lib/runtime/ui-config';
import type { FormatterFn } from '@/lib/runtime/extension-loaders';

export type CellDisplay = {
  fieldName: string;
  value: string;
  isCheckbox: boolean;
  isDate: boolean;
};

/**
 * 渲染 cell 為序列化字串
 *
 * 優先級: formatter > 預設
 * - formatter(fieldValue, record) → string
 * - checkbox: ✓ / 空字串
 * - date: locale string (zh-TW)
 * - 其他: String(value)
 */
export function renderCellDisplay(
  value: unknown,
  field: UIField,
  formatters: Record<string, FormatterFn>,
  record: Record<string, unknown>,
): CellDisplay {
  let displayValue: string;

  // 1. formatter (priority)
  if (field.formatter) {
    // formatters map 是 { [fnName]: FormatterFn }，fnName 不一定等於 field name
    // 但 loadFormatters 用 fieldName 作 key (lib/runtime/extension-loaders.ts:55)
    // 所以直接查 formatters[field.formatter] 也可能，但保險查兩個
    const formatter = formatters[field.formatter] ?? formatters[field.name];
    if (formatter) {
      displayValue = formatter(value, record);
      return {
        fieldName: field.name,
        value: displayValue,
        isCheckbox: field.inputType === 'checkbox',
        isDate: field.inputType === 'date',
      };
    }
  }

  // 2. 預設
  displayValue = defaultDisplay(value, field.inputType);

  return {
    fieldName: field.name,
    value: displayValue,
    isCheckbox: field.inputType === 'checkbox',
    isDate: field.inputType === 'date',
  };
}

function defaultDisplay(value: unknown, inputType: string): string {
  if (value === null || value === undefined) return '';
  switch (inputType) {
    case 'checkbox':
      return value ? '✓' : '';
    case 'date':
      return value ? new Date(value as string).toLocaleDateString('zh-TW') : '';
    default:
      return String(value);
  }
}

/**
 * 從 record 構造 row 給 CrudListClient 用
 */
export function buildDisplayRows(
  items: unknown[],
  fields: UIField[],
  formatters: Record<string, FormatterFn>,
): Array<{ id: string; cells: CellDisplay[] }> {
  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      id: String(item.id ?? ''),
      cells: fields.map((f) => renderCellDisplay(item[f.name], f, formatters, item)),
    };
  });
}
