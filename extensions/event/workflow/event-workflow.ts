/**
 * Event Workflow — 活動管理
 *
 * 簡單 CRUD + 自動狀態（依時間自動切 upcoming → ongoing → past）
 * 不使用 StateMachine（沒有複雜狀態流轉）
 */

import { db } from '@/lib/db';

export type EventStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled';

/**
 * 根據時間自動推算狀態
 */
function deriveStatus(startAt: Date, endAt: Date, current: string): EventStatus {
  if (current === 'cancelled') return 'cancelled';
  const now = new Date();
  if (now < startAt) return 'upcoming';
  if (now >= startAt && now < endAt) return 'ongoing';
  return 'past';
}

export async function listEvents() {
  const events = await db.event.findMany({
    where: { deletedAt: null },
    orderBy: { startAt: 'asc' },
  });
  return events;
}

export async function getEvent(id: string) {
  return db.event.findUniqueOrThrow({ where: { id } });
}

export async function createEvent(input: {
  title: string;
  description?: string;
  startAt: string | Date;
  endAt: string | Date;
  location?: string;
  capacity?: number;
}) {
  if (!input.title?.trim()) throw new Error('title 必填');
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (endAt <= startAt) throw new Error('endAt 必須在 startAt 之後');

  return db.event.create({
    data: {
      title: input.title.trim(),
      description: input.description ?? '',
      startAt,
      endAt,
      location: input.location ?? '',
      capacity: input.capacity ?? 0,
      status: 'upcoming',
    },
  });
}

export async function updateEvent(
  id: string,
  input: {
    title?: string;
    description?: string;
    startAt?: string | Date;
    endAt?: string | Date;
    location?: string;
    capacity?: number;
    status?: EventStatus;
  },
) {
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title.trim();
  if (input.description !== undefined) update.description = input.description;
  if (input.startAt !== undefined) update.startAt = new Date(input.startAt);
  if (input.endAt !== undefined) update.endAt = new Date(input.endAt);
  if (input.location !== undefined) update.location = input.location;
  if (input.capacity !== undefined) update.capacity = input.capacity;
  if (input.status !== undefined) update.status = input.status;
  return db.event.update({ where: { id }, data: update });
}

export async function deleteEvent(id: string) {
  return db.event.delete({ where: { id } });
}

export async function cancelEvent(id: string) {
  return db.event.update({ where: { id }, data: { status: 'cancelled' } });
}

// Sprint 29 commit 4: 新增 transitionEvent 函式 (與 Order/Blog 一致)
export async function transitionEvent(
  id: string,
  event: string,
  payload?: Record<string, unknown>,
) {
  return db.$transaction(async (tx) => {
    const evt = await tx.event.findUniqueOrThrow({ where: { id } });
    const fromState = evt.status;

    // Event lifecycle workflow: upcoming → ongoing, ongoing → past, etc.
    // (在 spec 定義的 transitions)
    const transitions: Record<string, Record<string, string>> = {
      upcoming: { start: 'ongoing', cancel: 'cancelled' },
      ongoing: { end: 'past', cancel: 'cancelled' },
      past: {},
      cancelled: {},
    };
    const toState = transitions[fromState]?.[event];
    if (!toState) {
      throw new Error(
        `Event transition 不存在: ${fromState} --(${event})--> ?`,
      );
    }

    const updated = await tx.event.update({
      where: { id },
      data: { status: toState },
    });

    // 寫 TransitionLog
    await tx.transitionLog.create({
      data: {
        machineName: 'event-lifecycle',
        entityType: 'Event',
        entityId: id,
        fromState,
        toState,
        userId: (payload?.userId as string) ?? null,
        reason: event,
      },
    });

    return updated;
  });
}