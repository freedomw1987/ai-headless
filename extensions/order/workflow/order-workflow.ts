/**
 * US-204 Order Workflow
 *
 * 整合 StateMachine + Prisma 持久化
 *
 * 設計：
 * 1. StateMachine schema 寫在程式碼（不是 JSON 檔）— 為了型別安全
 * 2. transitionOrder() 讀 DB → 載入 StateMachine → 觸發 transition → 寫 DB
 * 3. payload 寫入 stateData（JSON 欄位）— 用於存 paidAt / shippedAt 等時間戳
 */

import { db } from '@/lib/db';
import {
  createStateMachine,
  type StateMachineSchema,
  type StateMachineInstance,
} from '@/lib/state-machine/state-machine';

// ==============================================
// StateMachine Schema（訂單生命週期）
// ==============================================

const orderStateMachineSchema: StateMachineSchema = {
  id: 'order',
  initial: 'draft',
  states: {
    draft: {
      on: {
        submit: 'pending_payment',
        cancel: 'cancelled',
      },
    },
    pending_payment: {
      on: {
        pay: 'paid',
        cancel: 'cancelled',
      },
    },
    paid: {
      on: {
        ship: 'shipped',
        refund: 'refunded',
      },
    },
    shipped: {
      on: {
        complete: 'completed',
        refund: 'refunded',
      },
    },
    completed: {},
    cancelled: {},
    refunded: {},
  },
};

// ==============================================
// Event 類型（從 schema 推導太複雜，這裡手寫）
// ==============================================

export type OrderEvent =
  | 'submit'
  | 'pay'
  | 'ship'
  | 'complete'
  | 'cancel'
  | 'refund';

// ==============================================
// 工廠：取得新的 StateMachine 實例
// ==============================================

export function getOrderStateMachine(): StateMachineInstance {
  return createStateMachine(orderStateMachineSchema);
}

// ==============================================
// 核心：transitionOrder
// ==============================================

export async function transitionOrder(
  orderId: string,
  event: OrderEvent,
  payload?: Record<string, unknown>,
) {
  // TD-516: 用 Prisma transaction + 重新查 status 避免並發 race condition
  // - Transaction 確保讀寫原子性
  // - 重新查 status 確認 status 仍是進入時的狀態
  // - 若已被其他 transaction 改, 拋 'Race condition' → catch 轉 409
  return await db.$transaction(async (tx) => {
    // 1. 讀 DB (在 transaction 內)
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
    });

    // 2. 建立 StateMachine + 載入現有狀態
    const machine = getOrderStateMachine();
    machine.setState(order.status);

    // 3. 觸發 transition（無效會拋 InvalidTransitionError）
    const newState = machine.transition({ event, payload });

    // 4. 持久化 (transaction 內,原子性)
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newState,
        // merge payload 到 stateData
        stateData: (payload
          ? { ...(order.stateData as Record<string, unknown>), ...payload }
          : order.stateData) as object,
      },
    });

    // 5. TD-517: 寫 TransitionLog (transaction 內,與 status update 原子性)
    // - 若 log 寫入失敗,transaction rollback → status 不會被 update
    // - 記錄: who (userId), what (fromState, toState, event), when (createdAt 自動)
    await tx.transitionLog.create({
      data: {
        machineName: 'orderStateMachine',
        entityType: 'Order',
        entityId: orderId,
        fromState: order.status,
        toState: newState,
        userId: (payload?.userId as string) ?? null,
        reason: event, // event 名稱 (submit / pay / ship / etc.)
      },
    });

    return updated;
  });
}

// ==============================================
// 輔助：查詢訂單
// ==============================================

export async function getOrder(orderId: string) {
  return db.order.findUniqueOrThrow({
    where: { id: orderId },
  });
}

export async function listOrders() {
  return db.order.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

// ==============================================
// 輔助：建立訂單（初始狀態 draft）
// ==============================================

export async function createOrder(data: {
  orderNumber: string;
  customer: string;
  amount: number;
}) {
  return db.order.create({
    data: {
      ...data,
      status: 'draft',
      stateData: {},
    },
  });
}

// ==============================================
// 輔助：刪除訂單
// ==============================================

export async function deleteOrder(orderId: string) {
  return db.order.delete({
    where: { id: orderId },
  });
}

// ==============================================
// 輔助：取得 StateMachine 結構（給前端顯示按鈕用）
// ==============================================

export function getOrderStateMachineSchema() {
  return orderStateMachineSchema;
}

// Sprint 30 commit 1: Order cancelEvent 加 TransitionLog (TD-新發現 D)
export async function cancelEvent(
  orderId: string,
  payload?: Record<string, unknown>,
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    const fromState = order.status;

    // Order lifecycle: draft/pending_payment/paid 可以 cancel
    // (參考 spec.workflows[0].transitions)
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    // 寫 TransitionLog (audit trail)
    await tx.transitionLog.create({
      data: {
        machineName: 'order',
        entityType: 'Order',
        entityId: orderId,
        fromState,
        toState: 'cancelled',
        userId: (payload?.userId as string) ?? null,
        reason: 'cancel',
      },
    });

    return updated;
  });
}