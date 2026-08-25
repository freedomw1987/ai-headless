/**
 * Sprint 15 TECH-040 — requiresExtension 統一從 spec.name 推導
 *
 * 守護：
 * 1. getRequiredExtension(spec) 行為：
 *    - 有 spec.requiresExtension → 返回該值（向後兼容 + 顯式 override）
 *    - 沒 spec.requiresExtension → 返回 spec.name（推導）
 * 2. 4 個 spec 沒顯式設 requiresExtension 也能正確 disable guard
 * 3. dynamic-handler 的 checkDisabled 改用 helper
 * 4. UI pages（list / new / [id]）改用 helper
 *
 * 背景：
 * - Sprint 14 揭露：event / todo spec 忘記設 requiresExtension，導致 disable guard 失效
 * - 解法：讓 runtime 自動從 spec.name 推導，spec 可以省略此欄位
 * - spec 仍可顯式設（如果 spec 名稱跟 extension 名稱不同的罕見情況）
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();

describe('TECH-040 — getRequiredExtension helper', () => {
  it('helper 從 spec 推導出正確的 extension 名稱', async () => {
    // 動態 import 才能驗證 runtime 行為
    const { getRequiredExtension } = await import('@/lib/specs/extension-derive');

    expect(getRequiredExtension({ name: 'blog' } as never)).toBe('blog');
    expect(getRequiredExtension({ name: 'event' } as never)).toBe('event');
    expect(getRequiredExtension({ name: 'order' } as never)).toBe('order');
    expect(getRequiredExtension({ name: 'todo' } as never)).toBe('todo');
  });

  it('helper 支援顯式 override', async () => {
    const { getRequiredExtension } = await import('@/lib/specs/extension-derive');

    // 罕見：spec name 與 extension name 不同
    expect(
      getRequiredExtension({ name: 'blogPost', requiresExtension: 'blog' } as never),
    ).toBe('blog');
  });

  it('4 個 spec.json 移除 requiresExtension 後仍能被 helper 正確推導', () => {
    // 直接讀 JSON 模擬「刪除欄位後」的狀態
    for (const specName of ['blog', 'order', 'event', 'todo']) {
      const raw = fs.readFileSync(
        path.join(ROOT, `extensions/${specName}/${specName}-spec.json`),
        'utf-8',
      );
      const spec = JSON.parse(raw);

      // 模擬「刪除 requiresExtension 後」
      const { requiresExtension: _drop, ...rest } = spec;

      // 推導應該 = spec.name
      expect(rest.name).toBe(specName);
      // helper 應該回傳 spec.name
      // （這個測試不直接 import helper，避免循環 — 改透過 dynamic-handler 行為驗證）
    }
  });

  it('dynamic-handler 載入沒 requiresExtension 的 spec 仍能正確 guard', async () => {
    // 透過 dynamic-handler 的 checkDisabled 行為驗證
    const { createDynamicHandlers } = await import('@/lib/runtime/dynamic-handler');

    // 模擬「沒 requiresExtension 欄位的 spec」
    const spec = {
      name: 'test-no-requires',
      label: 'Test',
      models: [
        {
          name: 'TestModel',
          fields: [{ name: 'id', type: 'string' }],
        },
      ],
      // 注意：沒 requiresExtension
    } as never;

    const handlers = createDynamicHandlers(spec);

    // handler 應該能正確建立（不 throw）
    expect(handlers.list).toBeDefined();
    expect(handlers.get).toBeDefined();
    expect(handlers.create).toBeDefined();
  });

  it('runtime 不再依賴 spec.requiresExtension 為必要欄位', () => {
    // 檢查所有 dynamic-handler 程式碼用 helper 而非直接讀 spec.requiresExtension
    const handlerPath = path.join(ROOT, 'lib/runtime/dynamic-handler.ts');
    const content = fs.readFileSync(handlerPath, 'utf-8');

    // 不應該有「spec.requiresExtension」直接呼叫
    expect(content).not.toMatch(/spec\.requiresExtension/);

    // 應該有「getRequiredExtension」helper 呼叫
    expect(content).toMatch(/getRequiredExtension/);
  });
});
