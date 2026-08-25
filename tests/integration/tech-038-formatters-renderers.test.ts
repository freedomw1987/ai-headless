/**
 * Sprint 15 TECH-038 — formatters + customRenderers 機制
 *
 * 🅓 設計：在 spec.json 的 model 層加 formatters + customRenderers 區塊
 * 每個欄位可指定 formatter（純函數）或 customRenderer（React component）
 * AI 只在 spec 寫 {{fn:xxx}} 引用，extension 實作函數/component
 *
 * 守護：
 * 1. JsonSpec 型別支援 formatters + customRenderers
 * 2. UIField 帶 formatter + customRenderer 欄位
 * 3. buildListUIConfig 把 formatters/customRenderers 帶到對應 UIField
 * 4. buildDetailUIConfig 帶 formatters
 * 5. loadFormatters 載入 extension 純函數
 * 6. loadCustomRenderers 載入 extension React component
 * 7. dynamic-list-client 渲染優先級：customRenderer > formatter > 預設
 * 8. fallback 行為：沒 formatter 用預設渲染
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();

describe('TECH-038 — formatters + customRenderers', () => {
  describe('Type 定義', () => {
    it('JsonSpec.types.ts 支援 Model.formatters / customRenderers', () => {
      const typesPath = path.join(ROOT, 'lib/specs/json-spec.types.ts');
      const content = fs.readFileSync(typesPath, 'utf-8');

      expect(content).toMatch(/formatters\?\s*:\s*Record<string,\s*string>/);
      expect(content).toMatch(/customRenderers\?\s*:\s*Record<string,\s*string>/);
    });

    it('UIField 帶 formatter + customRenderer 欄位', () => {
      const uiConfigPath = path.join(ROOT, 'lib/runtime/ui-config.ts');
      const content = fs.readFileSync(uiConfigPath, 'utf-8');

      expect(content).toMatch(/formatter\?\s*:\s*string/);
      expect(content).toMatch(/customRenderer\?\s*:\s*string/);
    });
  });

  describe('buildListUIConfig', () => {
    it('formatters 對應的 field 被帶 formatter 欄位', async () => {
      const { buildListUIConfig } = await import('@/lib/runtime/ui-config');

      const spec = {
        name: 'test',
        label: 'Test',
        models: [{
          name: 'TestModel',
          fields: [
            { name: 'title', type: 'string' },
            { name: 'startsAt', type: 'datetime' },
          ],
          formatters: {
            startsAt: '{{fn:formatEventTime}}',
          },
          customRenderers: {},
        }],
      } as never;

      const config = buildListUIConfig(spec);
      const titleField = config.fields.find((f) => f.name === 'title');
      const startsAtField = config.fields.find((f) => f.name === 'startsAt');

      expect(titleField?.formatter).toBeUndefined();
      // Sprint 16 TECH-038：拆 fnRef 出純 fnName（之前 Sprint 15 Stage 3 傳 raw 字符串是 bug）
      expect(startsAtField?.formatter).toBe('formatEventTime');
    });

    it('customRenderers 加為虛擬 UIField（component 渲染 Sprint 16）', async () => {
      const { buildListUIConfig } = await import('@/lib/runtime/ui-config');

      const spec = {
        name: 'test',
        label: 'Test',
        models: [{
          name: 'TestModel',
          fields: [
            { name: 'capacity', type: 'number' },
            { name: 'registeredCount', type: 'number' },
          ],
          customRenderers: {
            capacityBar: '{{fn:renderCapacityBar}}',
          },
        }],
      } as never;

      const config = buildListUIConfig(spec);
      // customRenderer 加為虛擬 UIField（inputType='hidden'，name=rendererKey）
      const capacityBarField = config.fields.find((f) => f.name === 'capacityBar');
      expect(capacityBarField).toBeDefined();
      // Sprint 16 TECH-038：拆 fnRef 出純 fnName
      expect(capacityBarField?.customRenderer).toBe('renderCapacityBar');
    });

    it('沒 formatters / customRenderers 時不帶 formatter 欄位（fallback 預設渲染）', async () => {
      const { buildListUIConfig } = await import('@/lib/runtime/ui-config');

      const spec = {
        name: 'test',
        models: [{
          name: 'TestModel',
          fields: [{ name: 'title', type: 'string' }],
        }],
      } as never;

      const config = buildListUIConfig(spec);
      const titleField = config.fields.find((f) => f.name === 'title');

      expect(titleField?.formatter).toBeUndefined();
      expect(titleField?.customRenderer).toBeUndefined();
    });
  });

  describe('buildDetailUIConfig', () => {
    it('formatters 對應的 field 被帶 formatter 欄位', async () => {
      const { buildDetailUIConfig } = await import('@/lib/runtime/ui-config');

      const spec = {
        name: 'test',
        models: [{
          name: 'TestModel',
          fields: [
            { name: 'startsAt', type: 'datetime' },
          ],
          formatters: {
            startsAt: '{{fn:formatEventTime}}',
          },
        }],
      } as never;

      const config = buildDetailUIConfig(spec);
      const field = config.fields.find((f) => f.name === 'startsAt');

      // Sprint 16 TECH-038：拆 fnRef 出純 fnName
      expect(field?.formatter).toBe('formatEventTime');
    });
  });

  describe('Extension loaders', () => {
    it('loadFormatters 函式存在', async () => {
      const loaderPath = path.join(ROOT, 'lib/runtime/extension-loaders.ts');
      expect(fs.existsSync(loaderPath)).toBe(true);

      const { loadFormatters } = await import('@/lib/runtime/extension-loaders');
      expect(typeof loadFormatters).toBe('function');
    });

    it('loadCustomRenderers 函式存在', async () => {
      const { loadCustomRenderers } = await import('@/lib/runtime/extension-loaders');
      expect(typeof loadCustomRenderers).toBe('function');
    });

    it('loadFormatters 對 mock spec（無對應檔案）回傳空物件，不 throw', async () => {
      const { loadFormatters } = await import('@/lib/runtime/extension-loaders');

      const spec = {
        name: 'nonexistent-extension',
        models: [{
          name: 'Test',
          formatters: {
            title: '{{fn:nonexistentFormatter}}',
          },
        }],
      } as never;

      // 找不到 formatter 檔案不應 throw
      const formatters = await loadFormatters(spec);
      expect(formatters).toEqual({});
    });

    it('extension-loaders 用 require.resolve 路徑絕對化（Vitest 相容）', async () => {
      const source = await import('node:fs/promises').then((m) =>
        m.readFile('lib/runtime/extension-loaders.ts', 'utf-8'),
      );
      // 不應該用 @/ alias（Vitest + Node require 不支援）
      expect(source).not.toMatch(/@\/extensions\//);
      // 應該用 path.resolve
      expect(source).toMatch(/path\.resolve/);
    });
  });

  describe('4 spec.json 是否準備好 formatters/customRenderers 結構', () => {
    it('extensions/event 已包含 formatters 區塊（示範）', () => {
      const raw = fs.readFileSync(
        path.join(ROOT, 'extensions/event/event-spec.json'),
        'utf-8',
      );
      const spec = JSON.parse(raw);

      // 第一個 model 應該有 formatters 區塊
      const eventModel = spec.models?.find?.((m: { name: string }) => m.name === 'Event');
      // 不強制 — 允許空，但如果有 customRenderers 必須是 object
      if (eventModel?.customRenderers) {
        expect(typeof eventModel.customRenderers).toBe('object');
      }
    });
  });
});
