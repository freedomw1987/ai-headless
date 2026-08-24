/**
 * Event Hook: beforeRegister（用在 Registration.beforeCreate）
 *
 * 檢查：
 * 1. 活動是否已取消
 * 2. 活動是否還有名額（capacity === 0 表示不限）
 * 3. 使用者是否已報名（需傳 existingCount 或重複報名檢查）
 */

import type { HookContext } from '@/lib/hooks/hook-sdk';

export async function beforeRegister(
  ctx: HookContext<'beforeCreate'>,
): Promise<Record<string, unknown>> {
  const data = ctx.data;
  const eventCtx = (ctx.ctx ?? {}) as {
    event?: { capacity?: number; status?: string };
    existingCount?: number;
  };

  // 1. 活動狀態檢查
  if (eventCtx.event?.status === 'cancelled') {
    throw new Error('Cannot register for a cancelled event');
  }
  if (eventCtx.event?.status === 'past') {
    throw new Error('Cannot register for a past event');
  }

  // 2. 容量檢查（capacity === 0 = 不限）
  if (typeof eventCtx.event?.capacity === 'number' && eventCtx.event.capacity > 0) {
    const current = eventCtx.existingCount ?? 0;
    if (current >= eventCtx.event.capacity) {
      throw new Error('Event is full');
    }
  }

  // 3. 自動設定報名時間
  if (!data.registeredAt) {
    data.registeredAt = new Date().toISOString();
  }

  return data;
}