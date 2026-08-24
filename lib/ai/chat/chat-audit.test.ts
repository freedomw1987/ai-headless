/**
 * TDD Gate 1 — TD-502 Chat Audit Log
 *
 * 涵蓋：
 * 1. logChatEvent 推入 in-memory + 印 console.info
 * 2. getAuditLog 取得所有紀錄
 * 3. resetAuditLog 清空（測試用）
 * 4. 事件結構包含 userId/action/timestamp
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logChatEvent,
  getAuditLog,
  resetAuditLog,
} from './chat-audit';

describe('TD-502 chat-audit', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetAuditLog();
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logChatEvent 推入 in-memory 並回傳新長度', () => {
    const length = logChatEvent({
      userId: 'user-1',
      action: 'chat.start',
    });

    expect(length).toBe(1);
    expect(getAuditLog()).toHaveLength(1);
  });

  it('getAuditLog 回傳的紀錄包含 userId/action/timestamp', () => {
    const before = Date.now();
    logChatEvent({ userId: 'user-2', action: 'chat.success' });
    const after = Date.now();

    const events = getAuditLog();
    expect(events).toHaveLength(1);
    const event = events[0]!;
    expect(event.userId).toBe('user-2');
    expect(event.action).toBe('chat.success');
    expect(event.timestamp).toBeGreaterThanOrEqual(before);
    expect(event.timestamp).toBeLessThanOrEqual(after);
  });

  it('多次 logChatEvent 累加，順序為 push 順序', () => {
    logChatEvent({ userId: 'u1', action: 'chat.start' });
    logChatEvent({ userId: 'u2', action: 'chat.error' });
    logChatEvent({ userId: 'u3', action: 'chat.rate_limited' });

    const events = getAuditLog();
    expect(events.map((e) => e.userId)).toEqual(['u1', 'u2', 'u3']);
    expect(events.map((e) => e.action)).toEqual([
      'chat.start',
      'chat.error',
      'chat.rate_limited',
    ]);
  });

  it('logChatEvent 同步呼叫 console.info', () => {
    logChatEvent({ userId: 'u1', action: 'chat.unauthorized' });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    // console.info(prefix, event) — 第一個 arg 是 prefix string，第二個才是 event
    expect(consoleSpy).toHaveBeenCalledWith(
      '[chat-audit]',
      expect.objectContaining({
        userId: 'u1',
        action: 'chat.unauthorized',
      }),
    );
    const [, eventArg] = consoleSpy.mock.calls[0]!;
    expect(typeof (eventArg as { timestamp: number }).timestamp).toBe('number');
  });

  it('resetAuditLog 清空紀錄', () => {
    logChatEvent({ userId: 'u1', action: 'chat.start' });
    expect(getAuditLog()).toHaveLength(1);

    resetAuditLog();

    expect(getAuditLog()).toHaveLength(0);
  });

  it('支援 metadata 欄位', () => {
    logChatEvent({
      userId: 'u1',
      action: 'chat.error',
      metadata: { errorMessage: 'boom', statusCode: 500 },
    });

    const events = getAuditLog();
    const event = events[0]!;
    expect(event.metadata).toEqual({
      errorMessage: 'boom',
      statusCode: 500,
    });
  });
});
