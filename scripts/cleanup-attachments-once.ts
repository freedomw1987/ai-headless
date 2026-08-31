/**
 * pnpm cleanup:once — 本機手動觸發 attachment cleanup
 *
 * Sprint 47 Commit 6 (Stage 47-5) — Cleanup Cron (FR-6.3)
 *
 * 用法:
 *   pnpm cleanup:once
 *
 * 環境:
 *   - 本機讀取 .env / .env.local 的 CRON_SECRET (可不設, 走本地路徑)
 *   - 直接呼叫 cleanupOldAttachments() 不經 HTTP route
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.6 (FR-6.3)
 */

import { cleanupOldAttachments } from '../lib/ai/chat/attachment-cleanup';

async function main() {
  console.log('[cleanup:once] 開始清理舊附件...');
  const start = Date.now();

  try {
    const result = await cleanupOldAttachments();
    const elapsed = Date.now() - start;
    console.log(
      `[cleanup:once] 完成: deleted=${result.deleted}, failed=${result.failed} (耗時 ${elapsed}ms)`,
    );
    process.exit(0);
  } catch (err) {
    console.error('[cleanup:once] 失敗:', err);
    process.exit(1);
  }
}

main();