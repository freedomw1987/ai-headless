/**
 * Sprint 52 Stage 52-2 (FR-19.5) — Extension Validator 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.14 (FR-19.5)
 * 對應 Plan Gate: docs/sprint52-plan-gate.md
 *
 * 守護項目:
 * - FR-19.5.1: 路徑防護 (只能寫入 extensions/<name>/)
 * - FR-19.5.2: 覆寫保護 (預設拒絕, --force 才允許)
 * - FR-19.5.3: --force 模式下備份既有 extension
 * - FR-19.5.4: 三層驗證 (manifest schema + spec schema + 8 個檔案結構)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  statSync,
} from 'fs';
import { join } from 'path';
import {
  isPathAllowed,
  checkOverwrite,
  backupExtension,
  validateSpecLayer,
  validateManifestLayer,
  validateExtensionFiles,
  type ExtensionFile,
} from '@/lib/ai/agent-sdk/extension-validator';

describe('S52-2 — Extension Validator 守護測試 (FR-19.5)', () => {
  describe('FR-19.5.1: 路徑防護 (Path Guard)', () => {
    it('extensions/product/manifest.json 應允許', () => {
      expect(isPathAllowed('extensions/product/manifest.json', 'product')).toBe(
        true,
      );
    });

    it('extensions/product/hooks/beforeCreate.ts 應允許', () => {
      expect(
        isPathAllowed('extensions/product/hooks/beforeCreate.ts', 'product'),
      ).toBe(true);
    });

    it('Windows 風格路徑 \\ 應被正規化為 /', () => {
      expect(
        isPathAllowed('extensions\\product\\manifest.json', 'product'),
      ).toBe(true);
    });

    it('extensions/todo/manifest.json 應被拒絕 (跨 extension 攻擊)', () => {
      expect(isPathAllowed('extensions/todo/manifest.json', 'product')).toBe(
        false,
      );
    });

    it('lib/extensions/extension-loader.ts 應被拒絕 (核心程式)', () => {
      expect(
        isPathAllowed('lib/extensions/extension-loader.ts', 'product'),
      ).toBe(false);
    });

    it('components/admin/foo.tsx 應被拒絕 (extensions/ 之外)', () => {
      expect(isPathAllowed('components/admin/foo.tsx', 'product')).toBe(
        false,
      );
    });
  });

  describe('FR-19.5.2: 覆寫保護 (Overwrite Guard)', () => {
    const testExtName = 'test-ext-overwrite';

    beforeEach(() => {
      // 清理 + 建立測試 extension
      const extDir = join('extensions', testExtName);
      if (existsSync(extDir)) {
        rmSync(extDir, { recursive: true });
      }
      mkdirSync(extDir, { recursive: true });
      writeFileSync(join(extDir, 'manifest.json'), '{"name":"test"}');
    });

    afterEach(() => {
      const extDir = join('extensions', testExtName);
      if (existsSync(extDir)) {
        rmSync(extDir, { recursive: true });
      }
    });

    it('extension 不存在時應允許寫入 (無 force)', () => {
      const extDir = join('extensions', 'non-existent-ext');
      if (existsSync(extDir)) {
        rmSync(extDir, { recursive: true });
      }
      const result = checkOverwrite('non-existent-ext', false);
      expect(result.allowed).toBe(true);
    });

    it('extension 已存在且無 force 應拒絕', () => {
      const result = checkOverwrite(testExtName, false);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toBe('exists');
        expect(result.message).toContain('Use --force');
      }
    });

    it('extension 已存在且有 force 應允許', () => {
      const result = checkOverwrite(testExtName, true);
      expect(result.allowed).toBe(true);
    });
  });

  describe('FR-19.5.3: --force 模式下備份', () => {
    const testExtName = 'test-ext-backup';

    beforeEach(() => {
      const extDir = join('extensions', testExtName);
      if (existsSync(extDir)) {
        rmSync(extDir, { recursive: true });
      }
      mkdirSync(extDir, { recursive: true });
      writeFileSync(join(extDir, 'manifest.json'), '{"name":"backup-test"}');
    });

    afterEach(() => {
      // 清理 extensions/ 與 extensions-backup/
      const extDir = join('extensions', testExtName);
      if (existsSync(extDir)) {
        rmSync(extDir, { recursive: true });
      }
      const backupBaseDir = 'extensions-backup';
      if (existsSync(backupBaseDir)) {
        rmSync(backupBaseDir, { recursive: true });
      }
    });

    it('backupExtension 應建立 extensions-backup/<name>-<timestamp>/', () => {
      const backupDir = backupExtension(testExtName);
      expect(existsSync(backupDir)).toBe(true);
      expect(backupDir).toContain(`extensions-backup/${testExtName}-`);
    });

    it('backupExtension 應複製所有檔案', () => {
      const backupDir = backupExtension(testExtName);
      expect(
        existsSync(join(backupDir, 'manifest.json')),
        'manifest.json 應被複製到備份',
      ).toBe(true);
    });

    it('不存在的 extension 應 throw', () => {
      expect(() => backupExtension('non-existent-ext')).toThrow(
        'does not exist',
      );
    });
  });

  describe('FR-19.5.4: 三層驗證 - Spec Schema', () => {
    it('有效 spec 應通過 Layer 1 (spec schema)', () => {
      const validSpec = {
        name: 'test',
        label: 'Test',
        models: [
          {
            name: 'TestModel',
            label: 'Test',
            fields: [{ name: 'title', type: 'string', label: 'Title' }],
          },
        ],
      };
      const result = validateSpecLayer(validSpec);
      expect(result.passed).toBe(true);
    });

    it('無效 spec 應 reject (空 models)', () => {
      const result = validateSpecLayer({
        name: 'test',
        label: 'Test',
        models: [],
      });
      expect(result.passed).toBe(false);
      if (!result.passed) {
        expect(result.error).toContain('Invalid');
      }
    });
  });

  describe('FR-19.5.5: 三層驗證 - 8 個檔案結構', () => {
    it('8 個檔案完整應通過驗證', () => {
      const files: ExtensionFile[] = [
        {
          path: 'extensions/product/manifest.json',
          content: JSON.stringify({
            name: 'product',
            version: '1.0.0',
            label: 'Product',
            hooks: ['product.beforeCreate'],
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
                fields: [
                  { name: 'title', type: 'string', label: 'Title' },
                ],
              },
            ],
          }),
        },
        {
          path: 'extensions/product/hooks/beforeCreate.ts',
          content: 'export default async function beforeCreate(ctx) { return ctx; }',
        },
        {
          path: 'extensions/product/actions/complete.ts',
          content: 'export default async function complete() { return { ok: true }; }',
        },
        {
          path: 'extensions/product/computed/remainingDays.ts',
          content: 'export default function remainingDays(d) { return 0; }',
        },
        {
          path: 'extensions/product/workflow/product-workflow.ts',
          content: 'export default function workflow() { return {}; }',
        },
        {
          path: 'extensions/product/examples/example.ts',
          content: 'export default function example() { return []; }',
        },
        {
          path: 'extensions/product/README.md',
          content: '# Product Extension',
        },
      ];
      const result = validateExtensionFiles(files, 'product');
      expect(result.passed).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('少於 8 個檔案應 reject', () => {
      const files: ExtensionFile[] = [
        {
          path: 'extensions/product/manifest.json',
          content: JSON.stringify({
            name: 'product',
            version: '1.0.0',
          }),
        },
      ];
      const result = validateExtensionFiles(files, 'product');
      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Expected 8 files');
    });

    it('路徑違規應 reject (extensions/todo/manifest.json)', () => {
      const files: ExtensionFile[] = [
        {
          path: 'extensions/todo/manifest.json', // ❌ 跨 extension 攻擊
          content: '{}',
        },
      ];
      const result = validateExtensionFiles(files, 'product');
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('Path not allowed'))).toBe(
        true,
      );
    });
  });

  describe('FR-19.5.6: Validator 檔案結構', () => {
    it('lib/ai/agent-sdk/extension-validator.ts 應存在', () => {
      expect(
        existsSync('lib/ai/agent-sdk/extension-validator.ts'),
        'extension-validator.ts 不存在',
      ).toBe(true);
    });

    it('extension-validator.ts 應 export 路徑防護', () => {
      expect(typeof isPathAllowed).toBe('function');
    });

    it('extension-validator.ts 應 export 覆寫保護', () => {
      expect(typeof checkOverwrite).toBe('function');
    });

    it('extension-validator.ts 應 export 三層驗證', () => {
      expect(typeof validateSpecLayer).toBe('function');
      expect(typeof validateManifestLayer).toBe('function');
      expect(typeof validateExtensionFiles).toBe('function');
    });
  });
});