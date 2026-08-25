// Sprint 18 Stage 2 — Skeleton 元件（shadcn 標準）
//
// 純 UI 元件，loading state 用灰色動畫方塊。
// 用法：
//   <Skeleton className="h-12 w-48" />  // 標題
//   <Skeleton className="h-4 w-full" />  // 段落

import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };