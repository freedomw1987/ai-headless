/**
 * S52-0 — Extension Generator Spike Guard (FR-19.1)
 *
 * Sprint 52 Stage 52-0 spike 完成證明:
 * - 驗證 pi agent 可從 chat prompt 生成 extensions 程式碼
 * - 評估 AI 生成 manifest.json + spec.json + hook 的品質
 * - 產出 spike 文件 docs/spike/sprint52-ai-extension-gen.md
 *
 * 守護項目:
 * - spike 文件存在
 * - pi agent 可用性評估記錄
 * - spike 結論明確 (採用方案 / 不可行 / 需調整)
 * - 後續 Sprint 52-1 + 52-2 行動清單
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';

describe('S52-0 — Extension Generator Spike Guard (FR-19.1)', () => {
  describe('FR-19.1.1: 評估檔案存在', () => {
    it('lib/ai/agent-sdk/agent-sdk.ts 應存在 (pi agent SDK)', () => {
      expect(existsSync('lib/ai/agent-sdk/agent-sdk.ts')).toBe(true);
    });

    it('extensions/todo/manifest.json 應存在 (範本)', () => {
      expect(existsSync('extensions/todo/manifest.json')).toBe(true);
    });

    it('extensions/todo/todo-spec.json 應存在 (spec 範本)', () => {
      expect(existsSync('extensions/todo/todo-spec.json')).toBe(true);
    });
  });

  describe('FR-19.1.2: Spike 文件完整性', () => {
    it('spike 文件應存在', () => {
      expect(
        existsSync('docs/spike/sprint52-ai-extension-gen.md'),
        'Sprint 52-0 spike 文件應存在',
      ).toBe(true);
    });

    it('spike 文件應包含 pi agent 可用性評估', () => {
      const source = readFileSync(
        'docs/spike/sprint52-ai-extension-gen.md',
        'utf-8',
      );
      // 應評估 pi agent 是否能生成 extensions 程式碼
      expect(source).toContain('pi agent');
      // 應評估 manifest.json
      expect(source).toMatch(/manifest\.json/);
      // 應評估 spec.json
      expect(source).toMatch(/spec\.json/);
    });

    it('spike 文件應包含 4 個替代方案評估', () => {
      const source = readFileSync(
        'docs/spike/sprint52-ai-extension-gen.md',
        'utf-8',
      );
      // 至少 3 個方案關鍵字（方案 A/B/C 或 similar）
      const planGateOptions = (source.match(/方案\s*[A-D]/g) || []).length;
      expect(
        planGateOptions,
        'spike 文件應列出多個替代方案',
      ).toBeGreaterThanOrEqual(3);
    });

    it('spike 文件應明確結論 (採用/不可行/需調整)', () => {
      const source = readFileSync(
        'docs/spike/sprint52-ai-extension-gen.md',
        'utf-8',
      );
      // 應有「結論」「採用」「不可行」等關鍵字
      const hasConclusion =
        /結論[:：]/i.test(source) ||
        /採用\s+方案/i.test(source) ||
        /不可行/i.test(source);
      expect(
        hasConclusion,
        'spike 文件應有明確結論',
      ).toBe(true);
    });

    it('spike 文件應列出 Sprint 52-1 + 52-2 行動清單', () => {
      const source = readFileSync(
        'docs/spike/sprint52-ai-extension-gen.md',
        'utf-8',
      );
      // 應引用後續 stage
      expect(source).toMatch(/Sprint 52-1|Sprint 52-2|Stage 52-1|Stage 52-2/);
    });
  });

  describe('FR-19.1.3: 評估產物 (若 AI 生成已執行)', () => {
    it('若 spike 結論採用, 應有 spike 守護快照 (extensions/product/ 結構)', () => {
      const source = readFileSync(
        'docs/spike/sprint52-ai-extension-gen.md',
        'utf-8',
      );

      // 若 spike 結論為「不可行」, 此測試 skip
      if (/不可行/i.test(source)) {
        // 不可行情境下, 不預期 extensions/product/ 存在
        return;
      }

      // 採用情境下, 若尚未實際生成 extensions/product/, spike 文件應明確記錄「待生成」
      const spikeHasPendingMarker =
        /待生成|to be generated|TBD/i.test(source) ||
        existsSync('extensions/product/');

      expect(
        spikeHasPendingMarker,
        'spike 文件應明確標記待生成, 或 extensions/product/ 已存在',
      ).toBe(true);
    });
  });

  describe('FR-19.1.4: 文件大小合理', () => {
    it('spike 文件應至少有 3000 bytes (含詳細評估)', () => {
      const stat = statSync('docs/spike/sprint52-ai-extension-gen.md');
      expect(
        stat.size,
        'spike 文件太小, 應含詳細評估',
      ).toBeGreaterThanOrEqual(3000);
    });
  });
});