/**
 * TDD Gate 1 — Sprint 29 commit 2
 * Order transitionOrder 確認 userId 注入生效
 *
 * 對應 PRD: docs/specs/extension-spec.md
 * 對應 Backlog: TD-新發現 B + Sprint 28 TD-517
 *
 * 目的:
 * - 確認 Sprint 29 commit 1 注入 userId 後
 * - Order 的 transitionLog 確實收到 userId (非 null)
 * - audit log 可追溯是誰做的 transition
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const orderMock: any = {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  };
  const transitionLogMock: any = {
    create: vi.fn(),
  };
  return {
    db: {
      order: orderMock,
      transitionLog: transitionLogMock,
      $transaction: vi.fn(async (fn: any) =>
        fn({ order: orderMock, transitionLog: transitionLogMock }),
      ),
    },
  };
});

import { db } from '@/lib/db';
import { transitionOrder } from '@/extensions/order/workflow/order-workflow';

describe('Sprint 29 commit 2 — Order transitionOrder userId 注入生效', () => {
  let currentStatus: string;
  let capturedLog: any;

  beforeEach(() => {
    currentStatus = 'draft';
    capturedLog = null;

    (db.order as any).findUniqueOrThrow.mockReset();
    (db.order as any).update.mockReset();
    (db.transitionLog as any).create.mockReset();
    (db.$transaction as any).mockReset();

    (db.order as any).findUniqueOrThrow.mockImplementation(
      async () =>
        ({
          id: 'order-1',
          status: currentStatus,
          orderNumber: 'O-001',
          stateData: {},
        }) as any,
    );
    (db.order as any).update.mockImplementation(
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
      fn({ order: db.order, transitionLog: db.transitionLog }),
    );
  });

  it('caller 傳 userId → log 記錄該 userId', async () => {
    await transitionOrder('order-1', 'submit', { userId: 'u-admin-1' });
    expect(capturedLog.userId).toBe('u-admin-1');
  });

  it('caller 不傳 userId → log 記錄 null (Sprint 29 注入前的行為)', async () => {
    await transitionOrder('order-1', 'submit');
    // Sprint 28 commit 1: userId 從 payload 取,沒傳則 null
    expect(capturedLog.userId).toBeNull();
  });

  it('audit log 必含 userId 欄位 (供合規/除錯)', async () => {
    await transitionOrder('order-1', 'submit', { userId: 'u-trace' });
    expect(capturedLog).toHaveProperty('userId');
    expect(capturedLog).toHaveProperty('fromState');
    expect(capturedLog).toHaveProperty('toState');
    expect(capturedLog).toHaveProperty('reason'); // event 名稱
  });
});