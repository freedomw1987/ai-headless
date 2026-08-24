/**
 * US-204 Order API — GET 詳情 / DELETE 軟刪除
 */

import { NextResponse } from 'next/server';
import { getOrder, deleteOrder } from '@/extensions/order/workflow/order-workflow';
import { guardExtensionApi } from '@/lib/extensions/api-guard';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const guard = await guardExtensionApi('order');
  if (guard) return guard;
  const { id } = await params;
  try {
    const order = await getOrder(id);
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: 'Order not found', detail: String(err) },
      { status: 404 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await guardExtensionApi('order');
  if (guard) return guard;
  const { id } = await params;
  try {
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete order', detail: String(err) },
      { status: 500 },
    );
  }
}