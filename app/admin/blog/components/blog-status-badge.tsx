/**
 * Blog Status Badge
 */

import { cn } from '@/lib/utils';

const CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: '草稿', bg: 'bg-gray-100', color: 'text-gray-700' },
  pending: { label: '待審', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  published: { label: '已發布', bg: 'bg-green-100', color: 'text-green-700' },
  archived: { label: '已封存', bg: 'bg-red-100', color: 'text-red-700' },
};

const DEFAULT = { label: '草稿', bg: 'bg-gray-100', color: 'text-gray-700' };

export function BlogStatusBadge({ status }: { status: string }) {
  const c = CONFIG[status] ?? DEFAULT;
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.color)}>
      {c.label}
    </span>
  );
}