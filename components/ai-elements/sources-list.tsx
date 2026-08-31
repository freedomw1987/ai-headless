/**
 * SourcesList — Sprint 47 Commit 2 (Stage 47-1)
 *
 * 顯示本次對話附件的可折疊清單。
 * 對應 PRD §2.2 FR-2.6: Sources 降階方案為「附件引用折疊區」
 * Plan Gate Q1 決策: 接受 pi-agent-sdk 能力降階，不做 RAG/Sources
 *
 * Props:
 * - attachments?: 附件列表 (空/undefined 時不渲染)
 *
 * A11y:
 * - role="button" + aria-expanded
 * - 鍵盤可達 (Enter 切換)
 */

import { useState, type KeyboardEvent } from 'react';
import { FileIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SourcesListAttachment = {
  id: string;
  filename: string;
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
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-2">
              <FileIcon className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{att.filename}</span>
              {typeof att.size === 'number' && (
                <span className="ml-auto text-muted-foreground">
                  {humanizeBytes(att.size)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};