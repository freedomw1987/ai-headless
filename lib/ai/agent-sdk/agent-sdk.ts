/**
 * Sprint 46 Chat Drawer SDK 重構
 *
 * lib/ai/agent-sdk/agent-sdk.ts
 *
 * 把 chat drawer 從「直接呼叫 createProviderFromDB」改為「走 pi-agent-sdk」。
 *
 * 對應設計:
 * - docs/system-design.md §6.3 (AI Pipeline 用 pi agent 驅動)
 * - https://pi.dev/docs/latest/sdk
 *
 * 設計動機:
 * - 統一 AI 執行層: chat drawer, pipeline runner, extension commands 全部走同一層
 * - 自動支援: streaming, multi-provider, OAuth, custom URL
 * - 自動事件: text_delta, thinking_delta, tool_execution_*, message_end
 *
 * Sprint 46 範圍:
 * - 提供 createChatSession(messages) factory
 * - 從 AIConfig (userId=null) 讀 Custom URL + API Key 設定 ModelRuntime
 * - 簡化: chat drawer 不需要 streaming tools (noTools: 'all')
 * - 簡化: messages 走 system prompt + user content (不送整段 history 給 LLM,
 *   因為 pi-agent-sdk 自己管 session.messages)
 *
 * Sprint 46 Commit 5: 加入 attachments 支援 (讀文字附件附加到 prompt)
 * Sprint 47 Commit 2 (Stage 47-1): 加入 thinking_delta 處理 (ReasoningSection)
 */

import {
  createAgentSession,
  ModelRuntime,
  SessionManager,
  type AgentSession,
} from '@earendil-works/pi-coding-agent';
import type { AssistantMessageEvent } from '@earendil-works/pi-ai';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/ai/providers/providers';
import { readAttachmentText } from '@/lib/ai/chat/attachment-reader';

/** 附件 reference (來自 DB Attachment table) */
export interface AttachmentRef {
  id: string;
  filename: string;
  mime: string;
  storagePath: string;
}

/** AIConfig DB type -> pi-agent-sdk provider */
function configTypeToProviderId(type: string): string {
  switch (type) {
    case 'openai':
      return 'openai';
    case 'claude':
      return 'anthropic';
    case 'openai-compatible':
      return 'openai';
    case 'anthropic-compatible':
      return 'anthropic';
    default:
      return 'openai';
  }
}

/**
 * 從 AIConfig (userId=null, Global URL) 建立 pi-agent-sdk ModelRuntime
 */
export async function createChatModelRuntime(): Promise<{
  modelRuntime: ModelRuntime;
  modelId: string;
}> {
  const cfg = await db.aIConfig.findFirst({
    where: { userId: null },
  });

  const modelRuntime = await ModelRuntime.create();

  if (!cfg) {
    const available = await modelRuntime.getAvailable();
    const firstModel = available[0];
    if (!firstModel) {
      throw new Error('No AI model available. Please configure AI provider at /admin/ai-config');
    }
    return { modelRuntime, modelId: firstModel.id };
  }

  const apiKey = decrypt(cfg.apiKeyEnc || '');
  const providerId = configTypeToProviderId(cfg.type);
  await modelRuntime.setRuntimeApiKey(providerId, apiKey);
  const modelId = cfg.model || 'gpt-4';

  return { modelRuntime, modelId };
}

/**
 * 建立 chat session (簡化版, 不走 pipeline/tools)
 */
export async function createChatSession(options: {
  modelRuntime: ModelRuntime;
  modelId: string;
  systemPrompt?: string;
}): Promise<AgentSession> {
  const { session } = await createAgentSession({
    modelRuntime: options.modelRuntime,
    noTools: 'all',
    sessionManager: SessionManager.inMemory(),
  });

  if (options.modelId) {
    const model = options.modelRuntime.getModel(
      inferProviderFromModel(options.modelId),
      options.modelId,
    );
    if (model) {
      await session.setModel(model);
    }
  }

  return session;
}

function inferProviderFromModel(modelId: string): string {
  if (modelId.startsWith('claude') || modelId.startsWith('MiniMax')) {
    return 'anthropic';
  }
  return 'openai';
}

/**
 * 一次性 helper: createChatSession + 串流 messages
 *
 * @example
 * ```ts
 * const stream = streamChatMessages({
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   systemPrompt: 'You are helpful',
 *   onDelta: (chunk) => controller.enqueue(encoder.encode(chunk)),
 *   onComplete: (fullText) => persistAssistantMessage(fullText),
 * });
 * ```
 */
export async function streamChatMessages(params: {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  attachments?: AttachmentRef[];
  systemPrompt?: string;
  onDelta: (chunk: string) => void;
  onReasoningDelta?: (chunk: string) => void;
  onComplete: (fullText: string) => void | Promise<void>;
}): Promise<{ fullText: string; reasoning: string; aborted: boolean }> {
  const { modelRuntime, modelId } = await createChatModelRuntime();
  const session = await createChatSession({
    modelRuntime,
    modelId,
    systemPrompt: params.systemPrompt,
  });

  let fullText = '';
  let reasoningContent = '';
  let aborted = false;
  const unsub = session.subscribe((event) => {
    if (event.type === 'message_update') {
      const sub: AssistantMessageEvent = event.assistantMessageEvent;
      if (sub.type === 'text_delta') {
        const delta = sub.delta;
        fullText += delta;
        params.onDelta(delta);
      } else if (sub.type === 'thinking_delta') {
        // Sprint 47 Commit 2 (Stage 47-1): thinking_delta → onReasoningDelta
        const delta = sub.delta;
        reasoningContent += delta;
        params.onReasoningDelta?.(delta);
      }
    }
  });

  try {
    const lastUserMsg = [...params.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      throw new Error('No user message to send');
    }

    // Sprint 46 Commit 5: 讀取附件文字內容並附加到 prompt
    let promptText = lastUserMsg.content;
    if (params.attachments && params.attachments.length > 0) {
      const attachmentBlocks = await Promise.all(
        params.attachments.map(async (att) => {
          try {
            const text = await readAttachmentText(att.storagePath, att.filename);
            return `\n\n--- Attached file: ${att.filename} ---\n${text}`;
          } catch {
            return `\n\n--- Attached file: ${att.filename} (not parsed, Sprint 47+) ---`;
          }
        }),
      );
      promptText = `${lastUserMsg.content}${attachmentBlocks.join('')}`;
    }

    await session.prompt(promptText, {
      streamingBehavior: 'followUp',
    });
    await session.waitForIdle();

    await params.onComplete(fullText);
  } catch (err) {
    aborted = true;
    throw err;
  } finally {
    unsub();
    session.dispose();
  }

  return { fullText, reasoning: reasoningContent, aborted };
}