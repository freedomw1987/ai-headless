/**
 * Sprint 55 — Extension Generation 端到端守護測試
 *
 * 對應: Sprint 53 反思「再次留尾」
 * 對應: docs/sprint55-plan-gate.md §7
 *
 * 防止下次重構又把 AI 生成 extension 流程弄成 stub
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROUTE_PATH = 'app/api/admin/extensions/generate/route.ts';
const TEMPLATE_PATH = 'lib/ai/agent-sdk/extension-template.ts';
const CHAT_PANEL_PATH = 'app/admin/_components/admin-chat-panel.tsx';

describe('S55 — Extension Generation 端到端守護', () => {
  describe('Server Endpoint (FR-22.1)', () => {
    it('應有 POST /api/admin/extensions/generate/route.ts', () => {
      expect(existsSync(ROUTE_PATH), 'POST endpoint 不存在').toBe(true);
    });

    it('POST handler 應 requireUser + isAdmin', () => {
      const source = readFileSync(ROUTE_PATH, 'utf-8');
      expect(source, '應 requireUser').toMatch(/requireUser\s*\(/);
      expect(source, '應 isAdmin').toMatch(/isAdmin\s*\(/);
    });

    it('POST handler 應驗證 name kebab-case', () => {
      const source = readFileSync(ROUTE_PATH, 'utf-8');
      expect(source, '應有 kebab-case regex').toMatch(/\/\^.*a-z.*\$?\//);
    });

    it('POST handler 應檢查 overwrite (409 Conflict)', () => {
      const source = readFileSync(ROUTE_PATH, 'utf-8');
      expect(source, '應有 existsSync 檢查').toMatch(/existsSync/);
      expect(source, '應有 409 狀態').toMatch(/status:\s*409/);
    });

    it('POST handler 應呼叫 processExtensionGeneration', () => {
      const source = readFileSync(ROUTE_PATH, 'utf-8');
      expect(source, '應 import processExtensionGeneration').toMatch(/processExtensionGeneration/);
    });

    it('POST handler 應呼叫 generateExtensionTemplate', () => {
      const source = readFileSync(ROUTE_PATH, 'utf-8');
      expect(source, '應 import generateExtensionTemplate').toMatch(/generateExtensionTemplate/);
    });
  });

  describe('ExtensionTemplate (FR-22.1 + FR-22.2)', () => {
    it('應有 extension-template.ts', () => {
      expect(existsSync(TEMPLATE_PATH), 'extension-template.ts 不存在').toBe(true);
    });

    it('應有 generateExtensionTemplate function', () => {
      const source = readFileSync(TEMPLATE_PATH, 'utf-8');
      expect(source, '應有 generateExtensionTemplate').toMatch(/export\s+function\s+generateExtensionTemplate/);
    });

    it('應有 inferFieldType function', () => {
      const source = readFileSync(TEMPLATE_PATH, 'utf-8');
      expect(source, '應有 inferFieldType').toMatch(/export\s+function\s+inferFieldType/);
    });

    it('應推斷 4+ 種 field types (datetime, boolean, number, text, string)', () => {
      const source = readFileSync(TEMPLATE_PATH, 'utf-8');
      expect(source, 'datetime 推斷').toMatch(/datetime/);
      expect(source, 'boolean 推斷').toMatch(/boolean/);
      expect(source, 'number 推斷').toMatch(/number/);
      expect(source, 'text 推斷').toMatch(/text/);
    });

    it('應產 8 個檔案 (manifest, spec, hook, action, computed, workflow, example, readme)', () => {
      const source = readFileSync(TEMPLATE_PATH, 'utf-8');
      expect(source, 'manifest.json').toMatch(/manifest\.json/);
      expect(source, 'spec.json').toMatch(/spec\.json/);
      expect(source, 'hooks/').toMatch(/hooks\//);
      expect(source, 'actions/').toMatch(/actions\//);
      expect(source, 'computed/').toMatch(/computed\//);
      expect(source, 'workflow/').toMatch(/workflow\//);
      expect(source, 'examples/').toMatch(/examples\//);
      expect(source, 'README.md').toMatch(/README\.md/);
    });

    it('workflow 應有 draft → published 狀態機', () => {
      const source = readFileSync(TEMPLATE_PATH, 'utf-8');
      expect(source, "應有 'draft' state").toMatch(/'draft'/);
      expect(source, "應有 'published' state").toMatch(/'published'/);
    });
  });

  describe('AdminChatPanel Integration (FR-22.3)', () => {
    const source = readFileSync(CHAT_PANEL_PATH, 'utf-8');

    it('handleExtensionCommand 應真 fetch endpoint (不是 stub return true)', () => {
      // 防止「再次留尾」: 必須真的有 fetch POST /api/admin/extensions/generate
      expect(source, '應 fetch POST /api/admin/extensions/generate').toMatch(
        /fetch\s*\(\s*['"`]\/api\/admin\/extensions\/generate['"`]/,
      );
    });

    it('應 await handleExtensionCommand', () => {
      expect(source, '應 await handleExtensionCommand').toMatch(/await\s+handleExtensionCommand/);
    });

    it('應傳 name + fields + force 給 endpoint', () => {
      expect(source, '應傳 name').toMatch(/name:\s*parsed\.name/);
      expect(source, '應傳 fields').toMatch(/fields:\s*parsed\.fields/);
      expect(source, '應傳 force').toMatch(/force:\s*parsed\.force/);
    });

    it('應處理 success + error 顯示在 chat', () => {
      // 應有 addMessage 或 setMessages 顯示結果
      expect(source, '應 addMessage success').toMatch(/✅|addMessage.*success|成功/);
      expect(source, '應 addMessage error').toMatch(/❌|error|失敗/);
    });
  });

  describe('真實產物驗證 (防 paper-only 守護)', () => {
    // Sprint 53 反思: 守護測試可能有但實際檔案不存在
    // 加這個 describe 區塊: 必須真有 extensions/<name>/ 結構
    it('應有 extensions/product/ 目錄', () => {
      // Sprint 55 跑完應留下 product extension
      expect(existsSync('extensions/product'), 'extensions/product/ 不存在').toBe(true);
    });

    it('extensions/product/ 應有 manifest.json', () => {
      expect(existsSync('extensions/product/manifest.json'), 'manifest.json 不存在').toBe(true);
    });

    it('extensions/product/ 應有 8 個檔案', () => {
      const expectedFiles = [
        'extensions/product/manifest.json',
        'extensions/product/spec.json',
        'extensions/product/hooks/before-create.ts',
        'extensions/product/actions/complete.ts',
        'extensions/product/computed/remaining-days.ts',
        'extensions/product/workflow/product-workflow.ts',
        'extensions/product/examples/list-and-filter.ts',
        'extensions/product/README.md',
      ];
      for (const f of expectedFiles) {
        expect(existsSync(f), `${f} 不存在`).toBe(true);
        const stat = statSync(f);
        expect(stat.size, `${f} 不應為 0 bytes`).toBeGreaterThan(0);
      }
    });
  });
});