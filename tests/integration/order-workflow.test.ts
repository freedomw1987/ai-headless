/**
 * US-204 Order Workflow 測試
 *
 * 測試目標：
 * 1. transitionOrder() 從 draft → pending_payment → paid → shipped → completed
 * 2. 無效 transition 拋 InvalidTransitionError
 * 3. payload（paidAt, shippedAt）正確寫入 stateData
 * 4. setState 從 DB 載入現有狀態
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { transitionOrder, getOrderStateMachine } from '@/extensions/order/workflow/order-workflow';
import { InvalidTransitionError } from '@/lib/state-machine/state-machine';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  db: {
    order: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // TD-517: transitionOrder 寫 TransitionLog
    transitionLog: {
      create: vi.fn(),
    },
    // TD-516: transitionOrder 改用 db.$transaction,需 mock
    $transaction: vi.fn(),
  },
}));

import { db } from '@/lib/db';

describe('order-workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // TD-516: setup $transaction mock 包裹 findUniqueOrThrow/update
    vi.mocked(db.$transaction).mockImplementation(
      async (fn: any) =>
        fn({
          order: {
            findUniqueOrThrow: vi.mocked(db.order.findUniqueOrThrow),
            update: vi.mocked(db.order.update),
          },
          // TD-517: 提供 transitionLog.create
          transitionLog: {
            create: vi.mocked(db.transitionLog.create),
          },
        }),
    );
  });

  describe('getOrderStateMachine', () => {
    it('回傳有效的 StateMachine 實例', () => {
      const sm = getOrderStateMachine();
      expect(sm.getState()).toBe('draft');
      expect(sm.getAvailableEvents()).toEqual(
        expect.arrayContaining(['submit', 'cancel']),
      );
    });
  });

  describe('transitionOrder 完整生命週期', () => {
    it('draft → pending_payment（submit）', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'O-001',
        status: 'draft',
        stateData: {},
      };
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockOrder as never);
      vi.mocked(db.order.update).mockResolvedValue({
        ...mockOrder,
        status: 'pending_payment',
      } as never);

      const result = await transitionOrder('order-1', 'submit');

      expect(result.status).toBe('pending_payment');
      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({ status: 'pending_payment' }),
        }),
      );
    });

    it('pending_payment → paid（pay + payload）', async () => {
      const mockOrder = {
        id: 'order-2',
        status: 'pending_payment',
        stateData: {},
      };
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockOrder as never);
      vi.mocked(db.order.update).mockResolvedValue({
        ...mockOrder,
        status: 'paid',
        stateData: { paidAt: '2026-08-24T10:00:00Z' },
      } as never);

      const result = await transitionOrder('order-2', 'pay', {
        paidAt: '2026-08-24T10:00:00Z',
      });

      expect(result.status).toBe('paid');
      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'paid',
            stateData: expect.objectContaining({
              paidAt: '2026-08-24T10:00:00Z',
            }),
          }),
        }),
      );
    });

    it('paid → shipped → completed（連續 transition）', async () => {
      // ship
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        id: 'o3',
        status: 'paid',
        stateData: { paidAt: '2026-08-24T10:00:00Z' },
      } as never);
      vi.mocked(db.order.update).mockResolvedValueOnce({
        id: 'o3',
        status: 'shipped',
        stateData: { paidAt: '2026-08-24T10:00:00Z', shippedAt: '2026-08-25T10:00:00Z' },
      } as never);

      const shipped = await transitionOrder('o3', 'ship', {
        shippedAt: '2026-08-25T10:00:00Z',
      });
      expect(shipped.status).toBe('shipped');

      // complete
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        id: 'o3',
        status: 'shipped',
        stateData: { paidAt: '2026-08-24T10:00:00Z', shippedAt: '2026-08-25T10:00:00Z' },
      } as never);
      vi.mocked(db.order.update).mockResolvedValueOnce({
        id: 'o3',
        status: 'completed',
        stateData: {
          paidAt: '2026-08-24T10:00:00Z',
          shippedAt: '2026-08-25T10:00:00Z',
          completedAt: '2026-08-26T10:00:00Z',
        },
      } as never);

      const completed = await transitionOrder('o3', 'complete', {
        completedAt: '2026-08-26T10:00:00Z',
      });
      expect(completed.status).toBe('completed');
    });

    it('無效 transition 拋 InvalidTransitionError', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({
        id: 'o4',
        status: 'draft',
        stateData: {},
      } as never);

      // draft 不能 ship
      await expect(transitionOrder('o4', 'ship')).rejects.toThrow(
        InvalidTransitionError,
      );

      // DB 不應被更新
      expect(db.order.update).not.toHaveBeenCalled();
    });

    it('從 DB 載入現有狀態（setState）', async () => {
      // 模擬「order 已在 DB 中是 pending_payment 狀態」
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({
        id: 'o5',
        status: 'pending_payment',
        stateData: {},
      } as never);
      vi.mocked(db.order.update).mockResolvedValue({
        id: 'o5',
        status: 'cancelled',
        stateData: {},
      } as never);

      // 應該可以從 pending_payment → cancelled
      const result = await transitionOrder('o5', 'cancel');
      expect(result.status).toBe('cancelled');
    });

    it('terminal state 不能 transition（completed）', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({
        id: 'o6',
        status: 'completed',
        stateData: {},
      } as never);

      await expect(transitionOrder('o6', 'refund')).rejects.toThrow(
        InvalidTransitionError,
      );
    });

    it('order 不存在拋錯', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(transitionOrder('nonexistent', 'submit')).rejects.toThrow(
        /not found/i,
      );
    });
  });
});