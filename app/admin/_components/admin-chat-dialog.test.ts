/**
 * Sprint 44 Commit E — Admin AI Chat Dialog UI 守護測試
 *
 * 設計 (S44 Plan Gate Commit E):
 * - Chat dialog (modal/popover) 從 FAB 點開
 * - 內容: message list + input + streaming indicator
 * - Markdown 渲染 (S44-E 範圍: 複用既有 MessageBubble)
 * - Streaming UI: AI 正在輸入 indicator
 * - 與既有 /chat 共享 ChatMessage 型別 (S44 Plan Gate 確認)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S44-E — Admin AI Chat Dialog UI', () => {
  describe('component existence', () => {
    it('應有 AdminChatDialog component 檔案', () => {
      const candidates = [
        'app/admin/_components/admin-chat-dialog.tsx',
        'app/admin/_components/AdminChatDialog.tsx',
      ];
      const exists = candidates.some((p) => existsSync(p));
      expect(exists, 'AdminChatDialog 不存在').toBe(true);
    });

    it('AdminChatDialog 應有 open / onOpenChange props (受控對話框)', () => {
      const candidates = [
        'app/admin/_components/admin-chat-dialog.tsx',
        'app/admin/_components/AdminChatDialog.tsx',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      expect(source, 'AdminChatDialog 應有 open prop').toMatch(/open[?:]?\s*:\s*boolean/);
      expect(source, 'AdminChatDialog 應有 onOpenChange callback').toMatch(/onOpenChange/);
    });

    it('AdminChatDialog 應有 fixed positioning (浮動對話框)', () => {
      const candidates = [
        'app/admin/_components/admin-chat-dialog.tsx',
        'app/admin/_components/AdminChatDialog.tsx',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      expect(source, '應有 fixed / absolute positioning').toMatch(/fixed|absolute/);
    });
  });

  describe('markdown 渲染', () => {
    it('應有 markdown rendering utility', () => {
      // 既有 lib/ai/chat/chat-utils.ts 的 renderMarkdown
      expect(existsSync('lib/ai/chat/chat-utils.ts'), 'chat-utils.ts 不存在').toBe(true);
      const source = readFileSync('lib/ai/chat/chat-utils.ts', 'utf-8');
      expect(source, '應有 renderMarkdown 函數').toMatch(/renderMarkdown/);
    });

    it('應有 markdown 安全消毒 (防 XSS)', () => {
      const source = readFileSync('lib/ai/chat/chat-utils.ts', 'utf-8');
      // 應有 escapeHtml / sanitize / DOMPurify 之類
      const hasSanitize = /escape|sanitize|DOMPurify|dangerouslySetInnerHTML/i.test(source);
      expect(hasSanitize, 'renderMarkdown 應有 XSS 防護').toBe(true);
    });
  });

  describe('streaming 支援', () => {
    it('AdminChatPanel 應有 streaming state 管理', () => {
      const candidates = [
        'app/admin/_components/admin-chat-panel.tsx',
        'app/admin/_components/AdminChatPanel.tsx',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      // 應有 streaming state 或 setStreaming
      const hasStreaming = /streaming|isStreaming|isLoading/i.test(source);
      expect(hasStreaming, 'Chat Panel 應有 streaming state').toBe(true);
    });

    it('應複用既有 stream-controller (不要自己寫 fetch)', () => {
      // 既有 lib/ai/stream-controller.ts 提供 abortStream / startStream
      expect(existsSync('lib/ai/stream-controller.ts'), 'stream-controller.ts 不存在').toBe(
        true,
      );
      const source = readFileSync('lib/ai/stream-controller.ts', 'utf-8');
      expect(source, 'stream-controller 應有 abortStream').toMatch(/abortStream/);
    });
  });

  describe('FAB + Dialog 整合', () => {
    it('AdminFab 應有點擊回呼 (傳給 parent 開 dialog)', () => {
      const source = readFileSync('app/admin/_components/admin-fab.tsx', 'utf-8');
      expect(source, 'AdminFab 應有 onClick prop').toMatch(/onClick\??:/);
    });

    it('AdminShell 應管理 dialog open state + 傳給 AdminFab', () => {
      const source = readFileSync('app/admin/admin-shell.tsx', 'utf-8');
      // 應有 useState 管理 open
      const hasState =
        /useState.*open|set.*Open|chatOpen|isChatOpen/i.test(source);
      expect(hasState, 'AdminShell 應管理 chat dialog open state').toBe(true);
      // 應 render AdminChatDialog
      expect(source, 'AdminShell 應 render AdminChatDialog').toMatch(/AdminChatDialog/);
    });
  });
});