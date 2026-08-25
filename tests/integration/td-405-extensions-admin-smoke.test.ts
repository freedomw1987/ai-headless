/**
 * TD-405 Smoke Test — /admin/extensions 修復驗證
 *
 * 背景：lib/extensions/extension-manager.ts 的 listInstalledExtensions() 是 async，
 * 但 app/api/extensions/route.ts 原本漏了 await，導致 data 變成 Promise 物件、
 * JSON 序列化後變 {}，前端 .filter() 在 line 75 崩潰。
 *
 * 本測試在 dev server 啟動後跑（pnpm dev），驗證修復結果：
 * - Gate A: /api/extensions 回傳陣列（不是 Promise 序列化後的 {}）
 * - Gate B: 3 個 extensions 都在（blog + todo + event）
 * - Gate C: 每個有 isEnabled 布林（filesystem + Prisma join 結果）
 * - Gate D: 模擬 client component 的 .filter() 邏輯（修前會炸）
 *
 * 跑法：先 `pnpm dev`，另開 terminal 跑 `pnpm test td-405-extensions-admin-smoke`
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';

describe('TD-405 /admin/extensions smoke', () => {
  let json: { status: number; data: unknown };

  beforeAll(async () => {
    const res = await fetch(`${BASE_URL}/api/extensions`);
    expect(res.status).toBe(200);
    json = await res.json();
  });

  it('Gate A: data 是陣列，不是 Promise 序列化後的 {}', () => {
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('Gate B: 4 個 extensions 都在（filesystem 掃描正確）', () => {
    // Sprint 11 補完：Order 也有 manifest.json，加入掃描
    const names = new Set(
      (json.data as { name: string }[]).map((e) => e.name),
    );
    expect(names.size).toBe(4);
    for (const expected of ['blog', 'todo', 'event', 'order']) {
      expect(names.has(expected)).toBe(true);
    }
  });

  it('Gate C: 每個 extension 有 isEnabled 布林（Prisma join 成功）', () => {
    const data = json.data as { isEnabled: unknown }[];
    expect(data.length).toBeGreaterThan(0);
    expect(data.every((e) => typeof e.isEnabled === 'boolean')).toBe(true);
  });

  it('Gate D: 模擬 client component 的 .filter() 邏輯（修前會炸）', () => {
    const extensions = json.data as { isEnabled: boolean }[];
    // 這是 extensions-page-client.tsx:74-76 的計算
    const total = extensions.length;
    const enabled = extensions.filter((e) => e.isEnabled).length;
    const disabled = extensions.filter((e) => !e.isEnabled).length;
    expect(total).toBe(enabled + disabled);
    expect(typeof total).toBe('number');
  });
});