'use client';

/**
 * ChatMessageBubble — 顯示單條訊息
 */

import { renderMarkdown } from '@/lib/ai/chat/chat-utils';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';
import { cn } from '@/lib/utils';

type Props = {
  message: ChatMessage;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex w-full gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 shadow-sm',
          isUser && 'bg-primary text-primary-foreground',
          isAssistant && 'bg-muted text-foreground',
          message.role === 'system' && 'bg-yellow-100 text-yellow-900',
        )}
      >
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={
            isAssistant
              ? { __html: renderMarkdown(message.content) }
              : { __html: `<p>${escapeHtml(message.content)}</p>` }
          }
        />

        {/* JsonSpec metadata badge */}
        {message.metadata?.jsonSpec && (
          <div className="mt-2 rounded border border-green-300 bg-green-50 px-2 py-1 text-xs dark:bg-green-950 dark:text-green-100">
            ✨ 已生成 JsonSpec：
            <code className="ml-1 font-mono">
              {message.metadata.jsonSpec.name}
            </code>
            （{message.metadata.jsonSpec.models.length} models）
          </div>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}