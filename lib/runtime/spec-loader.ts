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

// 記憶體快取
const specCache = new Map<string, JsonSpec>();
let allSpecsCache: Record<string, JsonSpec> | null = null;

/**
 * 載入單一 spec（讀檔 + 解析 + 驗證）
 */
export async function loadSpec(name: string): Promise<JsonSpec> {
  const cached = specCache.get(name);
  if (cached) return cached;

  // 找 spec 檔：blog-spec.json / order-spec.json / event-spec.json / todo-spec.json
  const specPath = path.join(EXTENSIONS_DIR, name, `${name}-spec.json`);
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

  specCache.set(name, spec);
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
  if (allSpecsCache) return allSpecsCache;

  const names = await listAvailableSpecs();
  const entries = await Promise.all(
    names.map(async (name) => [name, await loadSpec(name)] as const),
  );

  allSpecsCache = Object.fromEntries(entries);
  return allSpecsCache;
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
