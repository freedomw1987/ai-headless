/**
 * Sprint 53 Stage 53-1 (FR-20.2 + FR-20.4) — Extension Tool Wrapper 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.15 (FR-20.2 + FR-20.4)
 * 對應 Plan Gate: docs/sprint53-plan-gate.md
 *
 * 守護項目:
 * - FR-20.2: write_file tool call 攔截 (isPathAllowed 整合)
 * - FR-20.2.7: 批次驗證 (validateBatch)
 * - FR-20.2.8: 寫入 + 回滾流程
 * - FR-20.4: 三層驗證 (Schema + 結構 + tsc)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import {
  interceptWriteFile,
  writeExtensionFile,
  rollbackFiles,
  validateBatch,
  validateThreeLayers,
  processExtensionGeneration,
  type WriteFileToolCall,
} from '@/lib/ai/agent-sdk/extension-tool-wrapper';
import type { ExtensionFile } from '@/lib/ai/agent-sdk/extension-validator';

describe('S53-1 — Extension Tool Wrapper 守護測試 (FR-20.2 + FR-20.4)', () => {
  describe('FR-20.2.3: write_file 攔截 (interceptWriteFile)', () => {
    it('合法路徑 (extensions/product/manifest.json) 應允許', () => {
      const result = interceptWriteFile(
        {
          path: 'extensions/product/manifest.json',
          content: '{}',
        },
        'product',
      );
      expect(result.status).toBe('allowed');
      if (result.status === 'allowed') {
        expect(result.file.path).toBe('extensions/product/manifest.json');
      }
    });

    it('跨 extension 攻擊 (extensions/todo/) 應拒絕', () => {
      const result = interceptWriteFile(
        {
          path: 'extensions/todo/manifest.json',
          content: '{}',
        },
        'product',
      );
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toContain('Path not allowed');
      }
    });

    it('核心程式 (lib/extensions/extension-loader.ts) 應拒絕', () => {
      const result = interceptWriteFile(
        {
          path: 'lib/extensions/extension-loader.ts',
          content: 'malicious code',
        },
        'product',
      );
      expect(result.status).toBe('rejected');
    });
  });

  describe('FR-20.2.4: 寫入與回滾', () => {
    const testExtName = 'test-tool-wrapper';

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

    it('writeExtensionFile 應寫入檔案', () => {
      const file: ExtensionFile = {
        path: `extensions/${testExtName}/manifest.json`,
        content: '{"name":"test"}',
      };
      writeExtensionFile(file);
      expect(existsSync(file.path)).toBe(true);
    });

    it('rollbackFiles 應刪除已寫入檔案', () => {
      const file: ExtensionFile = {
        path: `extensions/${testExtName}/manifest.json`,
        content: '{"name":"test"}',
      };
      writeExtensionFile(file);
      expect(existsSync(file.path)).toBe(true);

      rollbackFiles([file]);
      expect(existsSync(file.path)).toBe(false);
    });

    it('rollbackFiles 應容忍不存在檔案 (no throw)', () => {
      const file: ExtensionFile = {
        path: `extensions/${testExtName}/not-exist.json`,
        content: '{}',
      };
      // 不寫入, 直接 rollback 應 no throw
      expect(() => rollbackFiles([file])).not.toThrow();
    });
  });

  describe('FR-20.2.7: 批次驗證 (validateBatch)', () => {
    it('8 個檔案完整應通過批次驗證', () => {
      const files: ExtensionFile[] = [
        {
          path: 'extensions/product/manifest.json',
          content: JSON.stringify({
            name: 'product',
            version: '1.0.0',
          }),
        },
        {
          path: 'extensions/product/product-spec.json',
          content: JSON.stringify({
            name: 'product',
            label: 'Product',
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
          path: 'extensions/product/hooks/beforeCreate.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/actions/complete.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/computed/remainingDays.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/workflow/product-workflow.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/examples/example.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/README.md',
          content: '# Product',
        },
      ];
      const result = validateBatch(files, 'product');
      expect(result.status).toBe('passed');
    });

    it('少於 8 個檔案應 reject', () => {
      const files: ExtensionFile[] = [
        {
          path: 'extensions/product/manifest.json',
          content: '{}',
        },
      ];
      const result = validateBatch(files, 'product');
      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('FR-20.4.2: 三層驗證 (validateThreeLayers)', () => {
    it('8 個檔案完整應通過 Schema + 結構 + tsc', async () => {
      const files: ExtensionFile[] = [
        {
          path: 'extensions/product/manifest.json',
          content: JSON.stringify({
            name: 'product',
            version: '1.0.0',
          }),
        },
        {
          path: 'extensions/product/product-spec.json',
          content: JSON.stringify({
            name: 'product',
            label: 'Product',
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
          path: 'extensions/product/hooks/beforeCreate.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/actions/complete.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/computed/remainingDays.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/workflow/product-workflow.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/examples/example.ts',
          content: 'export default function() {}',
        },
        {
          path: 'extensions/product/README.md',
          content: '# Product',
        },
      ];
      const result = await validateThreeLayers(files, 'product');
      expect(result.status).toBe('passed');
      expect(result.tsc?.passed).toBe(true);
    });

    it('Schema 失敗時不應進入 tsc 階段', async () => {
      const files: ExtensionFile[] = [
        {
          path: 'extensions/product/manifest.json',
          content: '{}', // 缺少 name + version
        },
      ];
      const result = await validateThreeLayers(files, 'product');
      expect(result.status).toBe('failed');
      // tsc 應為 undefined (short-circuit)
      expect(result.tsc).toBeUndefined();
    });
  });

  describe('FR-20.2.8 + FR-20.3: 端到端流程 (processExtensionGeneration)', () => {
    const testExtName = 'test-end-to-end';

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

    it('8 個合法 tool call 應成功生成 extension', async () => {
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
                name: 'Test',
                label: 'Test',
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

      const result = await processExtensionGeneration(
        toolCalls,
        testExtName,
      );
      expect(result.success).toBe(true);
      expect(result.files?.length).toBe(8);
      // 檢查實際寫入
      expect(
        existsSync(`extensions/${testExtName}/manifest.json`),
      ).toBe(true);
    });

    it('路徑違規時應 reject 不寫入', async () => {
      const toolCalls: WriteFileToolCall[] = [
        {
          path: 'extensions/todo/manifest.json', // 違規: 跨 extension 攻擊
          content: '{}',
        },
      ];
      const result = await processExtensionGeneration(
        toolCalls,
        testExtName,
      );
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Path not allowed');
    });

    it('Schema 失敗時應回滾 (刪除已寫入檔案)', async () => {
      const toolCalls: WriteFileToolCall[] = [
        {
          path: `extensions/${testExtName}/manifest.json`,
          content: '{}', // Schema 失敗 (缺少 name + version)
        },
        {
          path: `extensions/${testExtName}/product-spec.json`,
          content: '{}', // Schema 失敗
        },
      ];
      const result = await processExtensionGeneration(
        toolCalls,
        testExtName,
      );
      expect(result.success).toBe(false);
      // 應回滾: manifest.json 不應存在
      expect(
        existsSync(`extensions/${testExtName}/manifest.json`),
        '驗證失敗應回滾, manifest.json 應被刪除',
      ).toBe(false);
    });
  });

  describe('FR-20.2.1: 檔案結構完整性', () => {
    it('lib/ai/agent-sdk/extension-tool-wrapper.ts 應存在', () => {
      expect(
        existsSync('lib/ai/agent-sdk/extension-tool-wrapper.ts'),
      ).toBe(true);
    });

    it('應 export 主要函式', () => {
      // TypeScript 編譯時驗證, 此處僅檢查 import 路徑存在
      expect(typeof interceptWriteFile).toBe('function');
      expect(typeof validateBatch).toBe('function');
      expect(typeof processExtensionGeneration).toBe('function');
    });
  });
});