/**
 * Order Status Badge — 訂單狀態徽章
 *
 * 用顏色 + 中文顯示當前訂單狀態
 */

import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'text-gray-700', bg: 'bg-gray-100' },
  pending_payment: { label: '待付款', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  paid: { label: '已付款', color: 'text-blue-700', bg: 'bg-blue-100' },
  shipped: { label: '已出貨', color: 'text-purple-700', bg: 'bg-purple-100' },
  completed: { label: '已完成', color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { label: '已取消', color: 'text-red-700', bg: 'bg-red-100' },
  refunded: { label: '已退款', color: 'text-orange-700', bg: 'bg-orange-100' },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.color,
      )}
    >
      {config.label}
    </span>
  );
}