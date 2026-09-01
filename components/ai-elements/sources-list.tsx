/**
 * SourcesList v2 — Sprint 50 Commit 1 (Stage 50-0)
 *
 * 顯示本次對話附件的可折疊清單 (升級版)。
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.12 (FR-17.1 ~ FR-17.3)
 *
 * v1 (Sprint 47-1): 附件引用折疊區 (無下載)
 * v2 (Sprint 50-0): + 檔案類型 icon (FR-17.1) + MIME 標籤 (FR-17.2) + 下載按鈕 (FR-17.3)
 *
 * Props:
 * - attachments?: 附件列表 (空/undefined 時不渲染)
 *
 * A11y:
 * - role="button" + aria-expanded
 * - 鍵盤可達 (Enter 切換)
 * - 下載按鈕有 aria-label
 */

import { useState, type KeyboardEvent } from 'react';
import {
  ChevronRightIcon,
  DownloadIcon,
  FileIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAttachmentIcon,
  getMimeLabel,
} from '@/lib/ai/chat/attachment-icon';

export type SourcesListAttachment = {
  id: string;
  filename: string;
  /**
   * Sprint 50 (FR-17.1 ~ 17.2): 加 mimeType 讓 icon + 標籤正確區分
   * 向後相容: 若無 mimeType 則 fallback 到 FileIcon
   */
  mimeType?: string;
  size?: number;
};

export type SourcesListProps = {
  attachments?: SourcesListAttachment[];
  className?: string;
};

/**
 * Humanize bytes → "512 B" / "2.0 KB" / "5.0 MB"
 */
function humanizeBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export const SourcesList = ({
  attachments,
  className,
}: SourcesListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!attachments || attachments.length === 0) return null;

  const toggle = () => setIsExpanded((prev) => !prev);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  const count = attachments.length;

  return (
    <div
      className={cn(
        'rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 text-xs',
        className,
      )}
    >
      <button
        type="button"
        role="button"
        aria-expanded={isExpanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-muted-foreground hover:bg-muted/50"
      >
        <ChevronRightIcon
          className={cn(
            'size-3 transition-transform',
            isExpanded && 'rotate-90',
          )}
        />
        <FileIcon className="size-3" />
        <span>{count} 個附件</span>
      </button>
      {isExpanded && (
        <ul
          role="list"
          aria-label="附件清單"
          className="border-t border-dashed border-muted-foreground/30 px-3 py-2 space-y-1"
        >
          {attachments.map((att) => {
            // FR-17.1: 檔案類型 icon (向後相容: 無 mimeType 用 FileIcon)
            const FileTypeIcon = getAttachmentIcon(att.mimeType ?? '');
            // FR-17.2: MIME 友好標籤 (向後相容: 無 mimeType 不顯示)
            const mimeLabel = att.mimeType ? getMimeLabel(att.mimeType) : null;
            return (
              <li
                key={att.id}
                className="flex items-center gap-2"
                data-testid={`attachment-${att.id}`}
              >
                <FileTypeIcon
                  className="size-3 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="truncate">{att.filename}</span>
                {mimeLabel && mimeLabel !== att.mimeType && (
                  <span className="text-muted-foreground text-xs">
                    ({mimeLabel})
                  </span>
                )}
                {typeof att.size === 'number' && (
                  <span className="ml-auto text-muted-foreground">
                    {humanizeBytes(att.size)}
                  </span>
                )}
                {/* FR-17.3: 下載按鈕 */}
                <a
                  href={`/api/admin/chat/attachments/${att.id}/download`}
                  download
                  aria-label={`下載 ${att.filename}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <DownloadIcon className="size-3" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};