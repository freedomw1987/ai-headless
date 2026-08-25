import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * shadcn-style Empty 元件（簡化版）
 *
 * 用法：
 * <Empty>
 *   <EmptyHeader>
 *     <EmptyMedia variant="icon"><FileText /></EmptyMedia>
 *     <EmptyTitle>尚無資料</EmptyTitle>
 *     <EmptyDescription>點擊右上角「新增」建立第一筆資料</EmptyDescription>
 *   </EmptyHeader>
 *   <EmptyContent>
 *     <Button>新增</Button>
 *   </EmptyContent>
 * </Empty>
 */

function Empty({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-8 text-center",
        className,
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-3", className)}
      {...props}
    />
  )
}

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "icon" }) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground",
        variant === "icon" && "bg-primary/10 text-primary",
        className,
      )}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="empty-title"
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function EmptyDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex items-center justify-center gap-2", className)}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
}