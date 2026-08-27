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

// Sprint 30 commit 1: 從 spec 動態讀取 (而非寫死)
import { loadSpec } from '@/lib/runtime/spec-loader';

// Sprint 30 commit 1: 從 spec 動態讀 (TD-新發現 C)
// Event spec 用 lifecycle workflow, transition 無 event 欄位
// (所有 transition 為時間觸發) 。 event handler 依 fromState + 傳入的 event 名
// 推導 toState: 以 fromState 為 key , 查所有 transition 找到 toState
async function buildEventTransitions(
  fromState: string,
  event: string,
): Promise<string | null> {
  const spec = await loadSpec('event');
  const wf = spec.models[0]?.workflows?.[0];
  if (!wf) return null;
  for (const t of wf.transitions) {
    const froms = Array.isArray(t.from) ? t.from : [t.from];
    if (!froms.includes(fromState)) continue;
    // event 名稱 (start/end/cancel) 決定 toState
    // upcoming --start--> ongoing, upcoming --cancel--> cancelled
    // ongoing --end--> past, ongoing --cancel--> cancelled
    // 根據 event 名推導 (to 是唯一且明確)
    if (event === 'start' && t.to === 'ongoing') return t.to;
    if (event === 'end' && t.to === 'past') return t.to;
    if (event === 'cancel' && t.to === 'cancelled') return t.to;
  }
  return null;
}

// Sprint 30 commit 1: 新增 transitionEvent 函式 (與 Order/Blog 一致)
export async function transitionEvent(
  id: string,
  event: string,
  payload?: Record<string, unknown>,
) {
  return db.$transaction(async (tx) => {
    const evt = await tx.event.findUniqueOrThrow({ where: { id } });
    const fromState = evt.status;

    // Sprint 30 commit 1: 從 spec 動態讀取 (TD-新發現 C 修正)
    const toState = await buildEventTransitions(fromState, event);
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