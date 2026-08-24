/**
 * Event Action: registerAttendee
 *
 * 報名活動：
 * - 檢查容量（透過 ctx.existingCount）
 * - 檢查重複報名（透過 ctx.alreadyRegistered）
 * - 建立 Registration record
 */

import type { ActionContext } from '@/lib/actions/action-sdk';

export async function registerAttendee(
  input: { userId: string },
  ctx: ActionContext,
): Promise<Record<string, unknown>> {
  const event = ctx.data as {
    id?: string;
    capacity?: number;
    status?: string;
    registeredCount?: number;
  };

  const existingCount = (ctx.ctx?.existingCount as number | undefined) ?? 0;
  const alreadyRegistered = (ctx.ctx?.alreadyRegistered as boolean | undefined) ?? false;

  if (alreadyRegistered) {
    throw new Error('User already registered for this event');
  }

  if (event.status === 'cancelled') {
    throw new Error('Cannot register for a cancelled event');
  }
  if (event.status === 'past') {
    throw new Error('Cannot register for a past event');
  }

  if (event.capacity && event.capacity > 0 && existingCount >= event.capacity) {
    throw new Error('Event is full');
  }

  return {
    eventId: event.id,
    userId: input.userId,
    registeredAt: new Date().toISOString(),
  };
}