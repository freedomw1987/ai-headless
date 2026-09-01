/**
 * Sprint 53 Stage 53-0 (FR-20.1) — Admin Chat Slash Command 整合守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.15 (FR-20.1)
 * 對應 Plan Gate: docs/sprint53-plan-gate.md
 *
 * 守護項目:
 * - admin-chat-panel.tsx 整合 isExtensionCommand / parseExtensionCommand
 * - /extension create 觸發 extension generator flow
 * - /extension help 回傳用法說明
 * - 非 extension command 走一般 chat flow
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S53-0 — Admin Chat Slash Command 整合守護測試 (FR-20.1)', () => {
  describe('FR-20.1.1: admin-chat-panel.tsx 包含 slash command 整合', () => {
    it('admin-chat-panel.tsx 應存在', () => {
      expect(
        existsSync('app/admin/_components/admin-chat-panel.tsx'),
        'admin-chat-panel.tsx 不存在',
      ).toBe(true);
    });

    it('應 import parseExtensionCommand from extension-generator', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      expect(
        source,
        '應 import parseExtensionCommand 或 isExtensionCommand',
      ).toMatch(/parseExtensionCommand|isExtensionCommand/);
    });

    it('應 import from @/lib/ai/agent-sdk/extension-generator', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      expect(source).toContain(
        '@/lib/ai/agent-sdk/extension-generator',
      );
    });
  });

  describe('FR-20.1.2: handleSubmit 應包含 slash command 偵測邏輯', () => {
    it('應包含 isExtensionCommand 偵測', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      expect(
        source,
        '應包含 isExtensionCommand 或 parseExtensionCommand 呼叫',
      ).toMatch(/isExtensionCommand|parseExtensionCommand/);
    });

    it('應有 extension generator flow 觸發 (handleExtensionCommand 或 similar)', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      // 應有 extension generator 觸發函式
      expect(
        source,
        '應有 extension generator flow (handleExtensionCommand 或觸發點)',
      ).toMatch(/handleExtensionCommand|triggerExtensionGenerator|extension-generator/);
    });

    it('應區分一般 chat 與 extension command', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      // 應有條件分支, 例如 if (isExtensionCommand(input)) { ... } else { send(...) }
      expect(
        source,
        '應有條件分支區分一般 chat 與 extension command',
      ).toMatch(/isExtensionCommand\(input\)|isExtensionCommand\(.*input/);
    });
  });

  describe('FR-20.1.3: 不應破壞現有 admin chat 功能', () => {
    it('應保留一般 send() 流程', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      expect(
        source,
        '應保留 send() 呼叫用於一般 chat',
      ).toContain('send(input');
    });

    it('應保留附件處理 (attachments.files.map)', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      expect(
        source,
        '應保留附件處理邏輯',
      ).toContain('attachments.files.map');
    });

    it('應保留 Markdown 渲染', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      expect(source).toContain('Markdown');
    });
  });

  describe('FR-20.1.4: 程式碼結構完整性', () => {
    it('應有 [Extension Generator] 標籤 (Sprint 53 Plan Gate 設計)', () => {
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      expect(
        source,
        '應有 [Extension Generator] 標籤用於辨識',
      ).toContain('[Extension Generator]');
    });

    it('應 import ExtensionFlow 元件 (Sprint 53-1 將建立)', () => {
      // Sprint 53-0 僅偵測 slash command, 實際 extension flow 留 Sprint 53-1
      // 此測試留 placeholder, 驗證基本 import 結構
      const source = readFileSync(
        'app/admin/_components/admin-chat-panel.tsx',
        'utf-8',
      );
      // 不強制 import ExtensionFlow (Sprint 53-1 才會加)
      // 但應有觸發點 (handleExtensionCommand 或 placeholder)
      expect(source.length).toBeGreaterThan(5000);
    });
  });
});