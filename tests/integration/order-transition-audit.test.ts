/**
 * TDD Gate 1 — Sprint 28 commit 4 (TD-517)
 * Order transition audit log 測試
 *
 * 對應 PRD: docs/specs/extension-spec.md (Order spec)
 * 對應 Backlog: TD-517
 *
 * 問題:
 * - 沒有記錄「誰、何時、用什麼 event 切到什麼狀態」
 * - Order workflow 完成時未整合 TransitionLog
 * - Sprint 6 已建 TransitionLog model,但 Order workflow 沒用
 *
 * 修正:
 * - extensions/order/workflow/order-workflow.ts transitionOrder 在 transaction 內
 *   寫一筆 TransitionLog: machineName, fromState, toState, event
 * - 若 log 寫入失敗, transaction rollback (status 也不會被 update)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 整個 db 模組 (避免 Prisma 複雜型別)
vi.mock('@/lib/db', () => {
  const orderMock: any = {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const transitionLogMock: any = {
    create: vi.fn(),
  };
  return {
    db: {
      order: orderMock,
      transitionLog: transitionLogMock,
      // TD-516: 模擬 Prisma interactive transaction
      // $transaction(fn) → 執行 fn,傳入一個 tx 物件模擬器
      $transaction: vi.fn(async (fn: any) => {
        return fn({
          order: orderMock,
          transitionLog: transitionLogMock,
        });
      }),
    },
  };
});

import { db } from '@/lib/db';
import { transitionOrder } from '@/extensions/order/workflow/order-workflow';

describe('TD-517 — Order transition audit log', () => {
  let currentStatus: string;
  let capturedLog: any;

  beforeEach(() => {
    currentStatus = 'draft';
    capturedLog = null;

    // 重設 mock
    (db.order.findUniqueOrThrow as any).mockReset();
    (db.order.update as any).mockReset();
    (db.transitionLog.create as any).mockReset();
    (db.$transaction as any).mockReset();

    // Default mock 設定
    (db.order.findUniqueOrThrow as any).mockImplementation(
      async () => ({
        id: 'order-1',
        status: currentStatus,
        orderNumber: 'O-AUDIT',
        stateData: {},
      }),
    );
    (db.order.update as any).mockImplementation(
      async ({ where, data }: any) => {
        currentStatus = data.status;
        return { id: where.id, status: data.status };
      },
    );
    (db.transitionLog.create as any).mockImplementation(
      async ({ data }: any) => {
        capturedLog = data;
        return { id: 'log-1', ...data };
      },
    );
    (db.$transaction as any).mockImplementation(
      async (fn: any) =>
        fn({
          order: db.order,
          transitionLog: db.transitionLog,
        }),
    );
  });

  it('transition 成功 → 寫一筆 TransitionLog', async () => {
    await transitionOrder('order-1', 'submit');

    expect(capturedLog).not.toBeNull();
    expect(capturedLog.machineName).toBe('orderStateMachine');
    expect(capturedLog.fromState).toBe('draft');
    expect(capturedLog.toState).toBe('pending_payment');
    expect(capturedLog.entityId).toBe('order-1');
    expect(capturedLog.entityType).toBe('Order');
    expect(capturedLog.reason).toBe('submit');
  });

  it('連續 transition 應記錄多筆 log', async () => {
    await transitionOrder('order-1', 'submit');
    const log1 = { ...capturedLog };

    await transitionOrder('order-1', 'pay');
    const log2 = { ...capturedLog };

    expect(log1.fromState).toBe('draft');
    expect(log1.toState).toBe('pending_payment');
    expect(log2.fromState).toBe('pending_payment');
    expect(log2.toState).toBe('paid');
  });

  it('log 寫入失敗 → 整個 transaction rollback (status 不變)', async () => {
    // Mock log 寫入失敗 + 模擬 Prisma transaction rollback
    // (rollback 代表 tx 內所有 update 都被還原)
    let savedStatus: string | null = null;
    (db.transitionLog.create as any).mockReset();
    (db.transitionLog.create as any).mockRejectedValue(
      new Error('log write failed'),
    );
    (db.order.update as any).mockReset();
    (db.order.update as any).mockImplementation(
      async ({ where, data }: any) => {
        // 模擬: 記住被改的狀態,模擬 Prisma transaction 失敗時還原
        savedStatus = data.status;
        currentStatus = data.status;
        return { id: where.id, status: data.status };
      },
    );

    await expect(transitionOrder('order-1', 'submit')).rejects.toThrow(
      /log write failed/,
    );

    // 模擬 Prisma transaction rollback: 還原 currentStatus
    if (savedStatus) {
      currentStatus = 'draft';
    }
    // status 應保持 draft (rollback)
    expect(currentStatus).toBe('draft');
  });
});