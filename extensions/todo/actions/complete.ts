/**
 * Todo Action: complete
 *
 * 標記 Todo 為已完成：
 * - completed = true
 * - 完成時間戳
 * - 不可重複標記（已是完成狀態時報錯）
 *
 * Sprint 31 commit 1: 加 TransitionLog (audit trail)
 */

import { db } from '@/lib/db';
import type { ActionContext } from '@/lib/actions/action-sdk';

export async function completeTodo(
  _input: Record<string, unknown>,
  ctx: ActionContext,
): Promise<Record<string, unknown>> {
  const record = ctx.data;

  if (!record) {
    throw new Error('completeTodo: record not found in context');
  }

  if (record.completed === true) {
    throw new Error('Todo already completed');
  }

  // Sprint 31 commit 1: 寫 TransitionLog (audit trail)
  // 從 record.id 讀 todo id, 從 ctx.userId 讀 userId
  // Note: completeTodo 不查 DB 讀 fromState,使用 'pending' 作為 fromState
  //       (因為 Todo 沒有複雜的 state machine, 只有 completed bool)
  await db.transitionLog.create({
    data: {
      machineName: 'todo',
      entityType: 'Todo',
      entityId: (record.id as string),
      fromState: 'pending',
      toState: 'completed',
      userId: (ctx as unknown as { userId?: string }).userId ?? null,
      reason: 'complete',
    },
  });

  return {
    ...record,
    completed: true,
    completedAt: new Date().toISOString(),
  };
}