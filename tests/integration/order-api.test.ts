/**
 * US-204 Order API + Workflow 整合測試
 *
 * 涵蓋：
 * 1. workflow 完整生命週期
 * 2. 並發 / 邊界 case
 * 3. payload 正確寫入 stateData
 * 4. terminal state 行為
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  transitionOrder,
  getOrderStateMachine,
  createOrder,
  listOrders,
  getOrder,
  deleteOrder,
} from '@/extensions/order/workflow/order-workflow';
import { InvalidTransitionError } from '@/lib/state-machine/state-machine';

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
  },
}));

import { db } from '@/lib/db';

describe('order-workflow - 核心 API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrderStateMachine', () => {
    it('回傳 StateMachine 實例，初始 draft', () => {
      const sm = getOrderStateMachine();
      expect(sm.getState()).toBe('draft');
    });

    it('draft 可用 events 包含 submit + cancel', () => {
      const sm = getOrderStateMachine();
      const events = sm.getAvailableEvents();
      expect(events).toContain('submit');
      expect(events).toContain('cancel');
    });
  });

  describe('createOrder', () => {
    it('建立 draft 訂單', async () => {
      vi.mocked(db.order.create).mockResolvedValue({
        id: 'o-new',
        orderNumber: 'O-NEW',
        customer: 'Bob',
        amount: 10000,
        status: 'draft',
        stateData: {},
      } as never);

      const order = await createOrder({
        orderNumber: 'O-NEW',
        customer: 'Bob',
        amount: 10000,
      });

      expect(order.status).toBe('draft');
      expect(db.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'draft',
          stateData: {},
        }),
      });
    });
  });

  describe('listOrders', () => {
    it('按 createdAt desc 排序', async () => {
      vi.mocked(db.order.findMany).mockResolvedValue([] as never);

      await listOrders();

      expect(db.order.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('transitionOrder 完整生命週期', () => {
    it('draft → pending_payment', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({
        id: 'o1',
        status: 'draft',
        stateData: {},
      } as never);
      vi.mocked(db.order.update).mockResolvedValue({
        id: 'o1',
        status: 'pending_payment',
        stateData: {},
      } as never);

      const result = await transitionOrder('o1', 'submit');
      expect(result.status).toBe('pending_payment');
    });

    it('pending_payment → paid 含 payload', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({
        id: 'o2',
        status: 'pending_payment',
        stateData: {},
      } as never);
      vi.mocked(db.order.update).mockResolvedValue({
        id: 'o2',
        status: 'paid',
        stateData: { paidAt: '2026-08-24T10:00:00Z' },
      } as never);

      const result = await transitionOrder('o2', 'pay', {
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

    it('paid → shipped → completed 連續 transition', async () => {
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

    it('從 DB 載入現有狀態（setState 真實場景）', async () => {
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

      const result = await transitionOrder('o5', 'cancel');
      expect(result.status).toBe('cancelled');
    });
  });

  describe('transitionOrder 錯誤處理', () => {
    it('無效 transition 拋 InvalidTransitionError，DB 不寫', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({
        id: 'o4',
        status: 'draft',
        stateData: {},
      } as never);

      // draft 不能 ship
      await expect(transitionOrder('o4', 'ship')).rejects.toThrow(
        InvalidTransitionError,
      );
      expect(db.order.update).not.toHaveBeenCalled();
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

    it('order 不存在拋 not found 錯誤', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockRejectedValue(
        new Error('No Order found'),
      );

      await expect(transitionOrder('nonexistent', 'submit')).rejects.toThrow(
        /No Order found/,
      );
    });
  });

  describe('getOrder / deleteOrder', () => {
    it('getOrder 回傳單筆', async () => {
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({
        id: 'o7',
        status: 'paid',
      } as never);

      const result = await getOrder('o7');
      expect(result.id).toBe('o7');
    });

    it('deleteOrder 呼叫 db.order.delete', async () => {
      vi.mocked(db.order.delete).mockResolvedValue({} as never);

      await deleteOrder('o8');
      expect(db.order.delete).toHaveBeenCalledWith({ where: { id: 'o8' } });
    });
  });
});