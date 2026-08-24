/**
 * Stream Controller — TD-503
 *
 * 管理 SSE 串流的 abort 狀態：
 * - createStreamController(id) 建立 controller 並回傳 AbortController-like 物件
 * - abortStream(id) 觸發 abort
 * - isStreamAborted(id) 檢查狀態
 * - getActiveStreamCount() 統計活躍數量
 *
 * 用於場景：
 * - 用戶切換到新對話 → abort 舊的
 * - 組件 unmount → abort fetch
 * - 重新發送訊息 → abort 上一輪
 */

const controllers = new Map<string, AbortController>();

export type StreamController = {
  id: string;
  signal: AbortSignal;
};

export function createStreamController(id: string): StreamController {
  // 如果已有同 id，先 abort 舊的（便於重複 id 重用）
  const existing = controllers.get(id);
  if (existing) {
    existing.abort();
  }

  const ac = new AbortController();
  controllers.set(id, ac);

  return {
    id,
    signal: ac.signal,
  };
}

export function abortStream(id: string): void {
  const ac = controllers.get(id);
  if (ac && !ac.signal.aborted) {
    ac.abort();
  }
}

export function isStreamAborted(id: string): boolean {
  const ac = controllers.get(id);
  return ac?.signal.aborted ?? false;
}

export function getActiveStreamCount(): number {
  return controllers.size;
}

export function clearAllStreams(): void {
  for (const [, ac] of controllers) {
    if (!ac.signal.aborted) {
      ac.abort();
    }
  }
  controllers.clear();
}