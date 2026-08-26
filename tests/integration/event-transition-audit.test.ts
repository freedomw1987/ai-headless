/**
 * TDD Gate 1 — Sprint 29 commit 4
 * Event transition 整合 TransitionLog
 *
 * 對應 PRD: docs/specs/extension-spec.md (Event)
 * 對應 Backlog: Sprint 28 reflection 揭露的 TD-新發現 A
 *
 * 問題:
 * - event-workflow.ts 沒有 transitionEvent 函式 (動態 handler 期待)
 * - 即使有, 也沒寫 TransitionLog
 * - 對 event status 變更無 audit trail
 *
 * 修正 (此 commit):
 * - 在 event-workflow.ts 新增 transitionEvent 函式
 * - 改用 db.$transaction + 寫 TransitionLog
 * - 從 payload?.userId 讀取 userId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const eventMock: any = {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  };
  const transitionLogMock: any = {
    create: vi.fn(),
  };
  return {
    db: {
      event: eventMock,
      transitionLog: transitionLogMock,
      $transaction: vi.fn(async (fn: any) =>
        fn({ event: eventMock, transitionLog: transitionLogMock }),
      ),
    },
  };
});

import { db } from '@/lib/db';
import { transitionEvent } from '@/extensions/event/workflow/event-workflow';

describe('Sprint 29 commit 4 — Event transition 整合 TransitionLog', () => {
  let currentStatus: string;
  let capturedLog: any;

  beforeEach(() => {
    currentStatus = 'upcoming';
    capturedLog = null;

    (db.event as any).findUniqueOrThrow.mockReset();
    (db.event as any).update.mockReset();
    (db.transitionLog as any).create.mockReset();
    (db.$transaction as any).mockReset();

    (db.event as any).findUniqueOrThrow.mockImplementation(
      async () =>
        ({
          id: 'event-1',
          status: currentStatus,
          title: 'Test Event',
        }) as any,
    );
    (db.event as any).update.mockImplementation(
      async ({ where, data }: any) => {
        currentStatus = data.status;
        return { id: where.id, status: data.status } as any;
      },
    );
    (db.transitionLog as any).create.mockImplementation(
      async ({ data }: any) => {
        capturedLog = data;
        return { id: 'log-1', ...data } as any;
      },
    );
    (db.$transaction as any).mockImplementation(async (fn: any) =>
      fn({ event: db.event, transitionLog: db.transitionLog }),
    );
  });

  it('upcoming → cancelled → 寫 TransitionLog', async () => {
    // 動態 handler 用 event 觸發
    // event spec workflow: upcoming --(None)--> cancelled
    // 需為 event 也定義 event types
    await transitionEvent('event-1', 'cancel', { userId: 'u-admin-1' });

    expect(capturedLog).not.toBeNull();
    expect(capturedLog.machineName).toBe('event-lifecycle');
    expect(capturedLog.fromState).toBe('upcoming');
    expect(capturedLog.toState).toBe('cancelled');
    expect(capturedLog.entityType).toBe('Event');
    expect(capturedLog.entityId).toBe('event-1');
    expect(capturedLog.userId).toBe('u-admin-1');
  });
});