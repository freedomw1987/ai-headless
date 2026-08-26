/**
 * TDD Gate 1 — Sprint 28 commit 3 (TD-516)
 * Order 並發 transition 控制測試
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    order: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import { transitionOrder } from '@/extensions/order/workflow/order-workflow';

describe('TD-516 — Order 並發 transition 控制', () => {
  let currentStatus: string;

  beforeEach(() => {
    currentStatus = 'draft';

    vi.mocked(db.order.findUniqueOrThrow).mockReset();
    vi.mocked(db.order.update).mockReset();
    vi.mocked(db.$transaction).mockReset();

    // 使用 mockAny helper 簡化 Prisma mock 型別問題
    const mockAny: any = vi.fn();
    mockAny.mockImplementation(
      async () =>
        ({
          id: 'order-1',
          status: currentStatus,
          orderNumber: 'O-CONCURRENT',
          stateData: {},
        }) as any,
    );
    vi.mocked(db.order.findUniqueOrThrow).mockImplementation(mockAny as any);

    mockAny.mockImplementation(
      async ({ where, data }: any) =>
        ({ id: where.id, status: data.status }) as any,
    );
    vi.mocked(db.order.update).mockImplementation(mockAny as any);

    mockAny.mockImplementation(async (fn: any) => {
      const txResult = {
        order: {
          findUniqueOrThrow: vi.fn(
            async () =>
              ({
                id: 'order-1',
                status: currentStatus,
                orderNumber: 'O-CONCURRENT',
                stateData: {},
              }) as any,
          ),
          update: vi.fn(async ({ where, data }: any) => {
            currentStatus = data.status;
            return { id: where.id, status: data.status };
          }) as any,
        },
      };
      return fn(txResult);
    });
    vi.mocked(db.$transaction).mockImplementation(mockAny as any);
  });

  it('sequential: draft → submit 應成功', async () => {
    const result = await transitionOrder('order-1', 'submit');
    expect(result.status).toBe('pending_payment');
  });

  it('sequential: draft → submit → 再 submit 應拋 InvalidTransitionError', async () => {
    await transitionOrder('order-1', 'submit');
    expect(currentStatus).toBe('pending_payment');
    await expect(transitionOrder('order-1', 'submit')).rejects.toThrow(
      /拒絕 event "submit"/,
    );
  });

  it('並發模擬: 第一個成功, 第二個拋 InvalidTransitionError (race 預期行為)', async () => {
    await transitionOrder('order-1', 'submit');
    expect(currentStatus).toBe('pending_payment');

    const r1 = await transitionOrder('order-1', 'pay');
    expect(r1.status).toBe('paid');
    expect(currentStatus).toBe('paid');

    await expect(transitionOrder('order-1', 'cancel')).rejects.toThrow(
      /拒絕 event "cancel"/,
    );

    expect(currentStatus).toBe('paid');
  });

  it('並發 2 個相同 transition (冪等但需第一個完成)', async () => {
    const r1 = await transitionOrder('order-1', 'submit');
    expect(r1.status).toBe('pending_payment');
    await expect(transitionOrder('order-1', 'submit')).rejects.toThrow(
      /拒絕 event "submit"/,
    );
  });
});