'use client';

/**
 * ChatInput — 訊息輸入框 + 送出按鈕
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ onSubmit, disabled = false, placeholder = '輸入訊息...' }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t bg-background p-3 sm:p-4">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          className={cn(
            'flex-1 min-h-[44px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          data-testid="chat-input"
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="shrink-0"
          data-testid="chat-send-button"
        >
          送出
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        按 Enter 送出 · Shift + Enter 換行
      </p>
    </div>
  );
}