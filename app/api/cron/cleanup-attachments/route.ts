/**
 * GET / POST /api/cron/cleanup-attachments
 *
 * Sprint 47 Commit 6 (Stage 47-5) — Vercel Cron Cleanup Endpoint
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.6 (FR-6.2)
 *
 * 安全模型:
 * - Vercel Cron 預設發 GET 帶 Authorization: Bearer <CRON_SECRET>
 * - 必須驗證 token 才執行清理 (避免外部觸發刪除)
 * - token 比對使用 timing-safe equal (Node crypto)
 *
 * 用法:
 * - Vercel Cron: vercel.json 每日 03:00 UTC 呼叫
 * - 本機手動: curl -H "Authorization: Bearer $CRON_SECRET" <url>
 * - 本機 script: pnpm cleanup:once (見 package.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { cleanupOldAttachments } from '@/lib/ai/chat/attachment-cleanup';

function verifyCronSecret(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // 沒設 CRON_SECRET = 拒絕全部 (fail-secure)
    return false;
  }
  if (!authHeader) return false;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return false;

  // timing-safe compare, 防止 timing attack
  const expectedBuf = Buffer.from(expected, 'utf-8');
  const tokenBuf = Buffer.from(token, 'utf-8');
  if (expectedBuf.length !== tokenBuf.length) return false;
  try {
    return timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupOldAttachments();
    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

// Vercel Cron 預設 GET, 同時支援 POST 作備援
export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}