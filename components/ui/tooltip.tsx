'use client';

// Sprint 20 Stage 2 — Tooltip 元件
//
// shadcn 標準實作：
// - 基於 @radix-ui/react-tooltip（內建鍵盤 a11y：focus/hover 顯示、Esc 關閉、aria-describedby）
// - TooltipProvider 在使用端包裹（避免每個 Tooltip 重複建立 provider）
// - TooltipContent 預設 fade-in + zoom-in 動畫 + z-50
//
// 用法：
// ```tsx
// <TooltipProvider>
//   <Tooltip>
//     <TooltipTrigger asChild><Button>...</Button></TooltipTrigger>
//     <TooltipContent><p>提示文字</p></TooltipContent>
//   </Tooltip>
// </TooltipProvider>
// ```

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipPortal = TooltipPrimitive.Portal;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipPortal,
};