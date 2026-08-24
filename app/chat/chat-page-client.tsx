'use client';

/**
 * ChatPage — AI 對話主頁面（TD-401 RWD + TD-406 Retry 整合）
 */

import { useState, useRef, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import {
  createChatSession,
  addMessage,
  extractJsonSpec,
  type ChatSession,
} from '@/lib/ai/chat/chat-utils';
import { streamChatWithRetry } from '@/lib/ai/stream-client';
import { abortStream, createStreamController } from '@/lib/ai/stream-controller';

export function ChatPageClient() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  // 自動捲到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length, streaming]);

  // TD-503: 組件 unmount 時 abort 所有活躍串流
  useEffect(() => {
    return () => {
      if (activeId) {
        abortStream(`chat-${activeId}`);
      }
    };
  }, [activeId]);

  const handleNewSession = () => {
    const session = createChatSession({});
    setSessions((prev) => [...prev, session]);
    setActiveId(session.id);
    setSidebarOpen(false); // 手機版創建後自動關閉 sidebar
  };

  const updateSession = (session: ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? session : s)),
    );
  };

  const handleSend = async (text: string) => {
    // 1. 確保有 active session
    let session = activeSession;
    if (!session) {
      session = createChatSession({});
      setSessions((prev) => [...prev, session!]);
      setActiveId(session!.id);
    }

    // TD-503: 如果上一輪串流未結束，先 abort
    if (streaming && session.id) {
      abortStream(`chat-${session.id}`);
    }

    // 2. 加 user 訊息
    session = addMessage(session, { role: 'user', content: text });
    updateSession(session);

    // 3. 加 placeholder assistant 訊息
    setStreaming(true);
    session = addMessage(session, { role: 'assistant', content: '' });
    updateSession(session);

    // TD-503: 建立 stream controller
    const controller = createStreamController(`chat-${session.id}`);

    // 4. 串流呼叫 API（TD-406 帶 retry + TD-503 帶 abort signal）
    let fullContent = '';
    let lastError: string | null = null;

    try {
      for await (const content of streamChatWithRetry(
        session.messages
          .filter((m) => m.role !== 'assistant' || m.content)
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content })),
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Chat retry attempt ${attempt}`);
          },
          signal: controller.signal,
        },
      )) {
        fullContent += content;

        // 更新最後一條 assistant 訊息
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== session!.id) return s;
            const messages = [...s.messages];
            const lastIdx = messages.length - 1;
            if (lastIdx >= 0 && messages[lastIdx]!.role === 'assistant') {
              messages[lastIdx] = {
                ...messages[lastIdx]!,
                content: fullContent,
              };
            }
            return { ...s, messages };
          }),
        );
      }

      // 5. 結尾檢查 JsonSpec
      const spec = extractJsonSpec(fullContent);
      if (spec) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== session!.id) return s;
            const messages = [...s.messages];
            const lastIdx = messages.length - 1;
            if (lastIdx >= 0 && messages[lastIdx]!.role === 'assistant') {
              messages[lastIdx] = {
                ...messages[lastIdx]!,
                metadata: { jsonSpec: spec },
              };
            }
            return { ...s, messages };
          }),
        );
      }
    } catch (err) {
      lastError = String(err);
      console.error('Chat stream error:', err);
      // 加錯誤訊息
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== session!.id) return s;
          const messages = [...s.messages];
          const lastIdx = messages.length - 1;
          if (lastIdx >= 0 && messages[lastIdx]!.role === 'assistant') {
            messages[lastIdx] = {
              ...messages[lastIdx]!,
              content: messages[lastIdx]!.content || `錯誤：${lastError}`,
            };
          }
          return { ...s, messages };
        }),
      );
    } finally {
      setStreaming(false);
    }
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
            onSelect={(id) => {
              setActiveId(id);
              setSidebarOpen(false);
            }}
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

        <div
          className="flex-1 overflow-y-auto"
          data-testid="chat-messages"
        >
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