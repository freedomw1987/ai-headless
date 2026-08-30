/**
 * Sprint B3 TDD — Batch Delete 業務邏輯
 *
 * 測試核心邏輯: batchDeleteSpecItems()
 * - 平行呼叫現有 delete handler
 * - 收集成功 / 失敗
 * - 不擋整批 (個別失敗繼續)
 */

import { describe, it, expect } from 'vitest';
import { batchDeleteSpecItems } from '@/lib/runtime/batch-delete';
import type { DynamicHandlers, HandlerContext } from '@/lib/runtime/dynamic-handler';

function makeHandler(shouldFail: (id: string) => string | null) {
  const deleteFn: DynamicHandlers['delete'] = async (ctx) => {
    const id = ctx.params?.id;
    if (!id) return { status: 400, error: 'id 必填' };
    const failReason = shouldFail(id);
    if (failReason) return { status: 500, error: failReason };
    return { status: 204 };
  };
  return { delete: deleteFn } as Pick<DynamicHandlers, 'delete'>;
}

const ctx: HandlerContext = {
  user: { id: 'u1', role: 'admin' },
  query: {},
  params: {},
};

describe('Sprint B3 — batchDeleteSpecItems()', () => {
  it('全部成功 → { deleted: N, failed: [] }', async () => {
    const handlers = makeHandler(() => null);
    const result = await batchDeleteSpecItems(handlers, ctx, ['1', '2', '3']);
    expect(result.deleted).toBe(3);
    expect(result.failed).toEqual([]);
  });

  it('部分失敗 → { deleted: X, failed: [{id, error}] }', async () => {
    const handlers = makeHandler((id) => (id === '999' ? 'not found' : null));
    const result = await batchDeleteSpecItems(handlers, ctx, ['1', '999', '2']);
    expect(result.deleted).toBe(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toEqual({ id: '999', error: 'not found' });
  });

  it('全部失敗 → { deleted: 0, failed: [...] }', async () => {
    const handlers = makeHandler(() => 'always fail');
    const result = await batchDeleteSpecItems(handlers, ctx, ['1', '2']);
    expect(result.deleted).toBe(0);
    expect(result.failed).toHaveLength(2);
  });

  it('空 ids array → { deleted: 0, failed: [] }', async () => {
    const handlers = makeHandler(() => null);
    const result = await batchDeleteSpecItems(handlers, ctx, []);
    expect(result.deleted).toBe(0);
    expect(result.failed).toEqual([]);
  });

  it('平行執行 (Promise.all) — 所有 id 都會被處理', async () => {
    let calls: string[] = [];
    const handlers = makeHandler((id) => {
      calls.push(id);
      return null;
    });
    await batchDeleteSpecItems(handlers, ctx, ['a', 'b', 'c']);
    expect(calls.sort()).toEqual(['a', 'b', 'c']);
  });
});
