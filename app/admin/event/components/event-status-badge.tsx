/**
 * Event Status Badge
 */

import { cn } from '@/lib/utils';

const CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  upcoming: { label: '即將開始', bg: 'bg-blue-100', color: 'text-blue-700' },
  ongoing: { label: '進行中', bg: 'bg-green-100', color: 'text-green-700' },
  past: { label: '已結束', bg: 'bg-gray-100', color: 'text-gray-700' },
  cancelled: { label: '已取消', bg: 'bg-red-100', color: 'text-red-700' },
};

const DEFAULT = { label: '即將開始', bg: 'bg-blue-100', color: 'text-blue-700' };

export function EventStatusBadge({ status }: { status: string }) {
  const c = CONFIG[status] ?? DEFAULT;
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.color)}>
      {c.label}
    </span>
  );
}