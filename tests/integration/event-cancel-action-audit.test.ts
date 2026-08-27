/**
 * TDD Gate 1 — Sprint 31 commit 2
 * cancelEvent (action hook) 加 transition log
 *
 * 對應 PRD: docs/specs/extension-spec.md (Event)
 * 對應 Backlog: TD-新發現 E (Sprint 30 reflection 揭露)
 *
 * 問題:
 * - cancelEvent 設定 status = 'cancelled' (action hook)
 * - 但沒有寫 TransitionLog → 對 Event 狀態變更無 audit trail
 *
 * 修正:
 * - cancelEvent 內部呼叫 db.transitionLog.create
 * - 記錄: machineName: 'event-lifecycle', entityType: 'Event',
 *   fromState: 來自 ctx.data.status, toState: 'cancelled',
 *   userId: ctx.userId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const eventMock: any = {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const transitionLogMock: any = {
    create: vi.fn(),
  };
  return {
    db: {
      event: eventMock,
      transitionLog: transitionLogMock,
    },
  };
});

import { db } from '@/lib/db';
import { cancelEvent } from '@/extensions/event/actions/cancel-event';

describe('Sprint 31 commit 2 — cancelEvent action 加 transition log', () => {
  let capturedLog: any;

  beforeEach(() => {
    capturedLog = null;
    (db.event as any).findUnique.mockReset();
    (db.transitionLog as any).create.mockReset();

    (db.transitionLog as any).create.mockImplementation(
      async ({ data }: any) => {
        capturedLog = data;
        return { id: 'log-1', ...data };
      },
    );
  });

  it('upcoming event → cancel → 寫 TransitionLog', async () => {
    const ctx = {
      data: { id: 'event-1', title: 'Test Event', status: 'upcoming' },
      userId: 'u-user-1',
    };

    const result = await cancelEvent({}, ctx as any);

    expect(result.status).toBe('cancelled');
    expect(capturedLog).not.toBeNull();
    expect(capturedLog.machineName).toBe('event-lifecycle');
    expect(capturedLog.entityType).toBe('Event');
    expect(capturedLog.entityId).toBe('event-1');
    expect(capturedLog.fromState).toBe('upcoming');
    expect(capturedLog.toState).toBe('cancelled');
    expect(capturedLog.reason).toBe('cancel');
    expect(capturedLog.userId).toBe('u-user-1');
  });

  it('ongoing event → cancel → 寫 TransitionLog (fromState: ongoing)', async () => {
    const ctx = {
      data: { id: 'event-1', status: 'ongoing' },
      userId: 'u-user-1',
    };

    await cancelEvent({}, ctx as any);

    expect(capturedLog.fromState).toBe('ongoing');
  });

  it('past event → cancel 拋錯 → 不寫 log', async () => {
    const ctx = {
      data: { id: 'event-1', status: 'past' },
      userId: 'u-user-1',
    };

    await expect(cancelEvent({}, ctx as any)).rejects.toThrow(/past/);
    expect(capturedLog).toBeNull();
  });

  it('已 cancelled event → cancel 拋錯 → 不寫 log', async () => {
    const ctx = {
      data: { id: 'event-1', status: 'cancelled' },
      userId: 'u-user-1',
    };

    await expect(cancelEvent({}, ctx as any)).rejects.toThrow(
      /already cancelled/,
    );
    expect(capturedLog).toBeNull();
  });
});