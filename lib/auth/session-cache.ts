/**
 * ==============================================
 *  Session Permission Cache (Sprint 21)
 * ==============================================
 *
 * 對應 PRD：docs/prd/09-rbac.md §12.3 Q5
 *
 * in-memory Map<userId, CacheEntry> + TTL
 * - TTL：60 秒（平衡 UX 與性能）
 * - Process 重啟自動清空
 * - Phase 2 RBAC 的 hasDynamicPermission 共用此快取
 *
 * 用法：
 *   const cached = getCachedPermissions(userId);
 *   if (cached) return cached.permissions.has(code);
 *
 *   setCachedPermissions(userId, new Set(['users:read']));
 *
 *   invalidateCache(userId);  // 管理員改權限後強制失效
 *   invalidateAllCache();    // 維護時全清
 */

export type CachedPermissions = {
  permissions: Set<string>;
  roleId: string;
  expiresAt: number;
};

const CACHE_TTL_MS = 60 * 1000; // 60 秒（Q5 決議）
const cache = new Map<string, CachedPermissions>();

export function getCachedPermissions(userId: string): CachedPermissions | null {
  const entry = cache.get(userId);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(userId);
    return null;
  }

  return entry;
}

export function setCachedPermissions(
  userId: string,
  permissions: Set<string>,
  roleId: string,
): void {
  cache.set(userId, {
    permissions,
    roleId,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function invalidateCache(userId: string): void {
  cache.delete(userId);
}

export function invalidateAllCache(): void {
  cache.clear();
}

export function getCacheStats(): { size: number; ttlMs: number } {
  return {
    size: cache.size,
    ttlMs: CACHE_TTL_MS,
  };
}