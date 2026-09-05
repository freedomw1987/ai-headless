/**
 * GET /api/admin/chat/sessions/[id] — 取得單 session + messages
 * DELETE /api/admin/chat/sessions/[id] — 刪除 session
 *
 * Sprint 44 Commit G2
 * Sprint 54 Bug Fix (用戶反饋 500): 清除 attachments (DB + 檔案系統)
 * - Attachment schema 設為 onDelete: NoAction, 不 cascade
 * - DELETE 需手動清除
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { createChildLogger } from '@/lib/log';

type Params = { params: Promise<{ id: string }> };

async function authorize() {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (!(await isAdmin())) return { error: 'Admin only', status: 403 as const };
  return { user };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await authorize();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;

  const session = await db.chatSession.findFirst({
    where: { id, userId: auth.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await authorize();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const log = createChildLogger({ userId: auth.user.id, sessionId: id, route: 'DELETE /api/admin/chat/sessions/[id]' });

  log.info('delete session requested', { attachmentCount: undefined });

  // Sprint 54 Bug Fix — 先確認 session 存在且為此 user 所有 (S47-6 inline check: findUnique + userId)
  const session = await db.chatSession.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      attachments: { select: { storagePath: true } },
    },
  });
  if (!session || session.userId !== auth.user.id) {
    log.warn('session not found or not owned by user');
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  log.info('session found, starting cleanup', { attachmentCount: session.attachments.length });

  // 1. 清檔案系統 (uploads/ 下每個 attachment)
  if (session.attachments.length > 0) {
    try {
      const { rm } = await import('fs/promises');
      const { join } = await import('path');
      for (const att of session.attachments) {
        // storagePath 格式: "uploads/<sessionId>/<uuid>.<ext>" → 從 cwd 解絕對路徑
        const absolutePath = join(process.cwd(), att.storagePath);
        await rm(absolutePath, { force: true }); // force=true 許不存在不報錯
      }
    } catch (err) {
      // 檔案清除失敗不影響 DB 刪除 (避免部分刪除造成不一致)
      log.error('failed to remove attachment files', { error: String(err) });
    }
  }

  // 2. DB: 先刪 Attachment records (因為 FK onDelete: NoAction)
  if (session.attachments.length > 0) {
    try {
      await db.attachment.deleteMany({
        where: { sessionId: id },
      });
    } catch (err) {
      log.error('failed to delete attachment records', { error: String(err) });
      return NextResponse.json(
        { error: 'Failed to delete attachments' },
        { status: 500 },
      );
    }
  }

  // 3. 最後刪 session 本身
  const result = await db.chatSession.deleteMany({
    where: { id, userId: auth.user.id },
  });
  if (result.count === 0) {
    log.warn('session delete returned count=0');
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  log.info('session deleted successfully');
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';