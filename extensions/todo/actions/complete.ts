/**
 * Todo Action: complete
 *
 * 標記 Todo 為已完成：
 * - completed = true
 * - 完成時間戳
 * - 不可重複標記（已是完成狀態時報錯）
 */

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

  return {
    ...record,
    completed: true,
    completedAt: new Date().toISOString(),
  };
}