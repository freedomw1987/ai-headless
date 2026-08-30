/**
 * Sprint D 修補 — integer type + options enumValues 支援
 *
 * 問題：
 * 1. blog readingTime type 是 "integer" 但 FieldType 只有 "number" → 沒有 operators
 * 2. blog status 用 "options" 而非 "validation.enum" → enumValues 為 undefined
 */

import { describe, it, expect } from 'vitest';
import {
  getOperatorsForField,
  applyFilters,
  type FilterableField,
} from '@/lib/crud/list-query';

describe('Sprint D fix — integer type 支援', () => {
  it('integer 跟 number 一樣回傳 6 個 number operators', () => {
    const numberOps = getOperatorsForField('number');
    const integerOps = getOperatorsForField('integer');
    expect(integerOps).toEqual(numberOps);
    expect(integerOps).toContain('gte');
    expect(integerOps).toContain('between');
  });

  it('applyFilters 對 integer type 套用 gte', () => {
    const fields: FilterableField[] = [{ name: 'readingTime', type: 'integer' }];
    const items = [
      { id: 1, readingTime: 3 },
      { id: 2, readingTime: 10 },
      { id: 3, readingTime: 20 },
    ];
    const result = applyFilters(items, [
      { field: 'readingTime', operator: 'gte', value: 10 },
    ], fields);
    expect(result.map((r) => r.id)).toEqual([2, 3]);
  });

  it('applyFilters 對 integer type 套用 between', () => {
    const fields: FilterableField[] = [{ name: 'count', type: 'integer' }];
    const items = [
      { id: 1, count: 1 },
      { id: 2, count: 5 },
      { id: 3, count: 10 },
      { id: 4, count: 20 },
    ];
    const result = applyFilters(items, [
      { field: 'count', operator: 'between', value: [5, 15] },
    ], fields);
    expect(result.map((r) => r.id)).toEqual([2, 3]);
  });
});