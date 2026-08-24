/**
 * Todo Priority Badge
 */

import { cn } from '@/lib/utils';

const CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  low: { label: '低', bg: 'bg-gray-100', color: 'text-gray-700' },
  medium: { label: '中', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  high: { label: '高', bg: 'bg-red-100', color: 'text-red-700' },
};

const DEFAULT = { label: '中', bg: 'bg-yellow-100', color: 'text-yellow-700' };

export function TodoPriorityBadge({ priority }: { priority: string }) {
  const c = CONFIG[priority] ?? DEFAULT;
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.color)}>
      {c.label}
    </span>
  );
}