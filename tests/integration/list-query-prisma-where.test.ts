/**
 * Sprint D 修補 — buildPrismaWhere
 *
 * 為什麼：handler.findMany(skip+take) 先分頁再套用 filter 會出 bug。
 * 修法：把 filter 條件轉 Prisma where，讓 DB 先 filter 再分頁。
 */

import { describe, it, expect } from 'vitest';
import { buildPrismaWhere, type FilterableField } from '@/lib/crud/list-query';

describe('Sprint D fix — buildPrismaWhere', () => {
  it('empty filters → empty where', () => {
    const result = buildPrismaWhere([], []);
    expect(result).toEqual({});
  });

  it('string contains → Prisma { contains }', () => {
    const fields: FilterableField[] = [{ name: 'title', type: 'string' }];
    const result = buildPrismaWhere(
      [{ field: 'title', operator: 'contains', value: '台北' }],
      fields,
    );
    expect(result).toEqual({ title: { contains: '台北' } });
  });

  it('number gte → Prisma { gte }', () => {
    const fields: FilterableField[] = [{ name: 'amount', type: 'integer' }];
    const result = buildPrismaWhere(
      [{ field: 'amount', operator: 'gte', value: 2000 }],
      fields,
    );
    expect(result).toEqual({ amount: { gte: 2000 } });
  });

  it('number between → Prisma { gte, lte }', () => {
    const fields: FilterableField[] = [{ name: 'amount', type: 'number' }];
    const result = buildPrismaWhere(
      [{ field: 'amount', operator: 'between', value: [100, 500] }],
      fields,
    );
    expect(result).toEqual({ amount: { gte: 100, lte: 500 } });
  });

  it('enum in → Prisma { in: [...] }', () => {
    const fields: FilterableField[] = [{ name: 'status', type: 'enum', enumValues: ['draft', 'published'] }];
    const result = buildPrismaWhere(
      [{ field: 'status', operator: 'in', value: ['published'] }],
      fields,
    );
    expect(result).toEqual({ status: { in: ['published'] } });
  });

  it('boolean isTrue → Prisma { true }', () => {
    const fields: FilterableField[] = [{ name: 'completed', type: 'boolean' }];
    const result = buildPrismaWhere(
      [{ field: 'completed', operator: 'isTrue', value: null }],
      fields,
    );
    expect(result).toEqual({ completed: true });
  });

  it('datetime from → Prisma { gte: Date }', () => {
    const fields: FilterableField[] = [{ name: 'dueDate', type: 'datetime' }];
    const result = buildPrismaWhere(
      [{ field: 'dueDate', operator: 'from', value: '2024-06-01T00:00' }],
      fields,
    );
    expect(result).toEqual({ dueDate: { gte: new Date('2024-06-01T00:00') } });
  });

  it('multiple filters → Prisma AND', () => {
    const fields: FilterableField[] = [
      { name: 'amount', type: 'integer' },
      { name: 'status', type: 'enum', enumValues: ['paid'] },
    ];
    const result = buildPrismaWhere(
      [
        { field: 'amount', operator: 'gte', value: 2000 },
        { field: 'status', operator: 'in', value: ['paid'] },
      ],
      fields,
    );
    expect(result).toEqual({
      AND: [
        { amount: { gte: 2000 } },
        { status: { in: ['paid'] } },
      ],
    });
  });

  it('unknown field → 略過，不 throw', () => {
    const fields: FilterableField[] = [{ name: 'amount', type: 'integer' }];
    const result = buildPrismaWhere(
      [{ field: 'ghost', operator: 'gte', value: 100 }],
      fields,
    );
    expect(result).toEqual({});
  });

  it('integer + gte (order amount bug scenario)', () => {
    // 還原 user 報告：order amount >= 2000
    const fields: FilterableField[] = [{ name: 'amount', type: 'integer' }];
    const result = buildPrismaWhere(
      [{ field: 'amount', operator: 'gte', value: 2000 }],
      fields,
    );
    expect(result).toEqual({ amount: { gte: 2000 } });
  });
});