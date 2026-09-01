/**
 * GET /api/admin/chat/attachments/[id]/download
 *
 * 下載 admin chat 附件 (Sprint 50 Stage 50-0, FR-17.4)
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.12 (FR-17.4)
 * 對應 Plan Gate: docs/sprint50-plan-gate.md
 *
 * 安全設計 (對齊 upload route Sprint 48-3 重構):
 * - RBAC 雙層: requireUser + isAdmin
 * - session ownership: requireSessionOwnership
 * - 404: attachment 不存在
 * - path traversal 防護: filePath.startsWith(UPLOAD_ROOT)
 * - 中文檔名: RFC 5987 雙編碼 (filename*=UTF-8''...)
 *
 * 設計:
 * - GET handler: 支援瀏覽器 <a download> 原生下載
 * - 不需寫 DB, 純讀檔
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  requireSessionOwnership,
  SessionOwnershipError,
} from '@/lib/auth/session-ownership';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. RBAC 雙層守衛 (對齊 upload route)
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // 2. 讀 attachment
  const { id } = await params;
  const attachment = await db.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 3. 驗證 session 歸屬 (Sprint 48-3 helper)
  try {
    await requireSessionOwnership(attachment.sessionId, user.id);
  } catch (err) {
    if (err instanceof SessionOwnershipError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }
    throw err;
  }

  // 4. 拼絕對路徑 + path traversal 防護
  const filePath = join(process.cwd(), attachment.storagePath);
  if (!filePath.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 500 }
    );
  }

  // 5. 讀檔
  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return NextResponse.json(
      { error: 'File not readable' },
      { status: 500 }
    );
  }

  // 6. 回傳 (含 Content-Disposition 強制下載 + 中文檔名 RFC 5987 編碼)
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      'Content-Length': attachment.size.toString(),
    },
  });
}

export const dynamic = 'force-dynamic';