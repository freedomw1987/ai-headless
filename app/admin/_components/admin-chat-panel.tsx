'use client';

/**
 * AdminChatPanel — Admin AI Chat 對話內容 (S45-B/C)
 *
 * 設計:
 * - 用 AI Elements 元件: Conversation / Message / PromptInput
 * - 自製 SSE parsing hook (useChatStream)
 * - 保留 Sprint 43 createProviderFromDB (Custom URL 支援)
 * - S45-C: 附件 UI (純前端, 不上傳)
 */

import { useEffect } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input';
import { Loader2, Paperclip, X } from 'lucide-react';
import { CodeBlock, CodeBlockContent } from '@/components/ai-elements/code-block';
import { parseMarkdown, renderInlineMarkdown } from './markdown-parser';
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
                    <MarkdownRender content={msg.content} />
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

      <PromptInputProvider>
        <PromptInputWrapper
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          send={send}
        />
      </PromptInputProvider>
    </div>
  );
}

/**
 * PromptInputWrapper — 在 PromptInputProvider 內處理 attachments + send (S45-C)
 *
 * 設計:
 * - 在 PromptInputProvider 子樹內才能用 usePromptInputAttachments
 * - 集中處理附件 + 送出邏輯
 */
type WrapperProps = {
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  send: (overrideInput?: string, attachments?: ReadonlyArray<{ filename: string; size?: number }>) => Promise<void>;
};

function PromptInputWrapper({ input, setInput, isStreaming, send }: WrapperProps) {
  const attachments = usePromptInputAttachments();

  const handleSubmit = () => {
    const atts = attachments.files.map((f) => ({
      filename: f.filename ?? 'file',
      size: undefined,
    }));
    void send(input, atts);
    attachments.clear();
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="border-t"
    >
      <PromptInputHeader>
        <AttachmentsChips />
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          placeholder="問 AI..."
          disabled={isStreaming}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments label="附加檔案" />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </PromptInputTools>
        <div className="flex-1" />
        <PromptInputSubmit
          status={isStreaming ? 'streaming' : 'ready'}
          disabled={!input.trim() && attachments.files.length === 0}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}

/**
 * AttachmentsChips — 顯示已選附件檔名 + 移除按鈕 (S45-C)
 */
function AttachmentsChips() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2 px-3 py-2"
      data-testid="attachments-chips"
    >
      {attachments.files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-1 rounded-full border bg-muted px-2 py-1 text-xs"
          data-testid="attachment-chip"
        >
          <Paperclip className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{file.filename ?? 'file'}</span>
          <button
            type="button"
            onClick={() => attachments.remove(file.id)}
            className="ml-1 rounded-full p-0.5 hover:bg-background"
            aria-label={`移除 ${file.filename ?? 'file'}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * MarkdownRender — AI 回應 markdown 渲染 (S45-D)
 *
 * 設計:
 * - 用自製 parseMarkdown 拆 text + code blocks
 * - code block 走 AI Elements CodeBlockContent (含 shiki syntax highlight)
 * - text block 走 renderInlineMarkdown (處理 ** * `inline`)
 */
function MarkdownRender({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className="flex flex-col gap-2" data-testid="markdown-render">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <CodeBlock key={idx} code={block.code} language={block.lang as Parameters<typeof CodeBlockContent>[0]['language']}>
              <CodeBlockContent code={block.code} language={block.lang as Parameters<typeof CodeBlockContent>[0]['language']} />
            </CodeBlock>
          );
        }
        // text block: 行內 markdown 處理
        return (
          <div
            key={idx}
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
          />
        );
      })}
    </div>
  );
}