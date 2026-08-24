/**
 * TDD Gate 1 — S5.2 TD-503 SSE Abort 機制
 *
 * 涵蓋：
 * 1. 建立 controller
 * 2. abort 後讀取應該拋錯
 * 3. 多個 controller 互不影響
 * 4. cleanup 釋放資源
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createStreamController,
  abortStream,
  isStreamAborted,
  getActiveStreamCount,
  clearAllStreams,
} from './stream-controller';

describe('S5.2 TD-503 StreamController', () => {
  beforeEach(() => {
    // 確保每個測試乾淨
    clearAllStreams();
  });

  it('建立 controller 並註冊', () => {
    const ctrl = createStreamController('stream-1');
    expect(ctrl).toBeDefined();
    expect(ctrl.id).toBe('stream-1');
    expect(getActiveStreamCount()).toBe(1);
  });

  it('abort 後狀態變為 aborted', () => {
    createStreamController('stream-2');
    abortStream('stream-2');
    expect(isStreamAborted('stream-2')).toBe(true);
  });

  it('controller.signal 在 abort 後拋 AbortError', () => {
    const controller = createStreamController('stream-3');
    const onAbort = vi.fn();
    controller.signal.addEventListener('abort', onAbort);

    abortStream('stream-3');

    expect(controller.signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalled();
  });

  it('多個 controller 互不影響', () => {
    createStreamController('a');
    const bController = createStreamController('b');

    abortStream('a');

    expect(isStreamAborted('a')).toBe(true);
    expect(isStreamAborted('b')).toBe(false);
    expect(bController.signal.aborted).toBe(false);
  });

  it('不存在的 stream id abort 不拋錯', () => {
    expect(() => abortStream('nonexistent')).not.toThrow();
  });

  it('重複 abort 不會 double-fire', () => {
    const ctrl = createStreamController('repeat');
    const onAbort = vi.fn();
    ctrl.signal.addEventListener('abort', onAbort);

    abortStream('repeat');
    abortStream('repeat');

    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  describe('clearAllStreams', () => {
    it('清空所有 active controllers，count 變 0', () => {
      createStreamController('c1');
      createStreamController('c2');
      createStreamController('c3');
      expect(getActiveStreamCount()).toBe(3);

      clearAllStreams();

      expect(getActiveStreamCount()).toBe(0);
    });

    it('對所有 controller 觸發 abort signal', () => {
      const c1 = createStreamController('a1');
      const c2 = createStreamController('a2');
      const onAbort1 = vi.fn();
      const onAbort2 = vi.fn();
      c1.signal.addEventListener('abort', onAbort1);
      c2.signal.addEventListener('abort', onAbort2);

      clearAllStreams();

      expect(c1.signal.aborted).toBe(true);
      expect(c2.signal.aborted).toBe(true);
      expect(onAbort1).toHaveBeenCalledTimes(1);
      expect(onAbort2).toHaveBeenCalledTimes(1);
    });

    it('Map 已空時呼叫不拋錯', () => {
      expect(getActiveStreamCount()).toBe(0);
      expect(() => clearAllStreams()).not.toThrow();
      expect(getActiveStreamCount()).toBe(0);
    });
  });
});