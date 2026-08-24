/**
 * US-204 Order API — GET 列表 / POST 建立
 *
 * 設計：
 * - GET: list orders（簡單 Prisma findMany）
 * - POST: 建立新 order（status 預設 draft）
 */

import { NextResponse } from 'next/server';
import { createOrder, listOrders } from '@/extensions/order/workflow/order-workflow';

export async function GET() {
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to list orders', detail: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, customer, amount } = body;

    if (!orderNumber || !customer || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: orderNumber, customer, amount' },
        { status: 400 },
      );
    }

    const order = await createOrder({ orderNumber, customer, amount });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create order', detail: String(err) },
      { status: 500 },
    );
  }
}