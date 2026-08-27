/**
 * Event Action: cancelEvent
 *
 * 取消活動：
 * - 設定 status = 'cancelled'
 * - 已過期活動不可取消
 *
 * Sprint 31 commit 2: 加 TransitionLog (audit trail)
 */

import { db } from '@/lib/db';
import type { ActionContext } from '@/lib/actions/action-sdk';

export async function cancelEvent(
  _input: Record<string, unknown>,
  ctx: ActionContext,
): Promise<Record<string, unknown>> {
  const event = ctx.data as {
    id?: string;
    status?: string;
    endAt?: string;
  };

  if (event.status === 'past') {
    throw new Error('Cannot cancel a past event');
  }

  if (event.status === 'cancelled') {
    throw new Error('Event already cancelled');
  }

  // Sprint 31 commit 2: 寫 TransitionLog (audit trail)
  // 從 event.id 讀 entityId, fromState = 原 status, toState = 'cancelled'
  const userId =
    (ctx.ctx?.userId as string | undefined) ??
    ((ctx as unknown as { userId?: string }).userId) ??
    null;
  await db.transitionLog.create({
    data: {
      machineName: 'event-lifecycle',
      entityType: 'Event',
      entityId: (event.id as string) ?? '',
      fromState: event.status ?? 'unknown',
      toState: 'cancelled',
      userId,
      reason: 'cancel',
    },
  });

  return {
    ...event,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  };
}