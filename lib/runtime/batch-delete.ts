// Sprint B3 (CRUD 列表頁增強 v1.1) — Batch Delete 業務邏輯
//
// 平行呼叫現有 delete handler，個別失敗不擋整批。
//
// Gate 1 TDD: 見 tests/integration/crud-batch-delete-api.test.ts

import type { DynamicHandlers, HandlerContext } from '@/lib/runtime/dynamic-handler';

export type BatchDeleteResult = {
  deleted: number;
  failed: Array<{ id: string; error: string }>;
};

export async function batchDeleteSpecItems(
  handlers: Pick<DynamicHandlers, 'delete'>,
  ctx: HandlerContext,
  ids: string[],
): Promise<BatchDeleteResult> {
  if (ids.length === 0) {
    return { deleted: 0, failed: [] };
  }

  const results = await Promise.all(
    ids.map(async (id) => {
      const result = await handlers.delete({ ...ctx, params: { id } });
      return { id, result };
    }),
  );

  const failed: Array<{ id: string; error: string }> = [];
  let deleted = 0;
  for (const { id, result } of results) {
    if (result.status >= 200 && result.status < 300) {
      deleted++;
    } else {
      failed.push({ id, error: result.error ?? `HTTP ${result.status}` });
    }
  }

  return { deleted, failed };
}
