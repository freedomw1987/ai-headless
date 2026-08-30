// Sprint B3 (CRUD 列表頁增強 v1.1) — Batch Delete 業務邏輯
// Sprint 41-4 (TD-806) — 加 TransitionLog + max batch cap
//
// 平行呼叫現有 delete handler，個別失敗不擋整批。
// TD-806: 為每筆刪除寫 TransitionLog (跟 Sprint 31 cancelEvent 一致)
// TD-806: max batch size cap (避免自我 DoS)
//
// Gate 1 TDD: 見 tests/integration/crud-batch-delete-api.test.ts

import type { DynamicHandlers, HandlerContext } from '@/lib/runtime/dynamic-handler';
import { db } from '@/lib/db';

// TD-806: 預設最大 batch size (避免使用者一次刪除整張表)
export const MAX_BATCH_SIZE = 100;

export type BatchDeleteResult = {
  deleted: number;
  failed: Array<{ id: string; error: string }>;
};

export async function batchDeleteSpecItems(
  handlers: Pick<DynamicHandlers, 'delete'>,
  ctx: HandlerContext,
  ids: string[],
): Promise<BatchDeleteResult> {
  // TD-806: 防自我 DoS — 限制 max batch size
  if (ids.length > MAX_BATCH_SIZE) {
    return {
      deleted: 0,
      failed: ids.slice(0, MAX_BATCH_SIZE).map((id) => ({
        id,
        error: `batch 超過上限 ${MAX_BATCH_SIZE}, 請分批刪除`,
      })),
    };
  }

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
      // TD-806: 為每筆刪除寫 TransitionLog (audit trail)
      // 注意: 不阻擙刪除結果, 寫 log 失敗也忽略
      try {
        await db.transitionLog.create({
          data: {
            machineName: ctx.user?.role ?? 'unknown',
            entityType: 'BatchDelete',
            entityId: id,
            fromState: 'active',
            toState: 'deleted',
            userId: ctx.user?.id ?? null,
            reason: 'batch delete',
          },
        });
      } catch {
        // 寫 log 失敗不阻擙刪除結果 (audit 紀錄可補)
      }
    } else {
      failed.push({ id, error: result.error ?? `HTTP ${result.status}` });
    }
  }

  return { deleted, failed };
}
