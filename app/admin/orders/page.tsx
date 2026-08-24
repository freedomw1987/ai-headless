/**
 * Order List Page — 訂單列表
 *
 * Server Component：讀 DB → 傳給 client 渲染
 */

import Link from 'next/link';
import { listOrders } from '@/extensions/order/workflow/order-workflow';
import { CreateOrderDialog } from './components/create-order-dialog';
import { OrderStatusBadge } from './components/order-status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function OrdersPage() {
  const orders = await listOrders();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">訂單管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            US-204 訂單狀態機範例 — 視覺驗證 StateMachine 真實應用
          </p>
        </div>
        <CreateOrderDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>訂單列表（{orders.length} 筆）</CardTitle>
          <CardDescription>
            點擊任一訂單查看詳情 + 切換狀態
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              尚無訂單，點擊右上「建立訂單」開始
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">訂單編號</th>
                    <th className="text-left py-2 px-2">客戶</th>
                    <th className="text-right py-2 px-2">金額</th>
                    <th className="text-left py-2 px-2">狀態</th>
                    <th className="text-left py-2 px-2">建立時間</th>
                    <th className="text-right py-2 px-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-mono">
                        {order.orderNumber}
                      </td>
                      <td className="py-2 px-2">{order.customer}</td>
                      <td className="py-2 px-2 text-right">
                        ${(order.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-2 px-2">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-2 px-2 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('zh-TW')}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            詳情
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}