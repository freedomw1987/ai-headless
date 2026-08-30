/**
 * Sprint 46 Commit 6 — Attachment Cleanup 單元測試
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §1.2 (Sprint 47+ TODO)
 *
 * 測試 cleanupOldAttachments 實際行為 (mock DB + unlink)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Mock Prisma db
vi.mock('@/lib/db', () => ({
  db: {
    attachment: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import { cleanupOldAttachments, retentionDays } from './attachment-cleanup';

describe('attachment-cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retentionDays 應為 90', () => {
    expect(retentionDays).toBe(90);
  });

  it('cleanupOldAttachments 應回傳 { deleted: 0, failed: 0 } 當無附件', async () => {
    vi.mocked(db.attachment.findMany).mockResolvedValue([]);

    const result = await cleanupOldAttachments();

    expect(result.deleted).toBe(0);
    expect(result.failed).toBe(0);
    expect(db.attachment.findMany).toHaveBeenCalledWith({
      where: {
        uploadedAt: {
          lt: expect.any(Date),
        },
      },
      select: {
        id: true,
        storagePath: true,
      },
    });
  });

  it('cleanupOldAttachments 應刪附件 + DB row', async () => {
    // 建立測試檔
    const testDir = '/tmp/test-cleanup-files';
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    const testFile = join(testDir, 'test.txt');
    writeFileSync(testFile, 'test content');

    vi.mocked(db.attachment.findMany).mockResolvedValue([
      { id: 'att-1', storagePath: testFile },
    ] as never);
    vi.mocked(db.attachment.delete).mockResolvedValue({
      id: 'att-1',
    } as never);

    const result = await cleanupOldAttachments();

    expect(result.deleted).toBe(1);
    expect(result.failed).toBe(0);
    expect(db.attachment.delete).toHaveBeenCalledWith({
      where: { id: 'att-1' },
    });
    expect(existsSync(testFile), '檔案應被 unlink').toBe(false);

    // 清理測試目錄
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('cleanupOldAttachments 應 unlink 失敗時仍刪 DB row (idempotent)', async () => {
    vi.mocked(db.attachment.findMany).mockResolvedValue([
      { id: 'att-2', storagePath: '/nonexistent/file.txt' },
    ] as never);
    vi.mocked(db.attachment.delete).mockResolvedValue({} as never);

    const result = await cleanupOldAttachments();

    // 檔案不存在時, unlink 失敗但 catch 略過, 仍刪 DB row
    expect(result.deleted).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('cleanupOldAttachments 應接受 retentionDaysOverride', async () => {
    vi.mocked(db.attachment.findMany).mockResolvedValue([]);

    await cleanupOldAttachments(30);

    // findMany 的 where 條件 cutoff 應為 30 天前
    const call = vi.mocked(db.attachment.findMany).mock.calls[0];
    expect(call).toBeDefined();
    if (!call || !call[0]) return;
    const whereLt = (call[0].where as { uploadedAt: { lt: Date } }).uploadedAt.lt;
    const now = Date.now();
    const diffDays = (now - whereLt.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });
});