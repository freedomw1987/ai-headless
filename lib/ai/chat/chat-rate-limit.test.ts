/**
 * TDD Gate 1 — TD-502 Chat Rate Limit (unit)
 *
 * 涵蓋：
 * 1. 首次請求 → allowed=true, remaining=limit-1
 * 2. 累加到 limit → allowed=true, remaining=0
 * 3. 超過 limit → allowed=false, remaining=0
 * 4. 不同 key 互不影響
 * 5. 時間窗過期 → 新 bucket 重置
 * 6. resetChatRateLimit 清空所有 bucket
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkChatRateLimit,
  resetChatRateLimit,
} from './chat-rate-limit';

describe('TD-502 chat-rate-limit', () => {
  beforeEach(() => {
    resetChatRateLimit();
  });

  it('首次請求 → allowed=true, remaining=limit-1', () => {
    const result = checkChatRateLimit('user-1', {
      limit: 20,
      windowMs: 60_000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('累加到第 limit 次 → allowed=true, remaining=0', () => {
    for (let i = 0; i < 19; i++) {
      checkChatRateLimit('user-1', { limit: 20, windowMs: 60_000 });
    }
    const result = checkChatRateLimit('user-1', {
      limit: 20,
      windowMs: 60_000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('超過 limit → allowed=false, remaining=0', () => {
    for (let i = 0; i < 20; i++) {
      checkChatRateLimit('user-1', { limit: 20, windowMs: 60_000 });
    }
    const result = checkChatRateLimit('user-1', {
      limit: 20,
      windowMs: 60_000,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    // resetAt 應在未來
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('不同 key 互不影響', () => {
    for (let i = 0; i < 20; i++) {
      checkChatRateLimit('user-1', { limit: 20, windowMs: 60_000 });
    }
    const user1 = checkChatRateLimit('user-1', {
      limit: 20,
      windowMs: 60_000,
    });
    const user2 = checkChatRateLimit('user-2', {
      limit: 20,
      windowMs: 60_000,
    });

    expect(user1.allowed).toBe(false);
    expect(user2.allowed).toBe(true);
    expect(user2.remaining).toBe(19);
  });

  it('時間窗過期 → 新 bucket 重置', () => {
    // 第一次用 100ms window
    const shortWindow = { limit: 2, windowMs: 100 };

    checkChatRateLimit('user-1', shortWindow);
    checkChatRateLimit('user-1', shortWindow);
    const blocked = checkChatRateLimit('user-1', shortWindow);
    expect(blocked.allowed).toBe(false);

    // 等視窗過期
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const reset = checkChatRateLimit('user-1', shortWindow);
        expect(reset.allowed).toBe(true);
        expect(reset.remaining).toBe(1);
        resolve();
      }, 150);
    });
  });

  it('resetChatRateLimit 清空所有 bucket', () => {
    checkChatRateLimit('user-1', { limit: 1, windowMs: 60_000 });
    checkChatRateLimit('user-1', { limit: 1, windowMs: 60_000 });

    resetChatRateLimit();

    const result = checkChatRateLimit('user-1', {
      limit: 1,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });
});