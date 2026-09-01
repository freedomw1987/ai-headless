/**
 * Sprint 48 Commit 2 (Stage 48-2) — ChatStatus Type Guard
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.10 (FR-10.1 ~ FR-10.3)
 *
 * 守護目的:
 * - 自訂 ChatStatus 型別在 chat-utils.ts (取代 'ai' SDK ChatStatus)
 * - 確保 use-chat-stream.ts 不再 import from 'ai'
 * - 確保 4 個值都正確 (ready / submitted / streaming / error)
 *
 * 對應 Sprint 46 reflection P2 揭露:
 * - use-chat-stream.ts 從 'ai' SDK import ChatStatus 型別
 * - 整個專案 Sprint 45 起都刻意避免依賴 AI SDK UIMessage
 * - 卻唯獨 ChatStatus 用 'ai' SDK 型別
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('S48-2 — ChatStatus Type Guard (FR-10.1 ~ FR-10.3)', () => {
  describe('FR-10.1: chat-utils.ts 自訂 ChatStatus 型別', () => {
    it('chat-utils.ts 應存在', () => {
      expect(existsSync('lib/ai/chat/chat-utils.ts')).toBe(true);
    });

    it('chat-utils.ts 應 export ChatStatus 型別', () => {
      const source = readFileSync('lib/ai/chat/chat-utils.ts', 'utf-8');
      expect(source, '應 export ChatStatus type').toMatch(
        /export\s+type\s+ChatStatus\s*=/,
      );
    });

    it('ChatStatus 應包含 4 個值: ready, submitted, streaming, error', () => {
      const source = readFileSync('lib/ai/chat/chat-utils.ts', 'utf-8');
      // 抓出 type ChatStatus = ...;
      const match = source.match(/export\s+type\s+ChatStatus\s*=\s*([^;]+);/);
      expect(match, '應有 ChatStatus 型別定義').toBeTruthy();
      const typeDef = match?.[1] ?? '';
      expect(typeDef, '應包含 ready').toMatch(/'ready'/);
      expect(typeDef, '應包含 submitted').toMatch(/'submitted'/);
      expect(typeDef, '應包含 streaming').toMatch(/'streaming'/);
      expect(typeDef, '應包含 error').toMatch(/'error'/);
    });

    it('ChatStatus 應為 string union (string literal union)', () => {
      const source = readFileSync('lib/ai/chat/chat-utils.ts', 'utf-8');
      const match = source.match(/export\s+type\s+ChatStatus\s*=\s*([^;]+);/);
      const typeDef = match?.[1] ?? '';
      // 應為 4 個 string literal 用 | 連接
      expect(typeDef).toMatch(/'[^']+'\s*\|\s*'[^']+'\s*\|\s*'[^']+'\s*\|\s*'[^']+'/);
    });
  });

  describe('FR-10.2: use-chat-stream.ts 不再 import from ai', () => {
    it('use-chat-stream.ts 應存在', () => {
      expect(existsSync('app/admin/_components/use-chat-stream.ts')).toBe(true);
    });

    it('use-chat-stream.ts 不應有 from \'ai\' 引用', () => {
      const source = readFileSync('app/admin/_components/use-chat-stream.ts', 'utf-8');
      expect(
        source,
        '不應有 from \'ai\' 或 from "ai"',
      ).not.toMatch(/from\s+['"]ai['"]/);
    });

    it('use-chat-stream.ts 應從 chat-utils import ChatStatus', () => {
      const source = readFileSync('app/admin/_components/use-chat-stream.ts', 'utf-8');
      expect(
        source,
        '應從 chat-utils import ChatStatus',
      ).toMatch(/from\s+['"]@?\/lib\/ai\/chat\/chat-utils['"]/);
    });
  });

  describe('FR-10.3: source-code guard 全專案無 ChatStatus 從 ai import', () => {
    // 動態掃描所有 .ts/.tsx 檔案, 不應有從 'ai' import ChatStatus
    // Sprint 48-4.1 hotfix: 改用 Node.js fs API 遞迴掃描

    it('全專案不應從 \'ai\' SDK import ChatStatus', () => {
      // Sprint 48-4.1 hotfix: 用 Node.js 原生 fs API 遞迱掃描, 避免 shell quote 解析問題
      // 之前用 execSync(grep) 被 sh 吃掉 quote, 守護失效
      // regex 接受單/雙引號: /from\s+["']ai["']/i
      const chatStatusImports: string[] = [];
      const SCAN_DIRS = ['app', 'lib', 'components'];

      function scanDir(dir: string) {
        if (!existsSync(dir)) return;
        for (const entry of readdirSync(dir)) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (/\.(ts|tsx)$/.test(entry)) {
            const source = readFileSync(fullPath, 'utf-8');
            const lines = source.split('\n');
            for (const line of lines) {
              if (
                /from\s+["']ai["']/i.test(line) &&
                /ChatStatus/i.test(line)
              ) {
                chatStatusImports.push(`${fullPath}: ${line.trim()}`);
              }
            }
          }
        }
      }

      for (const dir of SCAN_DIRS) {
        scanDir(dir);
      }

      expect(
        chatStatusImports,
        `不應從 'ai' SDK import ChatStatus (實際: ${chatStatusImports.length})\n${chatStatusImports.join('\n')}`,
      ).toHaveLength(0);
    });
  });
});