/**
 * POST /api/chat/stream
 *
 * SSE Streaming AI Chat — 真實 Provider 串接（S4.4）
 * + TD-502 server-side 驗證 + rate limit
 */

import { NextRequest } from 'next/server';
import { extractJsonSpec } from '@/lib/ai/chat/chat-utils';
import { createProvider } from '@/lib/ai/providers/providers';
import { ChatAuthError, requireChatAuth } from '@/lib/ai/chat/chat-auth';
import { checkChatRateLimit } from '@/lib/ai/chat/chat-rate-limit';
import { logChatEvent } from '@/lib/ai/chat/chat-audit';

const CHAT_RATE_LIMIT = 20; // 每分鐘 20 次
const CHAT_RATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  // 1. Auth 驗證
  let session;
  try {
    session = await requireChatAuth();
  } catch (err) {
    if (err instanceof ChatAuthError) {
      logChatEvent({
        userId: 'anonymous',
        action: 'chat.unauthorized',
        metadata: { reason: err.message, statusCode: err.statusCode },
      });
      return new Response(
        JSON.stringify({ error: err.message }),
        {
          status: err.statusCode,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    throw err;
  }

  // 2. Rate limit（用 user-id 作為 key）
  const rateResult = checkChatRateLimit(session.id, {
    limit: CHAT_RATE_LIMIT,
    windowMs: CHAT_RATE_WINDOW_MS,
  });

  if (!rateResult.allowed) {
    logChatEvent({
      userId: session.id,
      action: 'chat.rate_limited',
      metadata: {
        resetAt: new Date(rateResult.resetAt).toISOString(),
        limit: CHAT_RATE_LIMIT,
        windowMs: CHAT_RATE_WINDOW_MS,
      },
    });
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        resetAt: new Date(rateResult.resetAt).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(
            Math.ceil((rateResult.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }

  // 3. 解析 request
  const { messages } = (await req.json()) as {
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  };

  logChatEvent({ userId: session.id, action: 'chat.start' });

  // 4. 選擇 Provider
  const provider = createProvider({
    AI_DEFAULT_PROVIDER: process.env.AI_DEFAULT_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  });

  // 5. 建 SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = '';
        let capturedUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined;
        for await (const chunk of provider.streamChunks(messages)) {
          if (chunk.content) {
            fullResponse += chunk.content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`),
            );
          }
          if (chunk.usage) {
            capturedUsage = chunk.usage;
          }
        }

        const spec = extractJsonSpec(fullResponse);
        if (spec) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ jsonSpec: spec })}\n\n`,
            ),
          );
        }

        // TD-505: 結尾送 usage chunk（若有）
        if (capturedUsage) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ usage: capturedUsage })}\n\n`,
            ),
          );
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

        logChatEvent({
          userId: session.id,
          action: 'chat.success',
          metadata: {
            responseLength: fullResponse.length,
            hasJsonSpec: !!spec,
            ...(capturedUsage ? { usage: capturedUsage } : {}),
          },
        });

        // TD-505: 若有 usage，獨立 chat.usage 事件讓未來成本查詢方便
        if (capturedUsage) {
          logChatEvent({
            userId: session.id,
            action: 'chat.usage',
            metadata: { usage: capturedUsage, provider: provider.name },
          });
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: String(err) })}\n\n`,
          ),
        );
        controller.close();

        logChatEvent({
          userId: session.id,
          action: 'chat.error',
          metadata: { errorMessage: String(err) },
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-RateLimit-Remaining': String(rateResult.remaining),
    },
  });
}

export const dynamic = 'force-dynamic';