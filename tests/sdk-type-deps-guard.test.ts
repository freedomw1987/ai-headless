/**
 * Sprint 51 Commit 1 (Stage 51-0) — SDK Type Deps source-code guard (FR-18.3)
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.13 (FR-18)
 * 對應 Plan Gate: docs/sprint51-plan-gate.md
 *
 * 設計:
 * - 沿用 Sprint 48-4.1 hotfix 改進: Node.js fs API 遞迴掃描 (避免 shell quote 解析錯誤)
 * - 沿用 Sprint 49-2 UIMessage guard 模式: regex pattern + import 檢測
 *
 * 守護項目:
 * - 無 `from "ai" import FileUIPart` (Sprint 51 新切斷)
 * - 無 `from "ai" import SourceDocumentUIPart` (Sprint 51 新切斷)
 * - 無 `from "ai" import UIMessage` (Sprint 49-2 持續守護)
 * - 無 `from "ai" import ChatStatus` (Sprint 48-2 持續守護)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SCAN_DIRS = ['app', 'lib', 'components'];
const FILE_EXTS = ['.ts', '.tsx'];

type FileScanResult = {
  path: string;
  content: string;
};

/**
 * 遞迴掃描 SCAN_DIRS, 收集所有 .ts / .tsx 檔案內容
 * (沿用 Sprint 48-4.1 hotfix 改進, 避免 execSync(grep) 的 shell quote 解析問題)
 */
function scanTypeScriptFiles(): FileScanResult[] {
  const results: FileScanResult[] = [];

  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (
        stat.isFile() &&
        FILE_EXTS.some((ext) => entry.endsWith(ext)) &&
        !entry.endsWith('.test.ts') &&
        !entry.endsWith('.test.tsx') &&
        !entry.endsWith('.d.ts')
      ) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          results.push({ path: fullPath, content });
        } catch {
          // 跳過無法讀取的檔案
        }
      }
    }
  }

  for (const dir of SCAN_DIRS) {
    if (existsSync(dir)) {
      walk(dir);
    }
  }

  return results;
}

describe('S51 — SDK Type Deps source-code guard (FR-18.3)', () => {
  describe('FR-18.3.1: 切斷後的 SDK 型別不應直接從 "ai" import', () => {
    const files = scanTypeScriptFiles();

    /**
     * 嚴格檢查: 同一行有 `from 'ai'` 且該行 import list 包含指定 SDK 型別
     * 使用多行 regex 對齊同一 import statement
     */
    function findSdKImportViolations(
      sdkType: string,
    ): string[] {
      const pattern = new RegExp(
        `^\\s*import\\s+type\\s*\\{[^}]*\\b${sdkType}\\b[^}]*\\}\\s+from\\s+["']ai["']`,
        'im',
      );
      return files.filter((f) => pattern.test(f.content)).map((f) => f.path);
    }

    it('應掃描到非空檔案清單 (sanity check)', () => {
      expect(files.length).toBeGreaterThan(0);
    });

    it('無 from "ai" import FileUIPart (Sprint 51 新切斷)', () => {
      const violations = findSdKImportViolations('FileUIPart');
      expect(
        violations,
        '從 "ai" import FileUIPart (應改 import 自 ui-message-parts)',
      ).toEqual([]);
    });

    it('無 from "ai" import SourceDocumentUIPart (Sprint 51 新切斷)', () => {
      const violations = findSdKImportViolations('SourceDocumentUIPart');
      expect(
        violations,
        '從 "ai" import SourceDocumentUIPart (應改 import 自 ui-message-parts)',
      ).toEqual([]);
    });

    it('無 from "ai" import UIMessage (Sprint 49-2 持續守護)', () => {
      const violations = findSdKImportViolations('UIMessage');
      expect(
        violations,
        '從 "ai" import UIMessage (應改 import 自 chat-utils)',
      ).toEqual([]);
    });

    it('無 from "ai" import ChatStatus (Sprint 48-2 持續守護)', () => {
      const violations = findSdKImportViolations('ChatStatus');
      expect(
        violations,
        '從 "ai" import ChatStatus (應改 import 自 chat-utils)',
      ).toEqual([]);
    });
  });

  describe('FR-18.3.2: 自訂型別檔案存在', () => {
    it('lib/ai/chat/ui-message-parts.ts 應存在 (FR-18.1)', () => {
      expect(
        existsSync('lib/ai/chat/ui-message-parts.ts'),
        'lib/ai/chat/ui-message-parts.ts 不存在',
      ).toBe(true);
    });
  });

  describe('FR-18.3.3: prompt-input.tsx 改 import 自 ui-message-parts (FR-18.2)', () => {
    it('prompt-input.tsx 不應從 "ai" import FileUIPart 或 SourceDocumentUIPart', () => {
      const source = readFileSync(
        'components/ai-elements/prompt-input.tsx',
        'utf-8',
      );
      expect(
        /from\s+["']ai["']/i.test(source) &&
          /\bFileUIPart\b/.test(source),
        'prompt-input.tsx 不應從 "ai" import FileUIPart',
      ).toBe(false);
      expect(
        /from\s+["']ai["']/i.test(source) &&
          /\bSourceDocumentUIPart\b/.test(source),
        'prompt-input.tsx 不應從 "ai" import SourceDocumentUIPart',
      ).toBe(false);
    });

    it('prompt-input.tsx 應從 ui-message-parts import', () => {
      const source = readFileSync(
        'components/ai-elements/prompt-input.tsx',
        'utf-8',
      );
      expect(
        source,
        '應從 @/lib/ai/chat/ui-message-parts import',
      ).toMatch(
        /from\s+["']@\/lib\/ai\/chat\/ui-message-parts["']/,
      );
    });
  });

  describe('FR-18.3.4: 自訂型別欄位完整', () => {
    it('FileUIPart 應有 type="file" + mediaType + filename? + url + providerMetadata?', () => {
      const source = readFileSync(
        'lib/ai/chat/ui-message-parts.ts',
        'utf-8',
      );
      // 必須有 type: 'file' literal
      expect(source, 'FileUIPart 應有 type: \'file\'').toMatch(
        /type\s*:\s*['"]file['"]/,
      );
      // 必須有 mediaType
      expect(source, 'FileUIPart 應有 mediaType').toMatch(/mediaType/);
      // 必須有 filename?
      expect(source, 'FileUIPart 應有 filename?').toMatch(/filename\s*\?/);
      // 必須有 url
      expect(source, 'FileUIPart 應有 url').toMatch(/url/);
      // 必須有 providerMetadata?
      expect(source, 'FileUIPart 應有 providerMetadata?').toMatch(
        /providerMetadata\s*\?/,
      );
    });

    it('SourceDocumentUIPart 應有 type="source-document" + sourceId + mediaType + title + filename? + providerMetadata?', () => {
      const source = readFileSync(
        'lib/ai/chat/ui-message-parts.ts',
        'utf-8',
      );
      expect(
        source,
        'SourceDocumentUIPart 應有 type: \'source-document\'',
      ).toMatch(/type\s*:\s*['"]source-document['"]/);
      expect(source, '應有 sourceId').toMatch(/sourceId/);
      expect(source, '應有 mediaType').toMatch(/mediaType/);
      expect(source, '應有 title').toMatch(/title/);
      expect(source, '應有 filename?').toMatch(/filename\s*\?/);
      expect(source, '應有 providerMetadata?').toMatch(
        /providerMetadata\s*\?/,
      );
    });
  });
});