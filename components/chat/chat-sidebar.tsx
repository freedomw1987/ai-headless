'use client';

/**
 * ChatSidebar — Session 列表（TD-401 RWD：手機版可關閉）
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/lib/ai/chat/chat-utils';

type Props = {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose?: () => void;
};

export function ChatSidebar({ sessions, activeId, onSelect, onNew, onClose }: Props) {
  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30" data-testid="chat-sidebar">
      <div className="flex items-center gap-2 border-b p-3">
        <Button
          onClick={onNew}
          className="flex-1"
          variant="default"
          size="sm"
          data-testid="new-chat-button"
        >
          + 新對話
        </Button>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="關閉側邊欄"
            data-testid="sidebar-close-button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            還沒有對話
          </p>
        ) : (
          sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelect(session.id)}
              className={cn(
                'mb-1 w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                'hover:bg-muted',
                session.id === activeId && 'bg-primary/10 font-medium text-primary',
              )}
              data-testid={`session-${session.id}`}
            >
              <div className="truncate">{session.title}</div>
              <div className="text-xs text-muted-foreground">
                {session.messages.length} 條訊息
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}