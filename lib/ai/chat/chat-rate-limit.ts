/**
 * Chat Rate Limit — TD-502
 *
 * 簡單 in-memory rate limit（單實例）。
 * 生產環境應改用 Redis 或 KV，但單實例下 in-memory 已足夠。
 */

export type RateLimitOptions = {
  /** 時間窗內允許的最大請求數 */
  limit: number;
  /** 時間窗長度（ms） */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * 檢查並累加 rate limit。
 * 同一 key 在時間窗內超過 limit 會返回 allowed=false。
 */
export function checkChatRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  // 過期或不存在 → 新 bucket
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetAt,
    };
  }

  // 累加
  existing.count += 1;

  if (existing.count > options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * 重置所有 rate limit buckets（測試用）。
 */
export function resetChatRateLimit(): void {
  buckets.clear();
}