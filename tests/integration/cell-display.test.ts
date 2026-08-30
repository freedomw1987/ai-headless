/**
 * Sprint B5 TDD — Cell Display Helper
 *
 * 測試重點:
 * - formatter 優先
 * - checkbox: ✓ / 空
 * - date: locale zh-TW
 * - 預設字串
 */

import { describe, it, expect } from 'vitest';
import { renderCellDisplay, buildDisplayRows } from '@/lib/runtime/cell-display';
import type { UIField } from '@/lib/runtime/ui-config';
import type { FormatterFn } from '@/lib/runtime/extension-loaders';

const dateField: UIField = {
  name: 'dueDate',
  label: '到期日',
  inputType: 'date',
  required: false,
  showInList: true,
};

const checkboxField: UIField = {
  name: 'completed',
  label: '已完成',
  inputType: 'checkbox',
  required: false,
  showInList: true,
};

const titleField: UIField = {
  name: 'title',
  label: '標題',
  inputType: 'text',
  required: true,
  showInList: true,
};

const amountField: UIField = {
  name: 'amount',
  label: '金額',
  inputType: 'number',
  required: false,
  showInList: true,
  formatter: 'formatAmount',
};

describe('Sprint B5 — renderCellDisplay', () => {
  it('formatter 優先於預設', () => {
    const formatters: Record<string, FormatterFn> = {
      formatAmount: (value) => `NT$ ${value}`,
    };
    const result = renderCellDisplay(1000, amountField, formatters, {});
    expect(result.value).toBe('NT$ 1000');
    expect(result.fieldName).toBe('amount');
  });

  it('checkbox true → ✓', () => {
    const result = renderCellDisplay(true, checkboxField, {}, {});
    expect(result.value).toBe('✓');
    expect(result.isCheckbox).toBe(true);
  });

  it('checkbox false → 空字串', () => {
    const result = renderCellDisplay(false, checkboxField, {}, {});
    expect(result.value).toBe('');
  });

  it('date 字串 → zh-TW 格式', () => {
    const result = renderCellDisplay('2025-01-15T00:00:00.000Z', dateField, {}, {});
    // zh-TW 格式可能是 2025/1/15 或 2025/01/15 — 只要有年月日就好
    expect(result.value).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
    expect(result.isDate).toBe(true);
  });

  it('null → 空字串', () => {
    const result = renderCellDisplay(null, titleField, {}, {});
    expect(result.value).toBe('');
  });

  it('undefined → 空字串', () => {
    const result = renderCellDisplay(undefined, titleField, {}, {});
    expect(result.value).toBe('');
  });

  it('字串值 → 原字串', () => {
    const result = renderCellDisplay('Hello', titleField, {}, {});
    expect(result.value).toBe('Hello');
  });

  it('數字 → String(value)', () => {
    const result = renderCellDisplay(42, titleField, {}, {});
    expect(result.value).toBe('42');
  });

  it('boolean true (非 checkbox field) → "true"', () => {
    const result = renderCellDisplay(true, titleField, {}, {});
    expect(result.value).toBe('true');
  });
});

describe('Sprint B5 — buildDisplayRows', () => {
  it('構造 rows from items + fields + formatters', () => {
    const items = [
      { id: '1', title: 'Todo 1', completed: false, amount: 100 },
      { id: '2', title: 'Todo 2', completed: true, amount: 200 },
    ];
    const fields = [titleField, checkboxField, amountField];
    const formatters: Record<string, FormatterFn> = {
      formatAmount: (v) => `NT$ ${v}`,
    };

    const rows = buildDisplayRows(items, fields, formatters);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.id).toBe('1');
    expect(rows[0]?.cells).toHaveLength(3);
    expect(rows[0]?.cells[0]?.value).toBe('Todo 1');
    expect(rows[0]?.cells[1]?.value).toBe('');
    expect(rows[0]?.cells[2]?.value).toBe('NT$ 100');
    expect(rows[1]?.cells[1]?.value).toBe('✓');
  });

  it('空 items → 空 rows', () => {
    const rows = buildDisplayRows([], [titleField], {});
    expect(rows).toEqual([]);
  });
});
