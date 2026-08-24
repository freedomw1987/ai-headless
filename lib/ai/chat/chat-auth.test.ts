/**
 * TDD Gate 1 — S5.1 TD-502 AI API Auth + Rate Limit
 *
 * 涵蓋：
 * 1. 未登入 → 401
 * 2. 已登入 → 通過
 * 3. 超過 rate limit → 429
 * 4. Rate limit 重置
 * 5. Rate limit 支援 user-id 或 IP key
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatAuthError } from '@/lib/ai/chat/chat-auth';
import {
  checkChatRateLimit,
  resetChatRateLimit,
} from '@/lib/ai/chat/chat-rate-limit';

// Mock Auth.js
vi.mock('@/lib/auth/auth', () => ({
  getCurrentUser: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/auth';
const mockGetCurrentUser = vi.mocked(getCurrentUser);

describe('S5.1 TD-502 chatAuth', () => {
  beforeEach(() => {
    mockGetCurrentUser.mockReset();
  });

  it('未登入拋 ChatAuthError（401）', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const { requireChatAuth } = await import('@/lib/ai/chat/chat-auth');

    await expect(requireChatAuth()).rejects.toThrow(ChatAuthError);

    try {
      await requireChatAuth();
    } catch (err) {
      expect(err).toBeInstanceOf(ChatAuthError);
      expect((err as ChatAuthError).statusCode).toBe(401);
    }
  });

  it('已登入返回 user', async () => {
    const fakeUser = { id: 'user-1', role: 'admin' };
    mockGetCurrentUser.mockResolvedValueOnce(fakeUser as never);

    const { requireChatAuth } = await import('@/lib/ai/chat/chat-auth');

    const user = await requireChatAuth();
    expect(user.id).toBe('user-1');
  });

  it('user 缺少 id 拋 401', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ id: '' } as never);

    const { requireChatAuth } = await import('@/lib/ai/chat/chat-auth');

    await expect(requireChatAuth()).rejects.toThrow(ChatAuthError);
  });
});

describe('S5.1 TD-502 chatRateLimit', () => {
  beforeEach(() => {
    resetChatRateLimit();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('首次請求允許', () => {
    const result = checkChatRateLimit('user-1', { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('達到上限拒絕', () => {
    checkChatRateLimit('user-1', { limit: 3, windowMs: 60_000 });
    checkChatRateLimit('user-1', { limit: 3, windowMs: 60_000 });
    checkChatRateLimit('user-1', { limit: 3, windowMs: 60_000 });

    const result = checkChatRateLimit('user-1', { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('過了時間窗重置', () => {
    checkChatRateLimit('user-1', { limit: 1, windowMs: 60_000 });

    vi.advanceTimersByTime(61_000);

    const result = checkChatRateLimit('user-1', { limit: 1, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
  });

  it('不同 key 獨立計數', () => {
    checkChatRateLimit('user-1', { limit: 1, windowMs: 60_000 });
    const result = checkChatRateLimit('user-2', { limit: 1, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
  });

  it('返回重置時間', () => {
    const before = Date.now();
    checkChatRateLimit('user-1', { limit: 1, windowMs: 60_000 });
    const result = checkChatRateLimit('user-1', { limit: 1, windowMs: 60_000 });
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 60_000);
  });
});