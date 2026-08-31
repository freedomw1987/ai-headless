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
 */

import { NextRequest } from 'next/server';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { streamChatMessages } from '@/lib/ai/agent-sdk/agent-sdk';
import { db } from '@/lib/db';

interface RequestBody {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  sessionId?: string;
  attachments?: { id: string }[];
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

  const { messages, sessionId, attachments: attachmentIds } =
    (await req.json()) as RequestBody;

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