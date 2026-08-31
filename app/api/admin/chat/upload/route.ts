/**
 * POST /api/admin/chat/upload
 *
 * Admin-only multipart upload for chat attachments (Sprint 46 Stage 46-A)
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §2.1 (FR-1) + §5.1
 *
 * 設計 (Sprint 46 Plan Gate Q10):
 * - MIME 白名單 + 大小上限 + RBAC 三層守衛
 * - RBAC: requireUser + isAdmin 雙層
 * - MIME: client 宣告 + 副檔名雙重驗證 (mime-validator)
 * - 大小: 10 MB multipart parser 階段拒收 + handler 階段再驗
 * - 多檔: 最多 10 個
 * - 儲存: ./uploads/<sessionId>/<uuid>.<ext>
 * - DB: 寫 Attachment table (FK sessionId, onDelete: NoAction 永久保留)
 * - 回傳: { attachments: [{ id, filename, mimeType, size, uploadedAt }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { requireUser, isAdmin } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { requireSessionOwnership, SessionOwnershipError } from '@/lib/auth/session-ownership';
import {
  validateMimeAndExtension,
  validateFileCount,
  MAX_FILE_SIZE,
} from '@/lib/ai/chat/mime-validator';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

export async function POST(req: NextRequest) {
  // 1. RBAC 雙層守衛 (FR-1.2)
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // 2. 解析 multipart (FR-1.1)
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Invalid multipart/form-data' },
      { status: 400 },
    );
  }

  // 3. 讀取 sessionId
  const sessionId = formData.get('sessionId');
  if (typeof sessionId !== 'string' || !sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId' },
      { status: 400 },
    );
  }

  // 4. 驗證 session 存在且歸屬此 admin user (Sprint 48-3 重構)
  // 使用 requireSessionOwnership helper, 與 stream route 風格一致
  try {
    await requireSessionOwnership(sessionId, user.id);
  } catch (err) {
    if (err instanceof SessionOwnershipError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // 5. 讀取 files[]
  const files = formData.getAll('files[]');
  if (!validateFileCount(files.length)) {
    return NextResponse.json(
      { error: `Too many files (max ${files.length})` },
      { status: 400 },
    );
  }

  // 6. 建立 session 子目錄
  const sessionDir = join(UPLOAD_ROOT, sessionId);
  try {
    await mkdir(sessionDir, { recursive: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create upload directory' },
      { status: 500 },
    );
  }

  // 7. 逐檔處理
  const results: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }> = [];
  const errors: Array<{ filename: string; error: string }> = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      errors.push({ filename: 'unknown', error: 'Invalid file entry' });
      continue;
    }

    const filename = file.name;

    // 7a. 大小檢查 (FR-1.4) - multipart parser 已拒收超大檔,
    // 仍做 handler 端驗證以防繞過
    if (file.size > MAX_FILE_SIZE) {
      errors.push({
        filename,
        error: `File too large (${file.size} bytes, max ${MAX_FILE_SIZE})`,
      });
      continue;
    }

    // 7b. MIME + 副檔名雙重驗證 (FR-1.3)
    if (!validateMimeAndExtension(file.type, filename)) {
      errors.push({
        filename,
        error: `Unsupported file type: ${file.type || 'unknown'}`,
      });
      continue;
    }

    // 7c. 寫檔
    const ext = filename.includes('.')
      ? filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
      : '';
    const storedName = `${randomUUID()}${ext ? `.${ext}` : ''}`;
    const storagePath = join(sessionDir, storedName);
    const relativePath = `uploads/${sessionId}/${storedName}`;

    try {
      const bytes = await file.arrayBuffer();
      await writeFile(storagePath, Buffer.from(bytes));
    } catch {
      errors.push({
        filename,
        error: 'Failed to write file',
      });
      continue;
    }

    // 7d. 寫 DB
    try {
      const attachment = await db.attachment.create({
        data: {
          sessionId,
          filename,
          mimeType: file.type,
          size: file.size,
          storagePath: relativePath,
        },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
          uploadedAt: true,
        },
      });
      results.push({
        ...attachment,
        uploadedAt: attachment.uploadedAt.toISOString(),
      });
    } catch {
      // 寫 DB 失敗 → rollback 檔案
      try {
        const { unlink } = await import('fs/promises');
        await unlink(storagePath);
      } catch {
        // ignore rollback 失敗
      }
      errors.push({
        filename,
        error: 'Failed to save attachment record',
      });
    }
  }

  // 8. 回應 (FR-1.7)
  // 全部失敗 → 400; 部分失敗 → 200 with errors; 全部成功 → 200
  if (results.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: 'All files failed', errors },
      { status: 400 },
    );
  }

  return NextResponse.json({
    attachments: results,
    ...(errors.length > 0 ? { errors } : {}),
  });
}

export const dynamic = 'force-dynamic';
