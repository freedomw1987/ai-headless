/**
 * Sprint 52 Stage 52-1 (FR-19.2 + FR-19.3) — Extension Generator 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.14 (FR-19.2 + FR-19.3)
 * 對應 Plan Gate: docs/sprint52-plan-gate.md
 *
 * 守護項目:
 * - FR-19.2: lib/ai/agent-sdk/extension-generator.ts 存在 + Zod schema + prompt 模板
 * - FR-19.3: slash command 解析邏輯
 */

import { describe, it, expect } from 'vitest';
import {
  existsSync,
  readFileSync,
} from 'fs';
import {
  validateExtensionSpec,
  parseExtensionCommand,
  isExtensionCommand,
  buildExtensionGeneratorPrompt,
  EXTENSION_GENERATOR_SYSTEM_PROMPT,
} from '@/lib/ai/agent-sdk/extension-generator';

describe('S52-1 — Extension Generator 守護測試 (FR-19.2 + FR-19.3)', () => {
  describe('FR-19.2.1: extension-generator.ts 檔案存在', () => {
    it('lib/ai/agent-sdk/extension-generator.ts 應存在', () => {
      expect(
        existsSync('lib/ai/agent-sdk/extension-generator.ts'),
        'extension-generator.ts 不存在',
      ).toBe(true);
    });

    it('應 export validateExtensionSpec function', () => {
      expect(typeof validateExtensionSpec).toBe('function');
    });

    it('應 export parseExtensionCommand function', () => {
      expect(typeof parseExtensionCommand).toBe('function');
    });

    it('應 export isExtensionCommand function', () => {
      expect(typeof isExtensionCommand).toBe('function');
    });
  });

  describe('FR-19.2.2: Zod schema 驗證', () => {
    it('應拒絕無效 spec (空 models)', () => {
      expect(() =>
        validateExtensionSpec({
          name: 'test',
          label: 'Test',
          models: [],
        }),
      ).toThrow();
    });

    it('應拒絕無效 spec (model name 非 PascalCase)', () => {
      expect(() =>
        validateExtensionSpec({
          name: 'test',
          label: 'Test',
          models: [
            {
              name: 'lowercase-model', // ❌ 應為 PascalCase
              label: 'Test',
              fields: [{ name: 'title', type: 'string', label: 'Title' }],
            },
          ],
        }),
      ).toThrow();
    });

    it('應接受有效 spec (todo 範本)', () => {
      const validSpec = {
        name: 'todo',
        label: '待辦事項',
        models: [
          {
            name: 'Todo',
            label: '待辦',
            fields: [
              { name: 'title', type: 'string', label: '標題' },
              { name: 'completed', type: 'boolean', label: '已完成' },
            ],
          },
        ],
      };
      expect(() => validateExtensionSpec(validSpec)).not.toThrow();
    });
  });

  describe('FR-19.2.3: Prompt 模板', () => {
    it('應 export EXTENSION_GENERATOR_SYSTEM_PROMPT', () => {
      expect(EXTENSION_GENERATOR_SYSTEM_PROMPT).toBeDefined();
      expect(EXTENSION_GENERATOR_SYSTEM_PROMPT.length).toBeGreaterThan(100);
      // 應提到 manifest.json 與 spec.json
      expect(EXTENSION_GENERATOR_SYSTEM_PROMPT).toContain('manifest.json');
      expect(EXTENSION_GENERATOR_SYSTEM_PROMPT).toContain('spec.json');
    });

    it('buildExtensionGeneratorPrompt 應產生正確格式', () => {
      const prompt = buildExtensionGeneratorPrompt({
        name: 'product',
        fields: ['name', 'price', 'stock'],
        force: false,
      });
      expect(prompt).toContain('product');
      expect(prompt).toContain('name, price, stock');
      expect(prompt).not.toContain('允許覆寫');
    });

    it('buildExtensionGeneratorPrompt 應含 --force 訊息', () => {
      const prompt = buildExtensionGeneratorPrompt({
        name: 'product',
        force: true,
      });
      expect(prompt).toContain('允許覆寫');
    });
  });

  describe('FR-19.3.1: Slash Command 解析', () => {
    it('/extension create product 應解析為 name=product', () => {
      const result = parseExtensionCommand('/extension create product');
      expect(result.action).toBe('create');
      expect(result.name).toBe('product');
      expect(result.force).toBe(false);
      expect(result.fields).toBeUndefined();
    });

    it('/extension create product --fields=name,price 應解析 fields', () => {
      const result = parseExtensionCommand(
        '/extension create product --fields=name,price',
      );
      expect(result.name).toBe('product');
      expect(result.fields).toEqual(['name', 'price']);
    });

    it('/extension create product --force 應解析 force=true', () => {
      const result = parseExtensionCommand(
        '/extension create product --force',
      );
      expect(result.name).toBe('product');
      expect(result.force).toBe(true);
    });

    it('/extension 應回傳 help action', () => {
      const result = parseExtensionCommand('/extension');
      expect(result.action).toBe('help');
    });

    it('/extension create 無 name 應 throw', () => {
      expect(() => parseExtensionCommand('/extension create')).toThrow(
        'Extension name required',
      );
    });

    it('isExtensionCommand 應正確判斷', () => {
      expect(isExtensionCommand('/extension create product')).toBe(true);
      expect(isExtensionCommand('hello world')).toBe(false);
      expect(isExtensionCommand('/extension')).toBe(true);
    });

    it('parseExtensionCommand 應拒絕非 extension command', () => {
      expect(() => parseExtensionCommand('hello world')).toThrow(
        'Not an extension command',
      );
    });
  });

  describe('FR-19.3.2: Slash Command 觸發點存在', () => {
    it('admin-chat-panel.tsx 應存在 (Sprint 52-2 將修改)', () => {
      // Sprint 52-1 階段: 僅確認檔案存在 (Sprint 52-2 才實際整合)
      expect(existsSync('app/admin/_components/admin-chat-panel.tsx')).toBe(
        true,
      );
    });

    it('extension-generator prompt 應包含 tool call 規範', () => {
      expect(EXTENSION_GENERATOR_SYSTEM_PROMPT).toContain('write_file');
    });
  });

  describe('FR-19.2.4: 檔案結構完整性', () => {
    it('extension-generator.ts 應 export EXTENSION_GENERATOR_SYSTEM_PROMPT', () => {
      const source = readFileSync(
        'lib/ai/agent-sdk/extension-generator.ts',
        'utf-8',
      );
      expect(source).toContain(
        'export const EXTENSION_GENERATOR_SYSTEM_PROMPT',
      );
    });

    it('extension-generator.ts 應使用 zod 驗證', () => {
      const source = readFileSync(
        'lib/ai/agent-sdk/extension-generator.ts',
        'utf-8',
      );
      expect(source).toContain("from 'zod'");
      expect(source).toContain('safeParse');
    });
  });
});