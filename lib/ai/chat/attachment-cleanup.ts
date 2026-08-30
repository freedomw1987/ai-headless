/**
 * Sprint 46 Commit 6 (Stage 46-C) — Attachment Cleanup Utility
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §1.2 (Sprint 47+ TODO) + §2.6
 *
 * 設計動機:
 * - 附件永久保留 (FR-1.6 onDelete: NoAction), 但 DB 與磁碟會無限成長
 * - PRD §1.2 「明確排除」: cleanup job 留 Sprint 47+
 * - Sprint 46 提供 cleanup utility 供 Sprint 47+ cron 排程呼叫
 *
 * Sprint 46 scope:
 * - cleanupOldAttachments(): 清理 90 天前的附件 + DB row
 * - retentionDays = 90: PRD 未指定, 暫用 90 天作為安全 default
 * - 軟刪除: 不刪 ChatSession, 只刪附件 row + unlink 檔案
 *
 * Sprint 47+ TODO:
 * - 接 Vercel Cron / node-cron 自動排程
 * - retention policy 可設定 (per-tenant)
 * - 對話歸檔 (archive 取代 hard-delete)
 */

import { unlink } from 'node:fs/promises';
import { db } from '@/lib/db';

/** 預設保留 90 天 */
export const retentionDays = 90;

/**
 * 清理 N 天前的附件
 *
 * 流程:
 * 1. 計算 cutoff 日期 (現在 - retentionDays 天)
 * 2. 查 DB 找 uploadedAt < cutoff 的附件
 * 3. 對每個附件:
 *    - unlink 磁碟檔案 (./uploads/<sessionId>/<uuid>.<ext>)
 *    - delete DB row
 * 4. 回傳清理數量
 *
 * @param retentionDaysOverride - 覆寫預設保留天數 (可選)
 * @returns 清理數量 { deleted: number, failed: number }
 */
export async function cleanupOldAttachments(
  retentionDaysOverride?: number,
): Promise<{ deleted: number; failed: number }> {
  const days = retentionDaysOverride ?? retentionDays;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // 1. 查 90 天前的附件
  const oldAttachments = await db.attachment.findMany({
    where: {
      uploadedAt: { lt: cutoff },
    },
    select: {
      id: true,
      storagePath: true,
    },
  });

  let deleted = 0;
  let failed = 0;

  // 2. 逐個清理
  for (const att of oldAttachments) {
    try {
      // unlink 磁碟檔案 (storagePath 是相對路徑 "uploads/<sessionId>/<uuid>.<ext>")
      await unlink(att.storagePath).catch(() => {
        // 檔案可能已被刪除, 略過 (idempotent)
      });
      // delete DB row
      await db.attachment.delete({
        where: { id: att.id },
      });
      deleted++;
    } catch {
      failed++;
    }
  }

  return { deleted, failed };
}