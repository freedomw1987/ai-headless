/**
 * Order Transition Buttons — 狀態切換按鈕群
 *
 * 根據當前狀態顯示可用的 event 按鈕
 * 按下後呼叫 POST /api/order/{id}/transition
 */

'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { OrderEvent } from '@/extensions/order/workflow/order-workflow';

const EVENT_LABELS: Record<OrderEvent, string> = {
  submit: '提交',
  pay: '付款',
  ship: '出貨',
  complete: '完成',
  cancel: '取消',
  refund: '退款',
};

const EVENT_VARIANTS: Record<OrderEvent, 'default' | 'destructive' | 'outline'> = {
  submit: 'default',
  pay: 'default',
  ship: 'default',
  complete: 'default',
  cancel: 'destructive',
  refund: 'destructive',
};

export function OrderTransitionButtons({
  orderId,
  availableEvents,
}: {
  orderId: string;
  availableEvents: OrderEvent[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (availableEvents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        此訂單已到達終態，無可執行的操作
      </div>
    );
  }

  async function handleTransition(event: OrderEvent) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/order/${orderId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            payload: { timestamp: new Date().toISOString() },
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(
            errData.message ?? errData.error ?? '狀態切換失敗',
          );
        }

        router.refresh();
      } catch (err) {
        setError(String(err instanceof Error ? err.message : err));
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availableEvents.map((event) => (
          <Button
            key={event}
            variant={EVENT_VARIANTS[event]}
            onClick={() => handleTransition(event)}
            disabled={isPending}
          >
            {isPending ? '處理中...' : EVENT_LABELS[event]}
          </Button>
        ))}
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}