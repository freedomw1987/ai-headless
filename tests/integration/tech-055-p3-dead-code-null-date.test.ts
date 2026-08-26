/**
 * Sprint 20 P3 技術債清理 — 守護測試
 *
 * 涵蓋兩個 P3：
 * 1. Dead code：`dynamic-handler.ts:268-269`（Sprint 19 reviewer 提）
 * 2. publishedAt: null PUT 400（Sprint 18 留下）
 *
 * 為什麼用靜態分析守護：
 * - Dead code 難以用行為測試（return 一樣）
 * - 但靜態讀檔可以驗證「沒有重複 if (!item)」結構
 * - publishedAt null：行為測試需要建 DB 環境，靜態分析驗證 schema 接受 null
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const HANDLER_PATH = resolve(ROOT, 'lib/runtime/dynamic-handler.ts');

describe('Sprint 20 P3 — Dead code + null date 修復守護', () => {
  describe('P3-1 — Dead code 清理（get handler 連續兩行 if (!item)）', () => {
    it('get handler 區塊只允許一次「if (!item) return 404」', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      // 取出 get handler 區塊（從 `const get:` 開始到下個 `const ` 定義為止）
      const getStart = content.indexOf("const get: DynamicHandlers['get']");
      expect(getStart).toBeGreaterThan(-1);
      const afterGet = content.indexOf('\n  const ', getStart + 30);
      const getBlock = content.slice(getStart, afterGet);
      // 計數「if (!item) return」出現次數
      const matches = getBlock.match(/if \(!item\) return/g) ?? [];
      expect(matches.length).toBe(1);
    });
  });

  describe('P3-2 — Date/Datetime 欄位可接受 null（清空場景）', () => {
    it('fieldToZod 對 date type 接受 null', () => {
      const content = readFileSync(HANDLER_PATH, 'utf-8');
      // 取出 fieldToZod 函式（從 `function fieldToZod` 開始）
      const fnStart = content.indexOf('function fieldToZod');
      expect(fnStart).toBeGreaterThan(-1);
      const fnEnd = content.indexOf('\nfunction ', fnStart + 20);
      const fnBody = content.slice(fnStart, fnEnd);

      // datetime case 內含 z.null()
      // 找 `case 'date'` 區塊（會延續到 `case 'datetime'`）
      const dateCaseMatch = fnBody.match(/case\s+['"]date['"]\s*:[\s\S]*?case\s+['"]datetime['"]\s*:[\s\S]*?break;/);
      expect(dateCaseMatch).not.toBeNull();
      if (dateCaseMatch) {
        expect(dateCaseMatch[0]).toMatch(/z\.null\(\)/);
      }
    });
  });
});