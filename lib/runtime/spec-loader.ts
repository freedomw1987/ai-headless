// Sprint 14 TECH-031 — Runtime Spec Loader
//
// 啟動時一次載入所有 extension 的 JSON spec，記憶體快取。
// 改 JSON 需重啟 server（或手動 invalidateSpecCache）。
//
// Why not hot reload：spec 改變通常也要改 Prisma schema，
// 而 Prisma 是 build-time，hot reload 沒意義。

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

const PROJECT_ROOT = process.cwd();
const EXTENSIONS_DIR = path.join(PROJECT_ROOT, 'extensions');

// 記憶體快取（含 mtime 以支援自動 invalidation）
// TD-901: 用 file mtime 比對 cache，避免改了 spec 檔卻看到舊資料
type CacheEntry = { spec: JsonSpec; mtime: number };
const specCache = new Map<string, CacheEntry>();
let allSpecsCache: { entries: Record<string, JsonSpec>; mtime: Record<string, number> } | null = null;

/**
 * 載入單一 spec（讀檔 + 解析 + 驗證）
 */
export async function loadSpec(name: string): Promise<JsonSpec> {
  // 找 spec 檔：blog-spec.json / order-spec.json / event-spec.json / todo-spec.json
  const specPath = path.join(EXTENSIONS_DIR, name, `${name}-spec.json`);

  // TD-901: cache hit 但 spec 檔已被改 → invalidate 並重讀
  let currentMtime: number | null = null;
  try {
    const stat = await import('node:fs/promises').then((m) => m.stat(specPath));
    currentMtime = stat.mtimeMs;
  } catch {
    // spec 檔不存在，後面 readFile 會丟 ENOENT
  }

  const cached = specCache.get(name);
  if (cached && currentMtime !== null && cached.mtime === currentMtime) {
    return cached.spec;
  }

  let raw: string;
  try {
    raw = await readFile(specPath, 'utf-8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Spec "${name}" not found at ${specPath}`);
    }
    throw e;
  }
  const spec = JSON.parse(raw) as JsonSpec;
  if (currentMtime !== null) {
    specCache.set(name, { spec, mtime: currentMtime });
  } else {
    specCache.set(name, { spec, mtime: 0 });
  }
  return spec;
}

/**
 * 列出所有有 spec 的 extension 名稱
 */
export async function listAvailableSpecs(): Promise<string[]> {
  const entries = await readdir(EXTENSIONS_DIR, { withFileTypes: true });
  const names: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const specPath = path.join(EXTENSIONS_DIR, entry.name, `${entry.name}-spec.json`);
    try {
      await readFile(specPath);
      names.push(entry.name);
    } catch {
      // 沒 spec.json 的目錄跳過
    }
  }

  return names.sort();
}

/**
 * 一次載入全部 spec，回傳 { name: spec } 物件
 *
 * 第二次呼叫走快取，回傳同一個 reference
 */
export async function loadAllSpecs(): Promise<Record<string, JsonSpec>> {
  if (allSpecsCache) return allSpecsCache.entries;

  const names = await listAvailableSpecs();
  const entries = await Promise.all(
    names.map(async (name) => [name, await loadSpec(name)] as const),
  );
  // TD-901: 記 mtime 方便 invalidate
  const mtimes: Record<string, number> = {};
  for (const [name, entry] of specCache.entries()) {
    mtimes[name] = entry.mtime;
  }
  allSpecsCache = { entries: Object.fromEntries(entries), mtime: mtimes };
  return allSpecsCache.entries;
}

/**
 * 清空快取（測試或 hot reload 用）
 */
export function invalidateSpecCache(): void {
  specCache.clear();
  allSpecsCache = null;
}// Sprint 35 reload trigger
// Sprint 38 reload trigger Sun Aug 30 17:08:30 CST 2026
// Sprint 39 reload 1788082192
// Sprint 39 reload 1788082388
// Sprint 39 force cache clear 1788082570
// Sprint 39 final reload 1788082673
