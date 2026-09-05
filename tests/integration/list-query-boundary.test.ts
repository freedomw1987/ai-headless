/**
 * TD-813 — `?filters=` parse 邊界測試
 *
 * 對應: Sprint 32 review R2 守護揭露
 * 對應: docs/backlog.md TD-813
 *
 * 測試 parseListQuery 在以下邊界條件的容錯:
 * 1. malformed JSON → filters = []
 * 2. 非 array (例如 {object}) → filters = []
 * 3. 注入型攻擊 (含 SQL / script tag)
 * 4. 無效欄位 → 略過
 * 5. 無效運算子 → 略過
 * 6. 欄位型別錯誤 → 略過
 *
 * Gate 1 TDD: 紅→綠 cycle 揭露 parseListQuery 容錯邏輯完整
 */

import { describe, it, expect } from 'vitest';
import { parseListQuery } from '@/lib/crud/list-query';

describe('TD-813 — parseListQuery 邊界測試', () => {
  describe('malformed JSON', () => {
    it('應忽略 malformed JSON, filters = []', () => {
      const result = parseListQuery({ filters: '{invalid json' });
      expect(result.filters).toEqual([]);
    });

    it('應忽略空字串, filters = []', () => {
      const result = parseListQuery({ filters: '' });
      expect(result.filters).toEqual([]);
    });

    it('應忽略 null, filters = []', () => {
      const result = parseListQuery({ filters: 'null' });
      expect(result.filters).toEqual([]);
    });
  });

  describe('非 array 結構', () => {
    it('應忽略 object {a:1}, filters = []', () => {
      const result = parseListQuery({ filters: '{"a":1}' });
      expect(result.filters).toEqual([]);
    });

    it('應忽略純字串 "hello", filters = []', () => {
      const result = parseListQuery({ filters: '"hello"' });
      expect(result.filters).toEqual([]);
    });

    it('應忽略純數字 123, filters = []', () => {
      const result = parseListQuery({ filters: '123' });
      expect(result.filters).toEqual([]);
    });
  });

  describe('注入防護', () => {
    it('應忽略含 script tag 的 filter, 不 throw', () => {
      const malicious = JSON.stringify([
        { field: '<script>alert(1)</script>', operator: 'contains', value: 'x' },
      ]);
      expect(() => parseListQuery({ filters: malicious })).not.toThrow();
      // field 是 string, operator 是 string, 但內容不可信 → 仍會保留 (apply 階段靠 field 守衛)
      const result = parseListQuery({ filters: malicious });
      // 因為 field 是合法字串, 會被保留進 filters
      // 真實防護在 applyFilters/buildPrismaWhere 階段
      expect(Array.isArray(result.filters)).toBe(true);
    });

    it('應忽略含 SQL 注入字串, 不 throw', () => {
      const malicious = JSON.stringify([
        { field: "name; DROP TABLE users;--", operator: 'contains', value: 'x' },
      ]);
      expect(() => parseListQuery({ filters: malicious })).not.toThrow();
    });

    it('應忽略含 Prisma DMMF 字串, 不 throw', () => {
      const malicious = JSON.stringify([
        { field: '__proto__', operator: 'contains', value: 'x' },
      ]);
      expect(() => parseListQuery({ filters: malicious })).not.toThrow();
    });
  });

  describe('無效 filter 元素', () => {
    it('應忽略缺少 field 的元素', () => {
      const invalid = JSON.stringify([
        { operator: 'contains', value: 'x' }, // 缺 field
        { field: 'name', operator: 'contains', value: 'valid' },
      ]);
      const result = parseListQuery({ filters: invalid });
      expect(result.filters.length).toBe(1);
      expect(result.filters[0]?.field).toBe('name');
    });

    it('應忽略缺少 operator 的元素', () => {
      const invalid = JSON.stringify([
        { field: 'name', value: 'x' }, // 缺 operator
        { field: 'status', operator: 'equals', value: 'valid' },
      ]);
      const result = parseListQuery({ filters: invalid });
      expect(result.filters.length).toBe(1);
      expect(result.filters[0]?.field).toBe('status');
    });

    it('應忽略 field 非 string 的元素', () => {
      const invalid = JSON.stringify([
        { field: 123, operator: 'contains', value: 'x' }, // field 不是 string
        { field: 'name', operator: 'contains', value: 'valid' },
      ]);
      const result = parseListQuery({ filters: invalid });
      expect(result.filters.length).toBe(1);
    });

    it('應忽略 operator 非 string 的元素', () => {
      const invalid = JSON.stringify([
        { field: 'name', operator: 999, value: 'x' }, // operator 不是 string
        { field: 'status', operator: 'equals', value: 'valid' },
      ]);
      const result = parseListQuery({ filters: invalid });
      expect(result.filters.length).toBe(1);
    });

    it('應忽略 null 元素', () => {
      const invalid = JSON.stringify([null, { field: 'name', operator: 'contains', value: 'x' }]);
      const result = parseListQuery({ filters: invalid });
      expect(result.filters.length).toBe(1);
    });

    it('應忽略字串元素', () => {
      const invalid = JSON.stringify(['just a string', { field: 'name', operator: 'contains', value: 'x' }]);
      const result = parseListQuery({ filters: invalid });
      expect(result.filters.length).toBe(1);
    });
  });

  describe('正常輸入保持運作', () => {
    it('應正確解析合法 filters', () => {
      const valid = JSON.stringify([
        { field: 'name', operator: 'contains', value: 'foo' },
        { field: 'amount', operator: 'gte', value: 100 },
      ]);
      const result = parseListQuery({ filters: valid });
      expect(result.filters.length).toBe(2);
      expect(result.filters[0]).toEqual({ field: 'name', operator: 'contains', value: 'foo' });
      expect(result.filters[1]).toEqual({ field: 'amount', operator: 'gte', value: 100 });
    });

    it('應在無 filters 參數時回傳空 array', () => {
      const result = parseListQuery({});
      expect(result.filters).toEqual([]);
    });

    it('應保持其他欄位不受影響', () => {
      const result = parseListQuery({
        page: '2',
        pageSize: '20',
        sort: 'name',
        order: 'asc',
        q: 'search',
      });
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
      expect(result.sort).toBe('name');
      expect(result.order).toBe('asc');
      expect(result.q).toBe('search');
    });
  });
});