/**
 * POST /api/admin/chat/stream
 *
 * Admin-only SSE streaming AI chat (Sprint 44 Commit F)
 *
 * 與 /api/chat/stream 差異:
 * - admin-only (requireUser + isAdmin 雙重檢查)
 * - 使用 Sprint 43 createProviderFromDB (Custom URL + AES-GCM 加密支援)
 * - 不走一般 user rate limit (admin 內部用, 較寬鬆)
 * - 串流錯誤回 [DONE] 而不是 throw
 *
 * 設計動機 (S44 Plan Gate):
 * - admin 在 /admin 頁用 FAB chat 時, 應該讀 admin user 設定的 AI provider
 * - 若 admin 設 Custom URL (Sprint 43 v2.0), 自動套用
 */

import { NextRequest } from 'next/server';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { createProviderFromDB } from '@/lib/ai/providers/providers';

export async function POST(req: NextRequest) {
  // 1. Auth + Admin check
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

  // 2. 解析 request
  const { messages } = (await req.json()) as {
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  };

  // 3. 取 Provider (Sprint 43 createProviderFromDB + Custom URL 支援)
  let provider;
  try {
    provider = await createProviderFromDB({ userId: user.id });
  } catch (err) {
    // Provider 設定錯誤, 回 503
    const message = err instanceof Error ? err.message : 'Provider setup failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. SSE streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = '';
        for await (const chunk of provider.streamText(messages)) {
          fullResponse += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`),
          );
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        // 串流失敗回 error chunk (不 throw)
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