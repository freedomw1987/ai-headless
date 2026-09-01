import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

/**
 * S49-0 — UIMessage Spike Guard (FR-16.1 ~ FR-16.2)
 *
 * Sprint 49 Stage 49-0 spike 完成證明:
 * - 評估 conversation.tsx + message.tsx 對 UIMessage 的使用面
 * - 產出 spike 文件 docs/spike/sprint49-uimessage.md
 *
 * 守護項目:
 * - spike 文件存在
 * - 2 個被評估的檔案當前 UIMessage 使用面記錄在 spike
 * - spike 結論明確 (採用方案 1 + 刪除 dead code)
 * - Sprint 49-2 行動清單已列出
 */

describe('S49-0 — UIMessage Spike Guard (FR-16.1 ~ FR-16.2)', () => {
  describe('FR-16.1: 評估檔案存在', () => {
    it('conversation.tsx 應存在', () => {
      expect(existsSync('components/ai-elements/conversation.tsx')).toBe(true);
    });

    it('message.tsx 應存在', () => {
      expect(existsSync('components/ai-elements/message.tsx')).toBe(true);
    });
  });

  describe('FR-16.2: Spike 文件完整性', () => {
    it('spike 文件應存在', () => {
      expect(
        existsSync('docs/spike/sprint49-uimessage.md'),
        'Sprint 49-0 spike 文件應存在',
      ).toBe(true);
    });

    it('spike 文件應包含使用面評估 (conversation + message)', () => {
      const source = readFileSync(
        'docs/spike/sprint49-uimessage.md',
        'utf-8',
      );
      expect(source).toContain('conversation.tsx');
      expect(source).toContain('message.tsx');
    });

    it('spike 文件應列出 4 個替代方案', () => {
      const source = readFileSync(
        'docs/spike/sprint49-uimessage.md',
        'utf-8',
      );
      // 至少要評估方案 1, 1b, 2, 3
      expect(source).toMatch(/方案 1[^b]/); // 方案 1 (非 1b)
      expect(source).toMatch(/方案 1b/);
      expect(source).toMatch(/方案 2/);
      expect(source).toMatch(/方案 3/);
    });

    it('spike 文件應有明確採用方案', () => {
      const source = readFileSync(
        'docs/spike/sprint49-uimessage.md',
        'utf-8',
      );
      // §6 採用方案明確標記
      expect(source).toMatch(/採用方案/);
    });

    it('spike 文件應有 Sprint 49-2 行動清單', () => {
      const source = readFileSync(
        'docs/spike/sprint49-uimessage.md',
        'utf-8',
      );
      expect(source).toMatch(/Sprint 49-2 行動清單/);
    });

    it('spike 文件應揭露 dead code 發現', () => {
      const source = readFileSync(
        'docs/spike/sprint49-uimessage.md',
        'utf-8',
      );
      // §5 意外發現章節
      expect(source).toContain('§5');
      expect(source).toMatch(/dead code/i);
    });
  });

  describe('Sprint 49-2 完成後狀態快照 (spike 結論已實作)', () => {
    it('conversation.tsx 不應有 from "ai" import UIMessage (已切斷)', () => {
      const source = readFileSync(
        'components/ai-elements/conversation.tsx',
        'utf-8',
      );
      // Sprint 49-2 已完成: dead code 刪除, 不再有 UIMessage import
      const hasUIMessageFromAI =
        /from\s+["']ai["']/i.test(source) && /UIMessage/.test(source);
      expect(
        hasUIMessageFromAI,
        'Sprint 49-2 完成: conversation.tsx 已切斷 UIMessage 依賴',
      ).toBe(false);
    });

    it('message.tsx 不應有 from "ai" import UIMessage (已切斷)', () => {
      const source = readFileSync(
        'components/ai-elements/message.tsx',
        'utf-8',
      );
      const hasUIMessageFromAI =
        /from\s+["']ai["']/i.test(source) && /UIMessage/.test(source);
      expect(
        hasUIMessageFromAI,
        'Sprint 49-2 完成: message.tsx 已切斷 UIMessage 依賴',
      ).toBe(false);
    });

    it('message.tsx 應改 import ChatMessageRole from chat-utils', () => {
      const source = readFileSync(
        'components/ai-elements/message.tsx',
        'utf-8',
      );
      expect(
        /from\s+["']@\/lib\/ai\/chat\/chat-utils["']/i.test(source) &&
          /ChatMessageRole/.test(source),
        'Sprint 49-2: message.tsx 應改用 ChatMessageRole 而非 UIMessage["role"]',
      ).toBe(true);
    });
  });
});