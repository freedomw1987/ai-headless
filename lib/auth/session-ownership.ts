/**
 * Sprint 47 Commit 7 (Stage 47-6) — Session Ownership Guard
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.7 (FR-7.1, FR-7.2, FR-7.3)
 *
 * 用途:
 * - 驗證 body 傳入的 sessionId 是否屬於當前 user
 * - 防止 user A 透過 body 傳 user B 的 sessionId + attachment ID
 *   取得 user B 的附件內容注入 LLM prompt (Sprint 46 reflection P2 風險)
 *
 * 用法 (在 route handler 內):
 *   try {
 *     await requireSessionOwnership(sessionId, user.id);
 *   } catch (err) {
 *     if (err instanceof SessionOwnershipError) {
 *       return NextResponse.json({ error: err.message }, { status: err.status });
 *     }
 *     throw err;
 *   }
 */

import { db } from '@/lib/db';

/**
 * Session Ownership 專用錯誤類別
 *
 * 設計理由:
 * - status 404/403 明確區分「不存在」vs「不屬於你」
 *   - 404: 避免洩漏 session 是否存在（安全考量：但仍透露 chat session 數量, 取 trade-off）
 *   - 403: 明確告知呼叫者 session 不屬於他
 * - 配合 route handler 直接回傳 status code
 */
export class SessionOwnershipError extends Error {
  readonly status: 403 | 404;
  constructor(status: 403 | 404, message: string) {
    super(message);
    this.name = 'SessionOwnershipError';
    this.status = status;
  }
}

/**
 * 驗證 session 是否屬於指定 user
 *
 * @param sessionId - 從 body 拿到的 chat session ID
 * @param userId - 從 requireUser() 拿到的 user ID
 * @throws SessionOwnershipError 404 若 session 不存在
 * @throws SessionOwnershipError 403 若 session 存在但 userId 不符
 */
export async function requireSessionOwnership(
  sessionId: string,
  userId: string,
): Promise<void> {
  const session = await db.chatSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session) {
    throw new SessionOwnershipError(404, 'Session not found');
  }

  if (session.userId !== userId) {
    throw new SessionOwnershipError(
      403,
      'Session does not belong to current user',
    );
  }
}