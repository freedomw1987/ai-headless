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
import { ReasoningSection } from '@/components/ai-elements/reasoning-section';
import { SourcesList } from '@/components/ai-elements/sources-list';
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
import { Markdown } from '@/lib/ai/chat/markdown-renderer';
import { useChatStream } from './use-chat-stream';
import type { ChatMessage } from '@/lib/ai/chat/chat-utils';
import type { SessionDetail } from './use-chat-sessions';
import {
  isExtensionCommand,
  parseExtensionCommand,
} from '@/lib/ai/agent-sdk/extension-generator';

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
    setMessages,
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
                {msg.role === 'assistant' && (
                  <ReasoningSection reasoning={msg.reasoning} />
                )}
                <MessageContent>
                  {msg.role === 'assistant' ? (
                    <MarkdownRender content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </MessageContent>
                <SourcesList attachments={msg.attachments} />
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
          setMessages={setMessages}
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
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

function PromptInputWrapper({ input, setInput, isStreaming, send, setMessages }: WrapperProps) {
  const attachments = usePromptInputAttachments();

  /**
   * Sprint 53-0 (FR-20.1) + Sprint 55-1 (FR-22.3): 處理 Extension Generator slash command
   * [Extension Generator] Sprint 55 接通: 真 fetch /api/admin/extensions/generate
   * - /extension create <name> --fields=f1,f2 [--force] → POST /api/admin/extensions/generate
   * - /extension help → 回傳用法說明
   * - 一般 chat → 走原本 send() 流程
   */
  const handleExtensionCommand = async (text: string): Promise<void> => {
    if (!isExtensionCommand(text)) {
      return;
    }

    const nowIso = new Date().toISOString();
    const makeMsg = (id: string, content: string): ChatMessage => ({
      id,
      role: 'assistant' as const,
      content,
      createdAt: nowIso,
    });

    try {
      const parsed = parseExtensionCommand(text);

      if (parsed.action === 'help') {
        setMessages((prev) => [
          ...prev,
          makeMsg(
            `help-${Date.now()}`,
            `**Extension Generator 使用方式:**\n\n\`/extension create <name> --fields=f1,f2,f3 [--force]\`\n\n範例:\n- \`/extension create product --fields=name,price,stock\`\n- \`/extension create order --fields=customerId,total --force\``,
          ),
        ]);
        return;
      }

      if (parsed.action === 'create' && parsed.name) {
        // 顯示 loading 訊息
        const loadingId = `ext-loading-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          makeMsg(loadingId, `🔨 正在建立 extension '${parsed.name}'...`),
        ]);

        try {
          const res = await fetch('/api/admin/extensions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: parsed.name,
              fields: parsed.fields,
              force: parsed.force,
            }),
          });

          const data = (await res.json()) as {
            success?: boolean;
            extensionName?: string;
            files?: string[];
            error?: string;
            details?: string[];
          };

          // 移除 loading, 加結果訊息
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingId);
            if (res.ok && data.success) {
              return [
                ...filtered,
                makeMsg(
                  `ext-success-${Date.now()}`,
                  `✅ 已建立 extension '${data.extensionName}', ${data.files?.length ?? 0} 個檔案於 extensions/${data.extensionName}/\n\n檔案:\n${(data.files ?? []).map((f) => `- ${f}`).join('\n')}`,
                ),
              ];
            }
            return [
              ...filtered,
              makeMsg(
                `ext-error-${Date.now()}`,
                `❌ 建立失敗: ${data.error ?? 'Unknown error'}${data.details ? '\n\n' + data.details.join('\n') : ''}`,
              ),
            ];
          });
        } catch (err) {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== loadingId),
            makeMsg(
              `ext-network-error-${Date.now()}`,
              `❌ 網路錯誤: ${err instanceof Error ? err.message : 'Unknown'}`,
            ),
          ]);
        }
        return;
      }
    } catch {
      // 解析錯誤, 走一般 chat
    }
  };

  const handleSubmit = async () => {
    // FR-20.1: 偵測 slash command
    if (isExtensionCommand(input)) {
      await handleExtensionCommand(input);
      setInput('');
      return;
    }

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
 * MarkdownRender — AI 回應 markdown 渲染 (S45-D + Sprint 46 重構)
 *
 * Sprint 46 重構: 改用 react-markdown + remark-gfm 取代自製 parseMarkdown
 * - 支援 headings, links, lists, tables, blockquote, strikethrough, tasklists
 * - Code block 仍走 AI Elements CodeBlockContent (含 shiki syntax highlight)
 */
function MarkdownRender({ content }: { content: string }) {
  return (
    <Markdown
      content={content}
      className="flex flex-col gap-2"
    />
  );
}