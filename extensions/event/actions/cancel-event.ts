/**
 * Event Action: cancelEvent
 *
 * 取消活動：
 * - 設定 status = 'cancelled'
 * - 已過期活動不可取消
 */

import type { ActionContext } from '@/lib/actions/action-sdk';

export async function cancelEvent(
  _input: Record<string, unknown>,
  ctx: ActionContext,
): Promise<Record<string, unknown>> {
  const event = ctx.data as {
    status?: string;
    endAt?: string;
  };

  if (event.status === 'past') {
    throw new Error('Cannot cancel a past event');
  }

  if (event.status === 'cancelled') {
    throw new Error('Event already cancelled');
  }

  return {
    ...event,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  };
}