// Order Extension 使用範例
//
// 展示訂單完整生命週期（US-204 — Order StateMachine Library）
// 這是 Sprint 9 最複雜的 extension demo：
// - 7 個狀態 + 8 個 transition（含 cancel 從多個狀態）
// - payload 寫入 stateData（如 paidAt, shippedAt 時間戳）
// - 錯誤處理（無效 transition 會拋 InvalidTransitionError）
//
// State Machine: draft → pending_payment → paid → shipped → completed
//                      ↓              ↓     ↓        ↓
//                  cancelled     cancelled refunded refunded

import {
  createOrder,
  transitionOrder,
  getOrder,
  type OrderEvent,
} from '../workflow/order-workflow';
import { InvalidTransitionError } from '@/lib/state-machine/state-machine';

export async function exampleHappyPath() {
  // 1. 建立訂單（draft）
  const order = await createOrder({
    orderNumber: 'ORD-001',
    customer: '王小明',
    amount: 129900, // cents
  });

  // 2. 提交付款（draft → pending_payment）
  const submitted = await transitionOrder(order.id, 'submit');

  // 3. 付款（pending_payment → paid，附 timestamp）
  const paid = await transitionOrder(submitted.id, 'pay', {
    paidAt: new Date().toISOString(),
  });

  // 4. 出貨（paid → shipped）
  const shipped = await transitionOrder(paid.id, 'ship', {
    shippedAt: new Date().toISOString(),
    trackingNumber: 'TRACK-12345',
  });

  // 5. 完成（shipped → completed）
  const completed = await transitionOrder(shipped.id, 'complete');

  // stateData 已累積所有 payload
  console.log(completed.stateData);
  // { paidAt: '...', shippedAt: '...', trackingNumber: 'TRACK-12345' }

  return completed;
}

export async function exampleCancelFromDraft() {
  // 草稿可取消（draft → cancelled）
  const order = await createOrder({
    orderNumber: 'ORD-002',
    customer: '李大嬸',
    amount: 50000,
  });

  return await transitionOrder(order.id, 'cancel');
}

export async function exampleRefund() {
  // 已付款可退款（paid → refunded）
  const order = await createOrder({
    orderNumber: 'ORD-003',
    customer: '張先生',
    amount: 88800,
  });

  const submitted = await transitionOrder(order.id, 'submit');
  const paid = await transitionOrder(submitted.id, 'pay');
  const refunded = await transitionOrder(paid.id, 'refund', {
    refundReason: '客戶要求退款',
    refundedAt: new Date().toISOString(),
  });

  return refunded;
}

export async function exampleInvalidTransition(orderId: string) {
  try {
    // 試圖從 draft 直接 ship（無效）
    await transitionOrder(orderId, 'ship');
    throw new Error('Should not reach here');
  } catch (e) {
    if (e instanceof InvalidTransitionError) {
      console.log(`無效轉換：${e.currentState} → ${e.event}`);
      // 處理：提示用戶要先付款
      return { success: false, reason: e.message };
    }
    throw e;
  }
}

export async function exampleQueryByStatus() {
  const orders = await import('../workflow/order-workflow').then((m) => m.listOrders());
  return {
    drafts: orders.filter((o) => o.status === 'draft'),
    pending: orders.filter((o) => o.status === 'pending_payment'),
    paid: orders.filter((o) => o.status === 'paid'),
    shipped: orders.filter((o) => o.status === 'shipped'),
    completed: orders.filter((o) => o.status === 'completed'),
  };
}

export function exampleGetAvailableEvents(currentStatus: string): OrderEvent[] {
  switch (currentStatus) {
    case 'draft':
      return ['submit', 'cancel'];
    case 'pending_payment':
      return ['pay', 'cancel'];
    case 'paid':
      return ['ship', 'refund'];
    case 'shipped':
      return ['complete', 'refund'];
    case 'completed':
    case 'cancelled':
    case 'refunded':
      return [];
    default:
      return [];
  }
}