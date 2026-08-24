'use client';

/**
 * ChatPage — AI 對話主頁面
 *
 * TD-501 重構後：原本 243 行的單體組件拆為 3 個 hooks：
 * - useChatSessions  : sessions CRUD 狀態
 * - useChatStream    : 串流 + retry + abort + JsonSpec 邏輯
 * - useSidebarToggle : RWD 手機版抽屜
 *
 * 本檔只剩「組合 hooks + UI 渲染」。
 */

import { useEffect, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { abortStream } from '@/lib/ai/stream-controller';
import { useChatSessions } from './hooks/use-chat-sessions';
import { useChatStream } from './hooks/use-chat-stream';
import { useSidebarToggle } from './hooks/use-sidebar-toggle';

export function ChatPageClient() {
  const { sessions, activeId, activeSession, setActiveId, createSession, dispatch } =
    useChatSessions();
  const { open: sidebarOpen, setOpen: setSidebarOpen, selectAndClose } = useSidebarToggle();
  const { streaming, send } = useChatStream(sessions, dispatch);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動捲到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, streaming]);

  // TD-503: 組件 unmount 或切換 active session 時 abort 活躍串流
  useEffect(() => {
    return () => {
      if (activeId) {
        abortStream(`chat-${activeId}`);
      }
    };
  }, [activeId]);

  const handleNewSession = () => {
    createSession();
    setSidebarOpen(false); // 手機版創建後自動關閉 sidebar
  };

  const handleSend = (text: string) => {
    const session = activeSession ?? createSession();
    void send({ session, text });
  };

  return (
    <div className="flex h-screen" data-testid="chat-page">
      {/* 桌面版始終顯示 sidebar */}
      <div className="hidden md:block">
        <ChatSidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={handleNewSession}
        />
      </div>

      {/* 手機版漢堡按鈕 */}
      <div className="absolute left-2 top-2 z-10 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-md bg-background p-2 shadow-md"
          aria-label="開啟側邊欄"
          data-testid="mobile-menu-button"
        >
          ☰
        </button>
      </div>

      {/* 手機版抽屜式 sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" data-testid="mobile-sidebar">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <ChatSidebar
            sessions={sessions}
            activeId={activeId}
            onSelect={(id) => selectAndClose(id, setActiveId)}
            onNew={handleNewSession}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      <main className="flex flex-1 flex-col">
        <header className="border-b px-6 py-3">
          <h1 className="text-lg font-semibold">AI Chat</h1>
          <p className="text-sm text-muted-foreground">
            用自然語言描述需求，AI 幫你生成 JsonSpec
          </p>
        </header>

        <div className="flex-1 overflow-y-auto" data-testid="chat-messages">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <p className="text-lg">👋 你好！</p>
                <p className="mt-2 text-sm">
                  輸入「幫我做個待辦事項」或「建立活動管理」開始
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeSession.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {streaming && (
                <div className="px-6 py-2 text-xs text-muted-foreground">
                  <span className="animate-pulse">▍</span> AI 正在輸入…
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSubmit={handleSend} disabled={streaming} />
      </main>
    </div>
  );
}