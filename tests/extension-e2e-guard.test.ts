/**
 * Sprint 53 Stage 53-2 (FR-20.3) — Extension End-to-End 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.15 (FR-20.3)
 * 對應 Plan Gate: docs/sprint53-plan-gate.md
 *
 * 守護項目:
 * - FR-20.3.1: 端到端流程 (mock AI, 模擬 8 個檔案生成)
 * - FR-20.3.2: 整合 admin chat + extension-tool-wrapper + validator
 * - FR-20.3.3: 生成的 extension 可被 loader load
 * - FR-20.3.4: 失敗情境 (路徑違規, schema 錯誤) 完整回滾
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  rmSync,
  readFileSync,
} from 'fs';
import { join } from 'path';
import { processExtensionGeneration, type WriteFileToolCall } from '@/lib/ai/agent-sdk/extension-tool-wrapper';
import { parseExtensionManifest } from '@/lib/extensions/extension-loader';
import { validateExtensionSpec } from '@/lib/ai/agent-sdk/extension-generator';

describe('S53-2 — Extension End-to-End 守護測試 (FR-20.3)', () => {
  const testExtName = 'test-product-e2e';

  beforeEach(() => {
    const extDir = join('extensions', testExtName);
    if (existsSync(extDir)) {
      rmSync(extDir, { recursive: true });
    }
  });

  afterEach(() => {
    const extDir = join('extensions', testExtName);
    if (existsSync(extDir)) {
      rmSync(extDir, { recursive: true });
    }
  });

  describe('FR-20.3.1: 端到端流程 (mock AI)', () => {
    it('8 個合法檔案 → 成功生成 product extension', async () => {
      // 模擬 AI 生成的 8 個檔案 (對齊 Sprint 52 spike §7)
      const toolCalls: WriteFileToolCall[] = [
        {
          path: `extensions/${testExtName}/manifest.json`,
          content: JSON.stringify({
            name: testExtName,
            version: '1.0.0',
            label: 'Product (E2E Test)',
            hooks: [`${testExtName}.beforeCreate`],
            actions: [`${testExtName}.complete`],
            computed: [`${testExtName}.isInStock`],
          }),
        },
        {
          path: `extensions/${testExtName}/${testExtName}-spec.json`,
          content: JSON.stringify({
            name: testExtName,
            label: 'Product (E2E Test)',
            models: [
              {
                name: 'Product',
                label: 'Product',
                fields: [
                  { name: 'title', type: 'string', label: 'Title' },
                  { name: 'price', type: 'number', label: 'Price' },
                  { name: 'stock', type: 'number', label: 'Stock' },
                ],
              },
            ],
          }),
        },
        {
          path: `extensions/${testExtName}/hooks/beforeCreate.ts`,
          content: 'export default async function beforeCreate(ctx: any) { return ctx; }',
        },
        {
          path: `extensions/${testExtName}/actions/complete.ts`,
          content: 'export default async function complete() { return { ok: true }; }',
        },
        {
          path: `extensions/${testExtName}/computed/isInStock.ts`,
          content: 'export default function isInStock(stock: number) { return stock > 0; }',
        },
        {
          path: `extensions/${testExtName}/workflow/product-workflow.ts`,
          content: 'export default function workflow() { return {}; }',
        },
        {
          path: `extensions/${testExtName}/examples/list-and-filter.ts`,
          content: 'export default function example() { return []; }',
        },
        {
          path: `extensions/${testExtName}/README.md`,
          content: '# Product Extension (E2E Test)',
        },
      ];

      const result = await processExtensionGeneration(toolCalls, testExtName);
      expect(result.success).toBe(true);
      expect(result.files?.length).toBe(8);

      // 驗證實際寫入磁碟
      expect(existsSync(`extensions/${testExtName}/manifest.json`)).toBe(true);
      expect(existsSync(`extensions/${testExtName}/${testExtName}-spec.json`)).toBe(
        true,
      );
      expect(
        existsSync(`extensions/${testExtName}/hooks/beforeCreate.ts`),
      ).toBe(true);
      expect(
        existsSync(`extensions/${testExtName}/actions/complete.ts`),
      ).toBe(true);
      expect(
        existsSync(`extensions/${testExtName}/computed/isInStock.ts`),
      ).toBe(true);
      expect(
        existsSync(`extensions/${testExtName}/workflow/product-workflow.ts`),
      ).toBe(true);
      expect(
        existsSync(`extensions/${testExtName}/examples/list-and-filter.ts`),
      ).toBe(true);
      expect(existsSync(`extensions/${testExtName}/README.md`)).toBe(true);
    });

    it('生成的 manifest.json 可被 parseExtensionManifest 驗證', async () => {
      const toolCalls: WriteFileToolCall[] = [
        {
          path: `extensions/${testExtName}/manifest.json`,
          content: JSON.stringify({
            name: testExtName,
            version: '1.0.0',
          }),
        },
        {
          path: `extensions/${testExtName}/${testExtName}-spec.json`,
          content: JSON.stringify({
            name: testExtName,
            label: 'Test',
            models: [
              {
                name: 'Product',
                label: 'Product',
                fields: [{ name: 'title', type: 'string', label: 'Title' }],
              },
            ],
          }),
        },
        {
          path: `extensions/${testExtName}/hooks/beforeCreate.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/actions/complete.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/computed/remainingDays.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/workflow/workflow.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/examples/example.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/README.md`,
          content: '# Test',
        },
      ];

      const result = await processExtensionGeneration(toolCalls, testExtName);
      expect(result.success).toBe(true);

      // 讀回 manifest.json, 用 extension-loader 的 parseExtensionManifest 驗證
      const manifestContent = readFileSync(
        `extensions/${testExtName}/manifest.json`,
        'utf-8',
      );
      const manifest = parseExtensionManifest(manifestContent);
      expect(manifest.name).toBe(testExtName);
      expect(manifest.version).toBe('1.0.0');
    });

    it('生成的 spec.json 可被 validateExtensionSpec 驗證', async () => {
      const toolCalls: WriteFileToolCall[] = [
        {
          path: `extensions/${testExtName}/manifest.json`,
          content: JSON.stringify({
            name: testExtName,
            version: '1.0.0',
          }),
        },
        {
          path: `extensions/${testExtName}/${testExtName}-spec.json`,
          content: JSON.stringify({
            name: testExtName,
            label: 'Test',
            models: [
              {
                name: 'Product',
                label: 'Product',
                fields: [
                  { name: 'title', type: 'string', label: 'Title' },
                  { name: 'price', type: 'number', label: 'Price' },
                ],
              },
            ],
          }),
        },
        {
          path: `extensions/${testExtName}/hooks/beforeCreate.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/actions/complete.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/computed/remainingDays.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/workflow/workflow.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/examples/example.ts`,
          content: 'export default function() {}',
        },
        {
          path: `extensions/${testExtName}/README.md`,
          content: '# Test',
        },
      ];

      await processExtensionGeneration(toolCalls, testExtName);

      const specContent = readFileSync(
        `extensions/${testExtName}/${testExtName}-spec.json`,
        'utf-8',
      );
      const spec = JSON.parse(specContent);
      expect(() => validateExtensionSpec(spec)).not.toThrow();
    });
  });

  describe('FR-20.3.4: 失敗情境回滾', () => {
    it('路徑違規應完全不寫入磁碟', async () => {
      const toolCalls: WriteFileToolCall[] = [
        {
          path: 'extensions/todo/manifest.json', // ❌ 跨 extension 攻擊
          content: '{}',
        },
      ];
      const result = await processExtensionGeneration(toolCalls, testExtName);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      // 應不寫入任何檔案
      expect(existsSync(`extensions/${testExtName}/manifest.json`)).toBe(
        false,
      );
    });

    it('Schema 失敗應回滾所有已寫入檔案', async () => {
      const toolCalls: WriteFileToolCall[] = [
        {
          path: `extensions/${testExtName}/manifest.json`,
          content: '{}', // Schema 失敗 (缺少 name + version)
        },
        {
          path: `extensions/${testExtName}/${testExtName}-spec.json`,
          content: '{}', // Schema 失敗
        },
      ];
      const result = await processExtensionGeneration(toolCalls, testExtName);
      expect(result.success).toBe(false);
      // 應回滾: manifest.json 不應存在
      expect(existsSync(`extensions/${testExtName}/manifest.json`)).toBe(
        false,
      );
      expect(
        existsSync(`extensions/${testExtName}/${testExtName}-spec.json`),
      ).toBe(false);
    });
  });

  describe('FR-20.3.5: tsc 編譯驗證', () => {
    it('生成的 .ts 檔案應通過 tsc syntactic check', async () => {
      const toolCalls: WriteFileToolCall[] = [
        {
          path: `extensions/${testExtName}/manifest.json`,
          content: JSON.stringify({
            name: testExtName,
            version: '1.0.0',
          }),
        },
        {
          path: `extensions/${testExtName}/${testExtName}-spec.json`,
          content: JSON.stringify({
            name: testExtName,
            label: 'Test',
            models: [
              {
                name: 'Product',
                label: 'Product',
                fields: [{ name: 'title', type: 'string', label: 'Title' }],
              },
            ],
          }),
        },
        {
          path: `extensions/${testExtName}/hooks/beforeCreate.ts`,
          content: 'export default async function beforeCreate(ctx: any) { return ctx; }',
        },
        {
          path: `extensions/${testExtName}/actions/complete.ts`,
          content: 'export default async function complete() { return { ok: true }; }',
        },
        {
          path: `extensions/${testExtName}/computed/isInStock.ts`,
          content: 'export default function isInStock(stock: number) { return stock > 0; }',
        },
        {
          path: `extensions/${testExtName}/workflow/product-workflow.ts`,
          content: 'export default function workflow() { return {}; }',
        },
        {
          path: `extensions/${testExtName}/examples/list-and-filter.ts`,
          content: 'export default function example() { return []; }',
        },
        {
          path: `extensions/${testExtName}/README.md`,
          content: '# Product',
        },
      ];

      const result = await processExtensionGeneration(toolCalls, testExtName);
      expect(result.success).toBe(true);
    }, 30000); // 30 秒 timeout (tsc 可能耗時)
  });
});