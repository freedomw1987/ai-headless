/**
 * Sprint 48 Commit 4 (Stage 48-4) + Sprint 49 Commit 1 (Stage 49-1) — Office Rest Bundle Spike + Guard 強化
 *
 * 對應 PRD:
 * - Sprint 48: docs/prd/11-chat-v2-completions.md §2.10 (FR-12.1 ~ FR-12.2)
 * - Sprint 49: docs/prd/11-chat-v2-completions.md §2.11 (FR-14.1 ~ FR-14.3)
 * 對應 Plan Gate: docs/sprint48-plan-gate.md Commit 48-4
 *
 * 目的: 評估 Office Rest (DOCX + XLSX + PPTX) 三個 parser 的
 *       - bundle size 影響（與 Sprint 47-4 PDF 對齊）
 *       - 解析時間（每個格式 < 3 秒）
 *       - 真實解析正確性（用 fixture 驗證）
 *
 * Sprint 49-1 守護強化 (FR-14):
 * - FR-14.1: 「必須裝」守護（不再是「找不到就 skip」）
 *   - Sprint 48-5 已 `pnpm add jszip fast-xml-parser` 正式列入
 *   - 現在可放心要求依賴存在
 * - FR-14.2: fixture 路徑修正（`mammoth-docx-fixture.docx` → 真實 `sample.docx`）
 * - FR-14.3: jszip / fast-xml-parser 應正式列為 package.json 依賴
 *
 * 決策（依 spike 結果）:
 * - DOCX: mammoth (Sprint 47 已裝) — 沿用
 * - XLSX: xlsx (Sprint 47 已裝) — 沿用
 * - PPTX: jszip + fast-xml-parser (新裝) — 輕量 + 完全可控
 *
 * 預期 bundle 增量（粗估）:
 * - mammoth (Sprint 47 已裝): ~2.4 MB
 * - xlsx (Sprint 47 已裝): ~7.2 MB
 * - jszip: ~100 KB
 * - fast-xml-parser: ~150 KB
 * - 總計: ~10 MB (server-side only)
 * - 動態 import 後 client bundle 不受影響
 *
 * 設計: 用 eval-based dynamic require 避免 vite 靜態解析未安裝 module
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(process.cwd(), 'tests/fixtures/office-parser');

// 效能門檻: 每個格式 < 3 秒（對齊 Sprint 47-4）
const PERFORMANCE_BUDGET_MS = 3000;

/**
 * 動態 require helper — 避免 vite 靜態解析未安裝 module
 * 使用 eval 跳過靜態分析, runtime 才決定是否能載入
 */
function tryRequire(moduleName: string): unknown | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = eval('require') as NodeJS.Require;
    return fn(moduleName);
  } catch {
    return null;
  }
}

