import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * S49-2 — UIMessage SDK Deps Guard (FR-15.4)
 *
 * 守護項目:
 * - FR-15.4: 全專案不應從 'ai' SDK import UIMessage
 *
 * 來源:
 * - Sprint 48 reflection #5: UIMessage 系列切斷
 * - Sprint 49-0 spike: 採用「方案 1 + 刪除 dead code」
 *
 * 設計:
 * - 用 Node.js fs API 遞迴掃描 (沿用 Sprint 48-4.1 hotfix 改進)
 * - regex: /from\s+["']ai["']/i (單/雙引號都抓)
 * - 額外 filter: /import.*UIMessage/i (確保只守護 UIMessage import)
 *
 * 對齊 Sprint 48-4.1 chat-status-guard 守護強化方式
 */

describe('S49-2 — UIMessage SDK Deps Guard (FR-15.4)', () => {
  describe('FR-15.4: source-code guard 全專案無 UIMessage 從 ai import', () => {
    // Sprint 48-4.1 hotfix: 用 Node.js fs API 遞迴掃描, 避免 shell quote 解析問題
    it('全專案不應從 \'ai\' SDK import UIMessage', () => {
      const uIMessageImports: string[] = [];
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
                /UIMessage/i.test(line)
              ) {
                uIMessageImports.push(`${fullPath}: ${line.trim()}`);
              }
            }
          }
        }
      }

      for (const dir of SCAN_DIRS) {
        scanDir(dir);
      }

      expect(
        uIMessageImports,
        `不應從 'ai' SDK import UIMessage (實際: ${uIMessageImports.length})\n${uIMessageImports.join('\n')}`,
      ).toHaveLength(0);
    });
  });

  describe('dead code 移除驗證 (Sprint 49-0 spike 結論)', () => {
    it('conversation.tsx 不應 export messagesToMarkdown', () => {
      const source = readFileSync(
        'components/ai-elements/conversation.tsx',
        'utf-8',
      );
      expect(
        source.includes('export const messagesToMarkdown'),
        'Sprint 49-0 spike 揭露的 dead code 應已移除',
      ).toBe(false);
    });

    it('conversation.tsx 不應 export ConversationDownload', () => {
      const source = readFileSync(
        'components/ai-elements/conversation.tsx',
        'utf-8',
      );
      expect(
        source.includes('export const ConversationDownload'),
        'Sprint 49-0 spike 揭露的 dead code 應已移除',
      ).toBe(false);
    });
  });
});