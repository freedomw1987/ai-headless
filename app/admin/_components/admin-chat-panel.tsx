'use client';

/**
 * AdminChatPanel — Admin AI Chat 對話內容 (S44-E)
 *
 * 功能:
 * - Message list (複用既有 MessageBubble)
 * - Chat input (複用既有 ChatInput)
 * - Streaming indicator
 * - Markdown 渲染 (透過 MessageBubble.renderMarkdown)
 * - 與 admin user session 綁定 (S44 Plan Gate: user-scoped sessions)
 *
 * 設計:
 * - 用 useRef 追蹤滾動到底部
 * - 用既有 streamChatWithRetry + createStreamController
 * - 訊息儲存在 local state (S44-G 整合 ChatSession/ChatMessage schema)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/chat/chat-input';
import { createStreamController } from '@/lib/ai/stream-controller';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';

type Props = {
  userId: string;
};

export function AdminChatPanel({ userId: _userId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動捲到底
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streaming]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    // 用 streamController 管理 abort
    const controller = createStreamController(`admin-chat-${_userId}`);
    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      let fullContent = '';
      try {
        const response = await fetch('/api/admin/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`Stream API error: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          // Parse SSE data: lines
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.content) fullContent += parsed.content;
              if (parsed.error) throw new Error(parsed.error);
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (err) {
        // 串流失敗顯示錯誤
        const message = err instanceof Error ? err.message : String(err);
        fullContent = `[串流錯誤: ${message}]`;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullContent } : m)),
      );
    } finally {
      setStreaming(false);
    }
  }, [_userId, messages]);

  return (
    <div className="flex flex-col h-full" data-testid="admin-chat-panel">
      <div className="flex-1 overflow-y-auto" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground p-6">
            <div>
              <p className="text-lg">💬 開始 AI 對話</p>
              <p className="mt-2 text-sm">輸入訊息，按 Enter 送出</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
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
      <ChatInput onSubmit={handleSend} disabled={streaming} placeholder="問 AI..." />
    </div>
  );
}