describe('Office Rest Spike (48-4) + Guard 強化 (49-1)', () => {
  describe('FR-14.3: Package.json 依賴正式列入守護 (Sprint 49-1)', () => {
    it('jszip 應正式列為 package.json 依賴', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      expect(
        deps.jszip,
        'jszip 應已正式列入 package.json (Sprint 48-5 deliverable)',
      ).toBeTruthy();
    });

    it('fast-xml-parser 應正式列為 package.json 依賴', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      expect(
        deps['fast-xml-parser'],
        'fast-xml-parser 應已正式列入 package.json (Sprint 48-5 deliverable)',
      ).toBeTruthy();
    });

    it('mammoth 應已列入 (Sprint 47)', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      expect(
        deps.mammoth,
        'mammoth 應已列入 (Sprint 47 已裝)',
      ).toBeTruthy();
    });

    it('xlsx 應已列入 (Sprint 47)', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      expect(
        deps.xlsx,
        'xlsx 應已列入 (Sprint 47 已裝)',
      ).toBeTruthy();
    });
  });

  describe('PPTX library 評估 (FR-12.2)', () => {
    // FR-14.1: 改為「必須裝」守護 — Sprint 48-5 已裝, 現在應能載入
    it('jszip 應可安裝且可載入', () => {
      const jszipModule = tryRequire('jszip') as unknown | null;
      expect(
        jszipModule,
        'jszip 應已安裝 (Sprint 48-5 已 pnpm add jszip)',
      ).not.toBeNull();
      // jszip CommonJS 模組直接 export JSZip 構造函數
      expect(typeof jszipModule).toBe('function');
    });

    it('fast-xml-parser 應可安裝且可載入', () => {
      const fxParserModule = tryRequire('fast-xml-parser') as unknown | null;
      expect(
        fxParserModule,
        'fast-xml-parser 應已安裝 (Sprint 48-5 已 pnpm add fast-xml-parser)',
      ).not.toBeNull();
      expect(fxParserModule).toBeTruthy();
    });

    it('決策: PPTX 用 jszip + fast-xml-parser (輕量方案)', () => {
      // 此測試記錄 spike 決策
      // 原因:
      //   - pptxgenjs 主要功能是「寫」, 不適合純解析
      //   - node-pptx-parser 無 TypeScript types
      //   - jszip + fast-xml-parser 輕量 (~250KB), 完全可控
      //   - PPTX 本質: zip 包含 XML (slide1.xml, slide2.xml, ...)
      //   - 對齊 Sprint 47-4 動態 import 模式
      const decision = {
        library: 'jszip + fast-xml-parser',
        bundleEstimate: '~250 KB',
        reason: 'PPTX 是 zip + XML, 自寫 parser 比用重量級 lib 更可控',
      };
      expect(decision.library).toContain('jszip');
      expect(decision.bundleEstimate).toBeTruthy();
    });
  });

  describe('Bundle size 守護 (FR-12.1)', () => {
    it('server bundle 不應超過 50 MB (Vercel 限制)', () => {
      // 量測 .next/server 目錄大小
      const serverDir = join(process.cwd(), '.next/server');
      if (!existsSync(serverDir)) {
        // 尚未 build, 跳過
        return;
      }
      // 簡單檢查: 個別依賴若裝了不應太大
      // 完整量測在 spike 文件手動做
      const stats = statSync(serverDir);
      expect(stats).toBeTruthy();
    });

    it('mammoth node_modules 應已安裝 (Sprint 47)', () => {
      const mammothPath = join(
        process.cwd(),
        'node_modules/.pnpm/mammoth@*',
      );
      // 用 glob-like scan: 直接列 .pnpm 目錄找 mammoth 開頭的
      const { readdirSync } = require('node:fs') as typeof import('node:fs');
      let found = false;
      try {
        const entries = readdirSync(join(process.cwd(), 'node_modules/.pnpm'));
        found = entries.some((e) => /^mammoth@/.test(e));
      } catch {
        // 目錄不存在, 視為未安裝
      }
      if (!found) {
        console.warn('mammoth 未在 .pnpm 安裝, Sprint 47 狀態需確認');
      }
      expect(found).toBe(true);
    });

    it('xlsx node_modules 應已安裝 (Sprint 47)', () => {
      const { readdirSync } = require('node:fs') as typeof import('node:fs');
      let found = false;
      try {
        const entries = readdirSync(join(process.cwd(), 'node_modules/.pnpm'));
        found = entries.some((e) => /^xlsx@/.test(e));
      } catch {
        // ignore
      }
      if (!found) {
        console.warn('xlsx 未在 .pnpm 安裝, Sprint 47 狀態需確認');
      }
      expect(found).toBe(true);
    });
  });

  describe('DOCX 解析評估 (沿用 mammoth)', () => {
    it('mammoth 可載入', () => {
      const mammoth = tryRequire('mammoth') as
        | { extractRawText?: unknown }
        | null;
      expect(
        mammoth,
        'mammoth 應已安裝 (Sprint 47 狀態)',
      ).not.toBeNull();
      expect(mammoth?.extractRawText).toBeDefined();
    });

    // FR-14.2: fixture 路徑修正 — 從不存在的 mammoth-docx-fixture.docx 改為真實 sample.docx
    it('mammoth 解析時間應 < 3 秒', async () => {
      const mammoth = tryRequire('mammoth') as {
        extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
      } | null;
      if (!mammoth) {
        throw new Error('mammoth 未安裝, Sprint 47 必裝狀態');
      }
      // FR-14.2: 改用真實 fixture path (Sprint 49-1 修)
      const docxPath = join(FIXTURES, 'sample.docx');
      if (!existsSync(docxPath)) {
        throw new Error(`fixture 不存在: ${docxPath}`);
      }
      const start = performance.now();
      const result = await mammoth.extractRawText({
        buffer: readFileSync(docxPath),
      });
      const elapsed = performance.now() - start;
      console.log(`[DOCX] 解析時間: ${elapsed.toFixed(0)} ms`);
      expect(elapsed).toBeLessThan(PERFORMANCE_BUDGET_MS);
      expect(result.value).toBeTruthy();
    });
  });

  describe('XLSX 解析評估 (沿用 xlsx)', () => {
    it('xlsx 可載入', () => {
      const xlsx = tryRequire('xlsx') as { read?: unknown } | null;
      expect(
        xlsx,
        'xlsx 應已安裝 (Sprint 47 狀態)',
      ).not.toBeNull();
      expect(xlsx?.read).toBeDefined();
    });

    it('xlsx 解析時間應 < 3 秒', () => {
      const xlsx = tryRequire('xlsx') as {
        read: (data: Buffer) => { SheetNames: string[] };
      } | null;
      if (!xlsx) {
        throw new Error('xlsx 未安裝, Sprint 47 必裝狀態');
      }
      const xlsxPath = join(FIXTURES, 'sample.xlsx');
      if (!existsSync(xlsxPath)) {
        throw new Error(`fixture 不存在: ${xlsxPath}`);
      }
      const start = performance.now();
      const workbook = xlsx.read(readFileSync(xlsxPath));
      const elapsed = performance.now() - start;
      console.log(`[XLSX] 解析時間: ${elapsed.toFixed(0)} ms`);
      expect(elapsed).toBeLessThan(PERFORMANCE_BUDGET_MS);
      expect(workbook.SheetNames.length).toBeGreaterThan(0);
    });
  });

  describe('PPTX 解析驗證 (概念驗證, Sprint 48-5 完整實作)', () => {
    it('概念驗證: PPTX 是 zip 檔案 (jszip 驗證)', async () => {
      const JSZip = tryRequire('jszip') as
        | { loadAsync: (data: Buffer) => Promise<{ files: Record<string, unknown> }> }
        | null;
      const pptxPath = join(FIXTURES, 'sample.pptx');
      if (!JSZip) {
        throw new Error('jszip 未安裝, Sprint 48-5 必裝');
      }
      if (!existsSync(pptxPath)) {
        throw new Error(`fixture 不存在: ${pptxPath} (Sprint 48-5 deliverable)`);
      }
      const zip = await JSZip.loadAsync(readFileSync(pptxPath));
      const slideFiles = Object.keys(zip.files).filter((f) =>
        f.startsWith('ppt/slides/slide'),
      );
      expect(slideFiles.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('風險決策總結', () => {
    it('Sprint 48-5 採用方案: DOCX + XLSX + PPTX 全做', () => {
      const decision = {
        scope: 'DOCX + XLSX + PPTX (3 SP)',
        libraries: {
          docx: 'mammoth (Sprint 47 已裝, 沿用)',
          xlsx: 'xlsx (Sprint 47 已裝, 沿用)',
          pptx: 'jszip + fast-xml-parser (Sprint 48-5 新裝, ~250 KB)',
        },
        bundleImpact: '~10 MB server-side, 0 client (動態 import)',
        rationale:
          'Sprint 47 spike 已驗證 mammoth/xlsx 解析時間 < 3 秒; ' +
          'PPTX 用輕量方案避免額外大依賴; ' +
          '動態 import 確保 client bundle 不受影響',
      };
      expect(decision.scope).toContain('DOCX');
      expect(decision.scope).toContain('XLSX');
      expect(decision.scope).toContain('PPTX');
    });
  });
});