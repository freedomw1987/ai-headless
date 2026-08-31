/**
 * Sprint 47 Commit 7 (Stage 47-6) — Session Ownership 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.7 (FR-7.1, FR-7.3)
 *
 * 驗證 requireSessionOwnership 三情境:
 * - Session 不存在 → 404
 * - Session 存在但 userId 不符 → 403
 * - Session 存在且 userId 相符 → 通過（無 throw）
 *
 * 安全設計 (Sprint 46 reflection P2):
 * - 防止 user A 透過 body 傳 user B 的 sessionId + attachment ID
 *   拿到 user B 的附件內容注入 LLM prompt
 */

import { describe, it, expect, vi } from 'vitest';

// Mock db: 設在 module 頂層, 避免 vi.resetModules() 導致 instanceof 跨 module 失敗
vi.mock('@/lib/db', () => ({
  db: {
    chatSession: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import {
  requireSessionOwnership,
  SessionOwnershipError,
} from './session-ownership';

describe('S47-6 — requireSessionOwnership (FR-7.1)', () => {
  it('Session 不存在 → 拋 SessionOwnershipError (status 404)', async () => {
    vi.mocked(db.chatSession.findUnique).mockResolvedValueOnce(null as never);

    await expect(
      requireSessionOwnership('missing-session', 'user-A'),
    ).rejects.toThrow(SessionOwnershipError);

    try {
      await requireSessionOwnership('missing-session', 'user-A');
      expect.fail('應拋錯');
    } catch (err) {
      expect(err).toBeInstanceOf(SessionOwnershipError);
      expect((err as InstanceType<typeof SessionOwnershipError>).status).toBe(404);
    }
  });

  it('Session 存在但 userId 不符 → 拋 SessionOwnershipError (status 403)', async () => {
    vi.mocked(db.chatSession.findUnique).mockResolvedValueOnce({
      id: 's1',
      userId: 'user-B',
    } as never);

    try {
      await requireSessionOwnership('s1', 'user-A');
      expect.fail('應拋錯');
    } catch (err) {
      expect(err).toBeInstanceOf(SessionOwnershipError);
      expect((err as InstanceType<typeof SessionOwnershipError>).status).toBe(403);
      expect((err as Error).message).toMatch(/does not belong/i);
    }
  });

  it('Session 存在且 userId 相符 → 不拋錯', async () => {
    vi.mocked(db.chatSession.findUnique).mockResolvedValueOnce({
      id: 's1',
      userId: 'user-A',
    } as never);

    await expect(
      requireSessionOwnership('s1', 'user-A'),
    ).resolves.toBeUndefined();
  });
});