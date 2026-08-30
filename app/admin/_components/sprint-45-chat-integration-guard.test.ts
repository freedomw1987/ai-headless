/**
 * Sprint 45 Commit B — AI Elements 整合守護測試
 *
 * 設計 (S45 Plan Gate Commit B - 混合方案):
 * - AdminChatPanel 用 AI Elements 元件:
 *   - Conversation (訊息容器, 含 auto-scroll)
 *   - Message (訊息渲染)
 *   - PromptInput (輸入框)
 * - 保留自製 SSE parsing hook (useChatStream - 已存在, 串 /api/admin/chat/stream)
 * - 保留 Sprint 43 createProviderFromDB (Custom URL)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('S45-B — AI Elements 整合', () => {
  describe('元件 import', () => {
    it('AdminChatPanel 應 import Conversation', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應 import Conversation').toMatch(
        /import\s*\{[^}]*\bConversation\b[^}]*\}\s*from\s*['"]@\/components\/ai-elements\/conversation['"]/,
      );
    });

    it('AdminChatPanel 應 import Message', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應 import Message').toMatch(
        /import\s*\{[^}]*\bMessage\b[^}]*\}\s*from\s*['"]@\/components\/ai-elements\/message['"]/,
      );
    });

    it('AdminChatPanel 應 import PromptInput', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應 import PromptInput').toMatch(
        /import\s*\{[^}]*\bPromptInput\b[^}]*\}\s*from\s*['"]@\/components\/ai-elements\/prompt-input['"]/,
      );
    });
  });

  describe('自製 SSE hook', () => {
    it('應有 useChatStream hook (S45-B 整合層)', () => {
      const candidates = [
        'app/admin/_components/use-chat-stream.ts',
        'app/admin/_components/use-chat-stream.tsx',
        'lib/ai/chat/use-chat-stream.ts',
      ];
      const exists = candidates.some((p) => existsSync(p));
      expect(exists, 'useChatStream hook 不存在').toBe(true);
    });

    it('useChatStream 應呼叫 /api/admin/chat/stream', () => {
      const candidates = [
        'app/admin/_components/use-chat-stream.ts',
        'app/admin/_components/use-chat-stream.tsx',
        'lib/ai/chat/use-chat-stream.ts',
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) return;
      const source = readFileSync(path, 'utf-8');
      expect(source, '應打 admin chat stream').toMatch(/\/api\/admin\/chat\/stream/);
    });
  });

  describe('移除舊自製元件', () => {
    it('AdminChatPanel 不應再 import 舊的 MessageBubble (改用 Message)', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      const stillUsesOld = /from\s+['"]@\/components\/chat\/message-bubble['"]/.test(source);
      expect(stillUsesOld, '不應再用 MessageBubble (改用 Message)').toBe(false);
    });

    it('AdminChatPanel 不應再 import 舊的 ChatInput (改用 PromptInput)', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      const stillUsesOld = /from\s+['"]@\/components\/chat\/chat-input['"]/.test(source);
      expect(stillUsesOld, '不應再用 ChatInput (改用 PromptInput)').toBe(false);
    });
  });

  describe('功能保留', () => {
    it('應保留 session 切換功能', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應有 sessionId prop').toMatch(/sessionId/);
    });

    it('應保留 streaming indicator', () => {
      const source = readFileSync('app/admin/_components/admin-chat-panel.tsx', 'utf-8');
      expect(source, '應有 streaming state').toMatch(/streaming|isStreaming|status/);
    });
  });
});