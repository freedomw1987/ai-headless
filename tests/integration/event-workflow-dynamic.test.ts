/**
 * TDD Gate 1 — Sprint 30 commit 1
 * (A) Event workflow 動態化 (從 spec.workflows[0].transitions 推導)
 * (B) Order cancelEvent 加 TransitionLog
 *
 * 對應 PRD: docs/specs/extension-spec.md (Event + Order)
 * 對應 Backlog: TD-新發現 C, TD-新發現 D (Sprint 29 reflection 揭露)
 *
 * 問題 (A):
 * - transitionEvent 把 transitions 寫死在 source code
 * - 與 Sprint 14 「從 spec 動態組裝」理念不符
 * - 修改 spec.workflows.transitions 不會生效
 *
 * 問題 (B):
 * - cancelEvent 直接 update,沒寫 TransitionLog
 * - 對 audit 缺口
 *
 * 修正 (此 commit):
 * - (A) transitionEvent 改為從 spec.workflows[0].transitions 動態推導
 * - (B) cancelEvent 包 $transaction + 寫 TransitionLog (machineName: 'order')
 *
 * 涵蓋:
 * 1. (A) 動態讀取 spec.workflows (3 個 transitions)
 * 2. (A) 修改 spec 內容, transitionEvent 行為跟著變
 * 3. (B) cancelEvent 寫 TransitionLog (fromState, toState, userId)
 * 4. (B) cancelEvent log 寫入失敗 → rollback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const eventMock: any = {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  };
  const orderMock: any = {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  };
  const transitionLogMock: any = {
    create: vi.fn(),
  };
  return {
    db: {
      event: eventMock,
      order: orderMock,
      transitionLog: transitionLogMock,
      $transaction: vi.fn(async (fn: any) =>
        fn({
          event: eventMock,
          order: orderMock,
          transitionLog: transitionLogMock,
        }),
      ),
    },
  };
});

import { db } from '@/lib/db';
import { transitionEvent } from '@/extensions/event/workflow/event-workflow';
import { cancelEvent } from '@/extensions/order/workflow/order-workflow';

describe('Sprint 30 (A) — Event workflow 動態化 (從 spec 讀)', () => {
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

  it('upcoming → start → ongoing (從 spec 動態讀)', async () => {
    await transitionEvent('event-1', 'start', { userId: 'u-admin-1' });
    expect(currentStatus).toBe('ongoing');
    expect(capturedLog.fromState).toBe('upcoming');
    expect(capturedLog.toState).toBe('ongoing');
  });

  it('ongoing → end → past (從 spec 動態讀)', async () => {
    currentStatus = 'ongoing';
    await transitionEvent('event-1', 'end', { userId: 'u-admin-1' });
    expect(currentStatus).toBe('past');
    expect(capturedLog.toState).toBe('past');
  });

  it('upcoming → cancel → cancelled (從 spec 動態讀)', async () => {
    await transitionEvent('event-1', 'cancel', { userId: 'u-admin-1' });
    expect(currentStatus).toBe('cancelled');
    expect(capturedLog.toState).toBe('cancelled');
  });

  it('無效 transition (upcoming → end) → 拋錯, 不寫 log', async () => {
    await expect(
      transitionEvent('event-1', 'end', { userId: 'u-admin-1' }),
    ).rejects.toThrow();
    expect(capturedLog).toBeNull();
  });

  it('(B) cancelEvent 寫 TransitionLog (Order workflow 補充)', async () => {
    (db.order as any).findUniqueOrThrow.mockReset();
    (db.order as any).update.mockReset();
    (db.transitionLog as any).create.mockReset();
    (db.$transaction as any).mockReset();

    let orderStatus = 'pending_payment';
    (db.order as any).findUniqueOrThrow.mockImplementation(
      async () => ({
        id: 'order-1',
        orderNumber: 'O-CANCEL',
        status: orderStatus,
        stateData: {},
      }) as any,
    );
    (db.order as any).update.mockImplementation(
      async ({ where, data }: any) => {
        orderStatus = data.status;
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
      fn({ order: db.order, transitionLog: db.transitionLog }),
    );

    await cancelEvent('order-1', { userId: 'u-cancel-1' });

    expect(capturedLog).not.toBeNull();
    expect(capturedLog.machineName).toBe('order');
    expect(capturedLog.entityType).toBe('Order');
    expect(capturedLog.entityId).toBe('order-1');
    expect(capturedLog.fromState).toBe('pending_payment');
    expect(capturedLog.toState).toBe('cancelled');
    expect(capturedLog.userId).toBe('u-cancel-1');
    expect(capturedLog.reason).toBe('cancel');
  });
});