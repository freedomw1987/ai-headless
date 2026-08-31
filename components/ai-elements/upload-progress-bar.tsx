/**
 * UploadProgressBar — Sprint 47 Commit 4 (Stage 47-3)
 *
 * 顯示附件上傳進度的進度條元件。
 * 對應 PRD §2.4 FR-4.5: shadcn-style 進度條 + 「上傳中 45%」文字 + done/error 狀態
 *
 * Props:
 * - progress: 0-100 進度（自動 clamp 0-100）
 * - status: 'uploading' | 'done' | 'error'
 * - errorMessage?: error 狀態時顯示的訊息
 *
 * A11y:
 * - role="progressbar"
 * - aria-valuenow / aria-valuemin / aria-valuemax
 */

import { useMemo } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadProgressBarStatus = 'uploading' | 'done' | 'error';

export type UploadProgressBarProps = {
  progress: number;
  status: UploadProgressBarStatus;
  errorMessage?: string;
  className?: string;
};

export const UploadProgressBar = ({
  progress,
  status,
  errorMessage,
  className,
}: UploadProgressBarProps) => {
  // 自動 clamp 到 0-100
  const clamped = useMemo(() => {
    if (Number.isNaN(progress)) return 0;
    if (progress < 0) return 0;
    if (progress > 100) return 100;
    return Math.round(progress);
  }, [progress]);

  const StatusIcon =
    status === 'done' ? CheckCircle2 : status === 'error' ? AlertCircle : Loader2;

  const statusLabel =
    status === 'done'
      ? '上傳完成'
      : status === 'error'
      ? (errorMessage ?? '上傳失敗')
      : `上傳中 ${clamped}%`;

  const iconColor =
    status === 'done'
      ? 'text-green-600'
      : status === 'error'
      ? 'text-destructive'
      : 'text-muted-foreground';

  return (
    <div
      className={cn('flex w-full flex-col gap-1.5 text-xs', className)}
      data-testid="upload-progress-bar"
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <StatusIcon
          className={cn(
            'size-3',
            iconColor,
            status === 'uploading' && 'animate-spin',
          )}
        />
        <span>{statusLabel}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="附件上傳進度"
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            'h-full transition-[width] duration-150',
            status === 'error'
              ? 'bg-destructive'
              : status === 'done'
              ? 'bg-green-600'
              : 'bg-primary',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};