/**
 * Event Hook: beforeCreate
 *
 * 驗證：
 * 1. startAt < endAt
 * 2. capacity >= 0
 * 3. startAt 必須是未來時間
 */

import type { HookContext } from '@/lib/hooks/hook-sdk';

export async function beforeCreateEvent(
  ctx: HookContext<'beforeCreate'>,
): Promise<Record<string, unknown>> {
  const data = ctx.data;

  // 1. startAt < endAt
  if (data.startAt && data.endAt) {
    const start = new Date(data.startAt as string).getTime();
    const end = new Date(data.endAt as string).getTime();
    if (start >= end) {
      throw new Error('Event startAt must be before endAt');
    }
  }

  // 2. capacity >= 0
  if (typeof data.capacity === 'number' && data.capacity < 0) {
    throw new Error('Event capacity must be >= 0');
  }

  // 3. startAt 必須是未來時間
  if (data.startAt) {
    const start = new Date(data.startAt as string).getTime();
    if (start < Date.now()) {
      throw new Error('Event startAt must be in the future');
    }
  }

  // 預設 status
  if (!data.status) {
    data.status = 'upcoming';
  }

  return data;
}