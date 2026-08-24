/**
 * US-204 Order Transition API
 *
 * POST /api/order/{id}/transition
 * Body: { event: "submit" | "pay" | "ship" | ... , payload?: {...} }
 *
 * 核心：
 * - 從 DB 讀 order
 * - 載入 StateMachine + setState(現有狀態)
 * - 觸發 transition
 * - 持久化
 *
 * 錯誤處理：
 * - 400 InvalidTransitionError（無效 transition）
 * - 404 order 不存在
 */

import { NextResponse } from 'next/server';
import { transitionOrder } from '@/extensions/order/workflow/order-workflow';
import { InvalidTransitionError } from '@/lib/state-machine/state-machine';
import type { OrderEvent } from '@/extensions/order/workflow/order-workflow';

type Params = { params: Promise<{ id: string }> };

const VALID_EVENTS: OrderEvent[] = [
  'submit',
  'pay',
  'ship',
  'complete',
  'cancel',
  'refund',
];

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { event, payload } = body;

    // 驗證 event
    if (!event || !VALID_EVENTS.includes(event)) {
      return NextResponse.json(
        {
          error: 'Invalid event',
          validEvents: VALID_EVENTS,
          received: event,
        },
        { status: 400 },
      );
    }

    const order = await transitionOrder(id, event as OrderEvent, payload);

    return NextResponse.json({
      order,
      transition: { event, payload: payload ?? null },
    });
  } catch (err) {
    // InvalidTransitionError → 400（client-side 邏輯錯誤）
    if (err instanceof InvalidTransitionError) {
      return NextResponse.json(
        {
          error: 'InvalidTransitionError',
          machineId: err.machineId,
          currentState: err.currentState,
          event: err.event,
          message: err.message,
        },
        { status: 400 },
      );
    }

    // Record not found → 404
    if (String(err).includes('not found') || String(err).includes('No Order found')) {
      return NextResponse.json(
        { error: 'Order not found', orderId: id },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to transition order', detail: String(err) },
      { status: 500 },
    );
  }
}