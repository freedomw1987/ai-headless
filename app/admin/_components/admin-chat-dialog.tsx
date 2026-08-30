'use client';

/**
 * AdminChatDialog — Admin AI Chat 對話框容器 (S44-E)
 *
 * 功能:
 * - 浮動對話框 (fixed bottom-right)
 * - 點 FAB 開啟 / 點外面或 X 關閉
 * - 內容: AdminChatPanel
 * - admin-only (透過 parent 控制)
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { AdminChatPanel } from './admin-chat-panel';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

export function AdminChatDialog({ open, onOpenChange, userId }: Props) {
  // ESC 關閉
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop (透明 + click 關閉) */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={() => onOpenChange(false)}
        data-testid="chat-dialog-backdrop"
      />
      {/* Dialog 本體 */}
      <div
        className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] bg-background border rounded-lg shadow-2xl flex flex-col"
        role="dialog"
        aria-label="AI 對話"
        data-testid="admin-chat-dialog"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">AI 對話</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="關閉對話框"
            data-testid="chat-dialog-close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <AdminChatPanel userId={userId} />
      </div>
    </>
  );
}