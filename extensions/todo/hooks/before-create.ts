/**
 * Todo Hook: beforeCreate
 *
 * 在建立 Todo 之前自動執行：
 * 1. trim title（去除頭尾空白）
 * 2. 預設 dueDate（+7 天後）
 * 3. 預設 priority = 'medium'
 */

import type { HookContext } from '@/lib/hooks/hook-sdk';

export async function beforeCreateTodo(
  ctx: HookContext<'beforeCreate'>,
): Promise<Record<string, unknown>> {
  const data = ctx.data;

  // 1. trim title
  if (typeof data.title === 'string') {
    data.title = data.title.trim();
  }

  // 2. 預設 dueDate（+7 天後）
  if (!data.dueDate) {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    data.dueDate = due.toISOString();
  }

  // 3. 預設 priority
  if (!data.priority) {
    data.priority = 'medium';
  }

  return data;
}