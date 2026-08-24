/**
 * Order Detail Page — 訂單詳情
 *
 * Server Component：讀 DB + 計算可用的 events → 傳給 client 渲染
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder, getOrderStateMachine } from '@/extensions/order/workflow/order-workflow';
import type { OrderEvent } from '@/extensions/order/workflow/order-workflow';
import { OrderStatusBadge } from '../components/order-status-badge';
import { OrderTransitionButtons } from '../components/order-transition-buttons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Params = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Params) {
  const { id } = await params;

  let order;
  try {
    order = await getOrder(id);
  } catch {
    notFound();
  }

  // 計算當前狀態可用的 events
  const sm = getOrderStateMachine();
  sm.setState(order.status);
  const availableEvents = sm.getAvailableEvents() as OrderEvent[];

  const stateData = (order.stateData as Record<string, unknown>) ?? {};

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 返回訂單列表
          </Link>
          <h1 className="text-3xl font-bold mt-2">
            訂單 {order.orderNumber}
          </h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 訂單資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>訂單資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">訂單 ID：</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">客戶：</span>
              <span>{order.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">金額：</span>
              <span className="font-mono">
                ${(order.amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">建立時間：</span>
              <span>{new Date(order.createdAt).toLocaleString('zh-TW')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">更新時間：</span>
              <span>{new Date(order.updatedAt).toLocaleString('zh-TW')}</span>
            </div>
          </CardContent>
        </Card>

        {/* 狀態機資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>狀態機</CardTitle>
            <CardDescription>當前狀態 + 可執行的操作</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">當前狀態</div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">
                可執行的操作（{availableEvents.length}）
              </div>
              <OrderTransitionButtons
                orderId={order.id}
                availableEvents={availableEvents}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* StateData */}
      <Card>
        <CardHeader>
          <CardTitle>狀態資料（stateData）</CardTitle>
          <CardDescription>
            包含每次 transition 帶入的 payload（如 paidAt、shippedAt）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(stateData).length === 0 ? (
            <div className="text-sm text-muted-foreground">
              目前無 stateData，切換狀態後會自動寫入
            </div>
          ) : (
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(stateData, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* 返回按鈕（手機）*/}
      <div className="md:hidden">
        <Link href="/admin/orders">
          <Button variant="outline" className="w-full">
            返回列表
          </Button>
        </Link>
      </div>
    </div>
  );
}