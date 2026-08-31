/**
 * POST /api/admin/chat/stream
 *
 * Admin-only SSE streaming AI chat (Sprint 44 Commit F + Sprint 46 重構 + Sprint 47 擴展)
 *
 * Sprint 46 重構:
 * - 從「直接呼叫 Anthropic/OpenAI Provider」改為「走 pi-agent-sdk」
 * - 對應設計: docs/system-design.md §6.3 (AI Pipeline 用 pi agent 驅動)
 * - SDK: https://pi.dev/docs/latest/sdk
 * - Wrapper: lib/ai/agent-sdk/agent-sdk.ts (streamChatMessages)
 *
 * Sprint 46 Commit 5: 接受 attachments 參數 (從 DB 讀 attachment 內容)
 *
 * Sprint 47 Commit 2 (Stage 47-1): SSE protocol 擴展
 * - 新增 data: { reasoning: '...' } events (AI 思考過程)
 * - streamChatMessages 加 onReasoningDelta callback
 *
 * Sprint 47 Commit 3 (Stage 47-2): Vision 多模態
 * - 接受 images 參數 (base64 + mimeType)，轉交 streamChatMessages 走 SDK 原生 PromptOptions.images
 * - 對應 PRD §2.3 (FR-3.1 ~ FR-3.5)
 */

import { NextRequest } from 'next/server';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { streamChatMessages } from '@/lib/ai/agent-sdk/agent-sdk';
import { db } from '@/lib/db';
import { requireSessionOwnership, SessionOwnershipError } from '@/lib/auth/session-ownership';

interface RequestBody {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  sessionId?: string;
  attachments?: { id: string }[];
  /**
   * Sprint 47 Commit 3 (Stage 47-2): Vision 圖片
   * base64 data + mimeType (image/png, image/jpeg, image/webp, image/gif)
   * 最多 10 張 (FR-3.3)
   */
  images?: Array<{ type: 'image'; data: string; mimeType: string }>;
}

export async function POST(req: NextRequest) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!(await isAdmin())) {
    return new Response(JSON.stringify({ error: 'Admin only' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, sessionId, attachments: attachmentIds, images } =
    (await req.json()) as RequestBody;

  // Sprint 47 Commit 7 (Stage 47-6): 驗證 session 歸屬 (FR-7.2)
  // 防止 user A 透過 body 傳 user B 的 sessionId 取得附件
  if (sessionId) {
    try {
      await requireSessionOwnership(sessionId, user.id);
    } catch (err) {
      if (err instanceof SessionOwnershipError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw err;
    }
  }

  // Sprint 46 Commit 5: 從 DB 讀 attachment 詳情 (storagePath, filename, mime)
  const attachments =
    sessionId && attachmentIds && attachmentIds.length > 0
      ? await db.attachment.findMany({
          where: {
            id: { in: attachmentIds.map((a) => a.id) },
            sessionId,
          },
          select: {
            id: true,
            filename: true,
            mimeType: true,
            storagePath: true,
          },
        })
      : [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (sessionId && messages.length > 0) {
          const lastMsg = messages[messages.length - 1]!;
          if (lastMsg.role === 'user') {
            await db.chatMessage.create({
              data: {
                sessionId,
                role: 'user',
                content: lastMsg.content,
              },
            });
          }
        }

        const { fullText } = await streamChatMessages({
          messages,
          attachments: attachments.map((a) => ({
            id: a.id,
            filename: a.filename,
            mime: a.mimeType,
            storagePath: a.storagePath,
          })),
          // Sprint 47 Commit 3 (Stage 47-2): Vision 走 SDK 原生
          images,
          systemPrompt: 'You are a helpful AI assistant.',
          onDelta: (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`),
            );
          },
          // Sprint 47 Commit 2 (Stage 47-1): reasoning stream 轉成 SSE event
          onReasoningDelta: (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ reasoning: chunk })}\n\n`),
            );
          },
          onComplete: async (text) => {
            if (sessionId && text) {
              await db.chatMessage.create({
                data: {
                  sessionId,
                  role: 'assistant',
                  content: text,
                },
              });
              await db.chatSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() },
              });
            }
          },
        });

        if (!fullText) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: '' })}\n\n`,
            ),
          );
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export const dynamic = 'force-dynamic';