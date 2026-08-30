/**
 * Sprint 46 Commit 6 (Stage 46-C) — Attachment Cleanup Job
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §2.6 + §1.2 (Sprint 47+ TODO)
 *
 * 設計動機:
 * - Sprint 46 附件永久保留 (FR-1.6 onDelete: NoAction)
 * - PRD §1.2 「明確排除」: cleanup job 留 Sprint 47+
 * - 但 PRD §2.6 FR-2.6 提到「Token 預估: 超過 50K tokens 警告 user」
 *
 * Sprint 46 scope down (Sprint 47+ 完整做):
 * - 提供 cleanup utility function (可被 cron / scheduled task 呼叫)
 * - 預設保留 90 天 (PRD 沒指定, 暫用 90 天作為安全 default)
 * - cleanup 走 soft-delete + unlink file (not hard-delete)
 *
 * Sprint 47+ TODO:
 * - 接 Vercel Cron / node-cron 自動排程
 * - 對話歸檔 (archive 取代 hard-delete)
 * - retention policy 可設定 (per-tenant)
 *
 * 守護測試範圍:
 * - A. 新檔案存在性
 * - B. export 必要函式
 * - C. cleanup 邏輯 (刪除 90 天前附件, 保留最近)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('Sprint 46 Commit 6 — Attachment Cleanup', () => {
  // ============== A. 新檔案存在性 ==============

  it('應建立 lib/ai/chat/attachment-cleanup.ts', () => {
    expect(
      existsSync('lib/ai/chat/attachment-cleanup.ts'),
      '應建立 lib/ai/chat/attachment-cleanup.ts (cleanup utility)',
    ).toBe(true);
  });

  // ============== B. export 必要函式 ==============

  it('應 export cleanupOldAttachments 函式', () => {
    const source = readSource();
    expect(source, '應 export cleanupOldAttachments').toMatch(
      /export\s+(async\s+)?function\s+cleanupOldAttachments|export\s+const\s+cleanupOldAttachments/,
    );
  });

  it('應 export retentionDays 常數 (預設 90)', () => {
    const source = readSource();
    expect(source, '應 export retentionDays = 90').toMatch(
      /export\s+(const|let)\s+retentionDays\s*=\s*90/,
    );
  });

  // ============== C. cleanup 邏輯 ==============

  it('cleanup 應查 DB 找 90 天前的附件 (uploadedAt < cutoff)', () => {
    const source = readSource();
    // 期待有 Prisma where + uploadedAt lt cutoff 邏輯
    expect(source, '應查 uploadedAt').toMatch(/uploadedAt/);
    expect(source, '應比較 cutoff 日期').toMatch(/lt\s*:|lt\s*\(/);
  });

  it('cleanup 應 unlink 磁碟檔案', () => {
    const source = readSource();
    // 期待有 unlink / fs operation
    expect(source, '應 unlink 檔案').toMatch(/unlink/);
  });

  it('cleanup 應 delete DB row', () => {
    const source = readSource();
    // 期待有 attachment.delete 或 attachment.deleteMany
    expect(source, '應 delete DB row').toMatch(/attachment\.(delete|deleteMany)/);
  });
});

function readSource(): string {
  return readFileSync('lib/ai/chat/attachment-cleanup.ts', 'utf-8');
}