/**
 * Sprint 45 Commit C — 檔案附件 UI 守護測試
 *
 * 設計 (S45 Plan Gate Commit C - 純前端附件 UI, 不上傳):
 * - 用 AI Elements PromptInputActionAddAttachments 觸發 file picker
 * - 用 usePromptInputAttachments 顯示附件狀態
 * - 送出時把附件檔名拼進 message content (📎 file.txt 格式)
 * - 不上傳到 server, 留 Sprint 46
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('S45-C — 檔案附件 UI', () => {
  describe('元件 import', () => {
    it('AdminChatPanel 應 import PromptInputActionAddAttachments', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應 import PromptInputActionAddAttachments').toMatch(
        /PromptInputActionAddAttachments/,
      );
    });

    it('AdminChatPanel 應 import usePromptInputAttachments', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應 import usePromptInputAttachments').toMatch(
        /usePromptInputAttachments/,
      );
    });
  });

  describe('附件 UI 結構', () => {
    it('應有附件顯示容器', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      // 應在 PromptInputFooter 或 Header 內有 attachments UI
      expect(source, '應有 attachments display').toMatch(/attachments|attachment/i);
    });

    it('應有 file picker trigger button', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應有 PromptInputActionAddAttachments').toMatch(
        /PromptInputActionAddAttachments/,
      );
    });
  });

  describe('訊息內容整合', () => {
    it('useChatStream 應支援 attachments 參數 (檔名拼進 content)', () => {
      const source = readFileSync('app/admin/_components/use-chat-stream.ts', 'utf-8');
      expect(source, '應支援 attachments 參數').toMatch(/attachment/i);
    });
  });

  describe('測試覆蓋', () => {
    it('應有 useChatStream attachments 守護測試', () => {
      expect(
        readFileSync('app/admin/_components/use-chat-stream.test.ts', 'utf-8'),
        '應測試 attachments',
      ).toMatch(/attachment/i);
    });
  });
});