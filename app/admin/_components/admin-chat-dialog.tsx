'use client';

/**
 * AdminChatDialog — Admin AI Chat 對話框容器 (S44-E/G2)
 *
 * 兩欄式 Drawer (用盡右邊):
 * - 左: 歷史對話 sidebar (list + 新開對話 button)
 * - 右: AdminChatPanel (當前 session 內容)
 *
 * 功能:
 * - 點 FAB 開啟 / 點外面或 X 關閉
 * - ESC 關閉
 * - admin-only (透過 parent 控制)
 * - 兩個 button: 「新開對話」+ 「歷史對話」toggle (歷史 sidebar 顯示/隱藏)
 */

import { useEffect, useRef, useState } from 'react';
import { X, MessageSquarePlus, History, Trash2 } from 'lucide-react';
import { AdminChatPanel } from './admin-chat-panel';
import { useChatSessions, type SessionSummary } from './use-chat-sessions';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

/**
 * FR-21.1: useConfirmDialog — 取代原生 confirm() 的原生 <dialog> 包裝
 */
function useConfirmDialog() {
  const [pending, setPending] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pending && !dialog.open) {
      dialog.showModal();
    } else if (!pending && dialog.open) {
      dialog.close();
    }
  }, [pending]);

  const confirm = (id: string, title: string) => setPending({ id, title });
  const cancel = () => setPending(null);
  const resolve = () => setPending(null);

  return { pending, confirm, cancel, resolve, dialogRef };
}

export function AdminChatDialog({ open, onOpenChange, userId }: Props) {
  const [historyOpen, setHistoryOpen] = useState(true); // 預設顯示歷史 sidebar
  const { pending: confirmDialog, confirm, cancel, resolve, dialogRef } = useConfirmDialog();
  const {
    sessions,
    activeId,
    activeSession,
    selectSession,
    createSession,
    removeSession,
  } = useChatSessions(userId);

  // ESC 關閉
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  const handleNewSession = async () => {
    await createSession();
  };

  const handleSelectSession = async (id: string) => {
    await selectSession(id);
  };

  const handleDeleteSession = async (id: string) => {
    confirm(id, '');
  };

  const handleConfirmDelete = async () => {
    if (confirmDialog) {
      await removeSession(confirmDialog.id);
      resolve();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop (透明 + click 關閉) */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={() => onOpenChange(false)}
        data-testid="chat-dialog-backdrop"
      />
      {/* 右側 Drawer (兩欄: 左歷史 + 右 chat) */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-[700px] max-w-[100vw] bg-background border-l shadow-2xl flex"
        role="dialog"
        aria-label="AI 對話"
        data-testid="admin-chat-dialog"
      >
        {/* 左欄: 歷史對話 sidebar */}
        {historyOpen && (
          <aside
            className="w-[240px] border-r flex flex-col bg-muted/30"
            data-testid="chat-history-sidebar"
          >
            <div className="px-3 py-3 border-b shrink-0">
              <button
                type="button"
                onClick={handleNewSession}
                className="w-full flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                data-testid="new-chat-button"
              >
                <MessageSquarePlus className="h-4 w-4" />
                新開對話
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                  尚無對話歷史
                </p>
              ) : (
                <ul className="py-1">
                  {sessions.map((s: SessionSummary) => (
                    <li key={s.id}>
                      {/* Sprint 54 重構 (FR-21.1): 外層純 flex container, 兩個 button 並排, 解決 nested interactive 問題 */}
                      <div
                        className={`w-full flex items-center gap-1 px-3 py-2 text-sm hover:bg-accent ${
                          activeId === s.id ? 'bg-accent' : ''
                        }`}
                        data-testid={`session-item-${s.id}`}
                      >
                        <button
                          type="button"
                          data-action="select"
                          onClick={() => handleSelectSession(s.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              void handleSelectSession(s.id);
                            }
                          }}
                          className="flex-1 text-left truncate cursor-pointer"
                          aria-label={`選擇對話 ${s.title}`}
                        >
                          {s.title}
                        </button>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {s._count.messages}
                        </span>
                        <button
                          type="button"
                          data-action="delete"
                          onClick={() => handleDeleteSession(s.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Delete' || e.key === 'Backspace') {
                              e.preventDefault();
                              void handleDeleteSession(s.id);
                            }
                          }}
                          className="ml-1 p-1 rounded hover:bg-destructive/20 shrink-0"
                          aria-label="刪除對話"
                          data-testid={`delete-session-${s.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}

        {/* 右欄: Chat 主體 */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(!historyOpen)}
                className={`rounded-md p-1.5 hover:bg-accent ${historyOpen ? 'bg-accent' : ''}`}
                aria-label="歷史對話"
                title="歷史對話"
                data-testid="history-toggle-button"
              >
                <History className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-semibold truncate">
                {activeSession?.title ?? 'AI 對話'}
              </h2>
            </div>
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
          <AdminChatPanel
            userId={userId}
            sessionId={activeId}
            session={activeSession}
            onSessionCreated={(id) => void selectSession(id)}
          />
        </div>
      </div>

      {/* Sprint 54 (FR-21.1): 原生 <dialog> 確認對話框, 取代原生 confirm() */}
      <dialog
        ref={dialogRef}
        className="rounded-lg p-0 backdrop:bg-black/40"
        data-testid="delete-confirm-dialog"
      >
        <div className="p-6 min-w-[320px]">
          <h3 className="text-lg font-semibold mb-2">確認刪除對話</h3>
          <p className="text-sm text-muted-foreground mb-6">
            確定刪除此對話? 刪除後無法復原。
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              className="px-4 py-2 rounded border hover:bg-accent text-sm"
              data-testid="delete-confirm-cancel"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
              data-testid="delete-confirm-ok"
            >
              刪除
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}