'use client';

/**
 * AdminChatPanel — Admin AI Chat 對話內容 (S45-B)
 *
 * 設計:
 * - 用 AI Elements 元件: Conversation / Message / PromptInput
 * - 自製 SSE parsing hook (useChatStream)
 * - 保留 Sprint 43 createProviderFromDB (Custom URL 支援)
 */

import { useEffect } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { Loader2 } from 'lucide-react';
import { useChatStream } from './use-chat-stream';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';
import type { SessionDetail } from './use-chat-sessions';

type Props = {
  userId: string;
  sessionId: string | null;
  session: SessionDetail | null;
  onSessionCreated?: (sessionId: string) => void;
};

export function AdminChatPanel({ userId, sessionId, session, onSessionCreated }: Props) {
  const {
    messages,
    input,
    setInput,
    status,
    error,
    send,
    loadMessages,
    reset,
  } = useChatStream({
    sessionId,
    userId,
    onSessionUpdate: async () => {
      // Session 建立後通知 parent reload
      if (onSessionCreated) {
        const res = await fetch('/api/admin/chat/sessions');
        if (res.ok) {
          const data = (await res.json()) as { sessions: Array<{ id: string }> };
          const newest = data.sessions[0];
          if (newest) onSessionCreated(newest.id);
        }
      }
    },
  });

  // session 變動時載入 messages
  useEffect(() => {
    if (session) {
      loadMessages(session.messages);
    } else {
      reset();
    }
  }, [session, loadMessages, reset]);

  const isStreaming = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex flex-col h-full" data-testid="admin-chat-panel">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="text-center text-muted-foreground p-6">
                <p className="text-lg">💬 開始 AI 對話</p>
                <p className="mt-2 text-sm">輸入訊息，按 Enter 送出</p>
                {!sessionId && (
                  <p className="mt-1 text-xs">（將自動建立新對話）</p>
                )}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((msg: ChatMessage) => (
              <Message
                key={msg.id}
                from={msg.role}
                data-testid={msg.role === 'user' ? 'message-user' : 'message-assistant'}
              >
                <MessageContent>
                  {msg.role === 'assistant' ? (
                    <MessageResponse>{msg.content}</MessageResponse>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {isStreaming && (
            <div className="flex items-center gap-2 px-6 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI 正在輸入…
            </div>
          )}
          {error && (
            <div className="px-6 py-2 text-xs text-destructive">
              錯誤: {error.message}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={() => {
          void send();
        }}
        className="border-t"
      >
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="問 AI..."
            disabled={isStreaming}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <div className="flex-1" />
          <PromptInputSubmit
            status={isStreaming ? 'streaming' : 'ready'}
            disabled={!input.trim()}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}