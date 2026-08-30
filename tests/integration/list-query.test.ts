/**
 * Sprint D1 TDD — list-query URL ↔ filter parser
 *
 * 5 種類型 filter apply 邏輯:
 * - string: contains / equals / startsWith
 * - number: gte / gt / eq / lt / lte / between
 * - enum: in / notIn
 * - datetime: from / to
 * - boolean: isTrue / isFalse
 */

import { describe, it, expect } from 'vitest';
import {
  parseListQuery,
  serializeListQuery,
  applyFilters,
  type ListQuery,
  type Filter,
  type FilterableField,
} from '@/lib/crud/list-query';

const sampleFields: FilterableField[] = [
  { name: 'title', type: 'string' },
  { name: 'completed', type: 'boolean' },
  { name: 'priority', type: 'enum', enumValues: ['low', 'medium', 'high'] },
  { name: 'dueDate', type: 'datetime' },
  { name: 'count', type: 'number' },
];

describe('Sprint D1 — list-query parser', () => {
  describe('parseListQuery', () => {
    it('空 searchParams → 預設值', () => {
      const result = parseListQuery({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.sort).toBe('');
      expect(result.order).toBe('desc');
      expect(result.q).toBe('');
      expect(result.filters).toEqual([]);
    });

    it('有 page / pageSize / sort / order / q', () => {
      const result = parseListQuery({
        page: '3',
        pageSize: '20',
        sort: 'title',
        order: 'asc',
        q: '台北',
      });
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(20);
      expect(result.sort).toBe('title');
      expect(result.order).toBe('asc');
      expect(result.q).toBe('台北');
    });

    it('page < 1 → 強制 1', () => {
      const result = parseListQuery({ page: '0' });
      expect(result.page).toBe(1);
    });

    it('pageSize > 100 → 強制 100', () => {
      const result = parseListQuery({ pageSize: '9999' });
      expect(result.pageSize).toBe(100);
    });

    it('parse filters JSON string', () => {
      const result = parseListQuery({
        filters: JSON.stringify([
          { field: 'title', operator: 'contains', value: '台北' },
        ]),
      });
      expect(result.filters).toEqual([
        { field: 'title', operator: 'contains', value: '台北' },
      ]);
    });

    it('filters 不是 JSON → 略過 (不 throw)', () => {
      expect(() => parseListQuery({ filters: 'not-json' })).not.toThrow();
      const result = parseListQuery({ filters: 'not-json' });
      expect(result.filters).toEqual([]);
    });
  });

  describe('serializeListQuery', () => {
    it('round-trip: parse(serialize(x)) === x (canonical form)', () => {
      const input: ListQuery = {
        page: 2,
        pageSize: 20,
        sort: 'title',
        order: 'asc',
        q: '台北',
        filters: [{ field: 'completed', operator: 'isTrue', value: null }],
      };
      const serialized = serializeListQuery(input);
      const reparsed = parseListQuery(Object.fromEntries(new URLSearchParams(serialized)));
      expect(reparsed).toEqual(input);
    });

    it('空 filters → 不寫入 URL', () => {
      const result = serializeListQuery({
        page: 1,
        pageSize: 10,
        sort: '',
        order: 'desc',
        q: '',
        filters: [],
      });
      expect(result).not.toMatch(/filters=/);
    });

    it('只有 page > 1 才寫入 page', () => {
      expect(serializeListQuery({
        page: 1, pageSize: 10, sort: '', order: 'desc', q: '', filters: [],
      })).not.toMatch(/page=/);
      expect(serializeListQuery({
        page: 2, pageSize: 10, sort: '', order: 'desc', q: '', filters: [],
      })).toMatch(/page=2/);
    });
  });

  describe('applyFilters — 5 種類型', () => {
    const items = [
      { id: '1', title: '台北活動', completed: true, priority: 'high', dueDate: '2024-12-31', count: 10 },
      { id: '2', title: '高雄活動', completed: false, priority: 'low', dueDate: '2024-01-01', count: 5 },
      { id: '3', title: '台北會議', completed: true, priority: 'medium', dueDate: '2024-06-15', count: 20 },
      { id: '4', title: '台中出差', completed: false, priority: 'high', dueDate: '2025-01-01', count: 1 },
    ];

    it('string contains', () => {
      const result = applyFilters(items, [{ field: 'title', operator: 'contains', value: '台北' }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '3']);
    });

    it('string equals', () => {
      const result = applyFilters(items, [{ field: 'title', operator: 'equals', value: '台北活動' }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1']);
    });

    it('string startsWith', () => {
      const result = applyFilters(items, [{ field: 'title', operator: 'startsWith', value: '台北' }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '3']);
    });

    it('number gte', () => {
      const result = applyFilters(items, [{ field: 'count', operator: 'gte', value: 10 }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '3']);
    });

    it('number between', () => {
      const result = applyFilters(items, [{ field: 'count', operator: 'between', value: [5, 15] }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '2']);
    });

    it('enum in', () => {
      const result = applyFilters(items, [{ field: 'priority', operator: 'in', value: ['high', 'medium'] }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '3', '4']);
    });

    it('enum notIn', () => {
      const result = applyFilters(items, [{ field: 'priority', operator: 'notIn', value: ['low'] }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '3', '4']);
    });

    it('datetime from', () => {
      const result = applyFilters(items, [{ field: 'dueDate', operator: 'from', value: '2024-06-01' }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '3', '4']);
    });

    it('datetime to', () => {
      const result = applyFilters(items, [{ field: 'dueDate', operator: 'to', value: '2024-12-31' }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '2', '3']);
    });

    it('boolean isTrue', () => {
      const result = applyFilters(items, [{ field: 'completed', operator: 'isTrue', value: null }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1', '3']);
    });

    it('boolean isFalse', () => {
      const result = applyFilters(items, [{ field: 'completed', operator: 'isFalse', value: null }], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['2', '4']);
    });

    it('多重 filter AND 邏輯', () => {
      const result = applyFilters(items, [
        { field: 'completed', operator: 'isTrue', value: null },
        { field: 'priority', operator: 'in', value: ['high'] },
      ], sampleFields);
      expect(result.map((i) => i.id)).toEqual(['1']);
    });

    it('未知 field → 略過該 filter (不 throw)', () => {
      expect(() => applyFilters(items, [{ field: 'unknown', operator: 'contains', value: 'x' }], sampleFields)).not.toThrow();
      const result = applyFilters(items, [{ field: 'unknown', operator: 'contains', value: 'x' }], sampleFields);
      expect(result).toHaveLength(items.length); // 沒過濾掉任何
    });

    it('錯誤運算子 → 略過 (不 throw)', () => {
      expect(() => applyFilters(items, [{ field: 'title', operator: 'invalid' as any, value: 'x' }], sampleFields)).not.toThrow();
    });
  });
});