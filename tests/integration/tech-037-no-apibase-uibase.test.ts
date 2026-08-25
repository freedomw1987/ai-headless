/**
 * Sprint 15 TECH-037 — 完全移除 apiBase / uiBase
 *
 * 守護：
 * 1. JsonSpec 型別不再有 apiBase / uiBase 欄位
 * 2. 4 個 spec.json 不含 apiBase / uiBase（runtime 之前已忽略，現在型別也移除）
 * 3. 沒有任何 runtime 程式碼讀取 apiBase / uiBase
 *
 * 背景：
 * - Sprint 10 引入 apiBase / uiBase 讓 spec 自訂路由
 * - Sprint 14 統一走 dynamic route（/api/crud/<spec> + /admin/crud/<spec>）
 * - Sprint 14 Phase 2 標 @deprecated，runtime 已忽略
 * - Sprint 15 TECH-037 完全刪除
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();

describe('TECH-037 — 移除 apiBase / uiBase', () => {
  it('JsonSpec 型別不再包含 apiBase 欄位', () => {
    const typesPath = path.join(ROOT, 'lib/specs/json-spec.types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');

    // 沒有 "apiBase?:" 型別宣告
    expect(content).not.toMatch(/apiBase\s*\?\s*:/);
    // 沒有 "apiBase:" 非 optional 宣告
    expect(content).not.toMatch(/^\s*apiBase\s*:/m);
  });

  it('JsonSpec 型別不再包含 uiBase 欄位', () => {
    const typesPath = path.join(ROOT, 'lib/specs/json-spec.types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');

    expect(content).not.toMatch(/uiBase\s*\?\s*:/);
    expect(content).not.toMatch(/^\s*uiBase\s*:/m);
  });

  it('4 個 spec.json 不含 apiBase / uiBase', () => {
    for (const specName of ['blog', 'order', 'event', 'todo']) {
      const raw = fs.readFileSync(
        path.join(ROOT, `extensions/${specName}/${specName}-spec.json`),
        'utf-8',
      );
      const spec = JSON.parse(raw);

      expect(
        'apiBase' in spec,
        `${specName}-spec.json 不應有 apiBase 鍵`,
      ).toBe(false);
      expect(
        'uiBase' in spec,
        `${specName}-spec.json 不應有 uiBase 鍵`,
      ).toBe(false);
    }
  });

  it('runtime 程式碼不讀取 apiBase / uiBase', () => {
    const libRuntime = path.join(ROOT, 'lib/runtime');
    const files = fs.readdirSync(libRuntime, { recursive: true }).filter((f) =>
      f.toString().endsWith('.ts'),
    );

    for (const file of files) {
      const filePath = path.join(libRuntime, file.toString());
      const content = fs.readFileSync(filePath, 'utf-8');

      expect(
        content.includes('apiBase') || content.includes('uiBase'),
        `${file} 不應再引用 apiBase / uiBase`,
      ).toBe(false);
    }
  });
});
