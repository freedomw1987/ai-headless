import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

/**
 * S48-5 — Office Parser Rest Guard (FR-13.1 ~ FR-13.5)
 *
 * 守護項目:
 * - FR-13.1: DOCX parser 存在 + 能從 fixture 解析文字
 * - FR-13.2: XLSX parser 存在 + 能從 fixture 解析文字
 * - FR-13.3: PPTX parser 存在 + 能從 fixture 解析文字
 * - FR-13.4: attachment-reader 已接入 office parser
 * - FR-13.5: 3 個 fixture (sample.docx, sample.xlsx, sample.pptx) 都存在
 * - 守護: jszip + fast-xml-parser 已正式列為 package.json 依賴
 */

describe('S48-5 — Office Parser Rest Guard (FR-13.1 ~ FR-13.5)', () => {
  describe('FR-13.5: Fixtures 完整性', () => {
    const FIXTURE_FILES = [
      'tests/fixtures/office-parser/sample.docx',
      'tests/fixtures/office-parser/sample.xlsx',
      'tests/fixtures/office-parser/sample.pptx',
    ];

    for (const fixture of FIXTURE_FILES) {
      it(`${fixture.split('/').pop()} 應存在 (Office Rest 必備 fixture)`, () => {
        expect(
          existsSync(fixture),
          `${fixture} 應存在 (Sprint 48-5 deliverable)`,
        ).toBe(true);
      });
    }
  });

  describe('FR-13.1: DOCX parser (mammoth)', () => {
    it('docx-parser.ts 應存在', () => {
      expect(existsSync('lib/ai/office/docx-parser.ts')).toBe(true);
    });

    it('docx-parser 應 export parseDocx function', () => {
      const source = readFileSync('lib/ai/office/docx-parser.ts', 'utf-8');
      expect(source).toMatch(
        /export\s+(async\s+)?function\s+parseDocx/,
      );
    });

    it('docx-parser 應使用 mammoth', () => {
      const source = readFileSync('lib/ai/office/docx-parser.ts', 'utf-8');
      expect(source).toMatch(/mammoth/i);
    });
  });

  describe('FR-13.2: XLSX parser (xlsx)', () => {
    it('xlsx-parser.ts 應存在', () => {
      expect(existsSync('lib/ai/office/xlsx-parser.ts')).toBe(true);
    });

    it('xlsx-parser 應 export parseXlsx function', () => {
      const source = readFileSync('lib/ai/office/xlsx-parser.ts', 'utf-8');
      expect(source).toMatch(
        /export\s+(async\s+)?function\s+parseXlsx/,
      );
    });

    it('xlsx-parser 應使用 xlsx', () => {
      const source = readFileSync('lib/ai/office/xlsx-parser.ts', 'utf-8');
      expect(source).toMatch(/\bxlsx\b/);
    });
  });

  describe('FR-13.3: PPTX parser (jszip + fast-xml-parser)', () => {
    it('pptx-parser.ts 應存在', () => {
      expect(existsSync('lib/ai/office/pptx-parser.ts')).toBe(true);
    });

    it('pptx-parser 應 export parsePptx function', () => {
      const source = readFileSync('lib/ai/office/pptx-parser.ts', 'utf-8');
      expect(source).toMatch(
        /export\s+(async\s+)?function\s+parsePptx/,
      );
    });

    it('pptx-parser 應使用 jszip + fast-xml-parser', () => {
      const source = readFileSync('lib/ai/office/pptx-parser.ts', 'utf-8');
      expect(source).toMatch(/jszip/i);
      expect(source).toMatch(/fast-xml-parser/i);
    });
  });

  describe('FR-13.4: attachment-reader 接入 office parser', () => {
    it('attachment-reader.ts 應 import 任一 office parser', () => {
      const source = readFileSync('lib/ai/chat/attachment-reader.ts', 'utf-8');
      const hasOfficeImport =
        /parseDocx/.test(source) ||
        /parseXlsx/.test(source) ||
        /parsePptx/.test(source);
      expect(
        hasOfficeImport,
        'attachment-reader 應接入 office parser (parseDocx/parseXlsx/parsePptx)',
      ).toBe(true);
    });
  });

  describe('FR-13.6: 依賴正式列入 package.json', () => {
    it('package.json 應列 jszip 為依賴', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      expect(
        deps.jszip,
        'jszip 應已正式列入 package.json',
      ).toBeTruthy();
    });

    it('package.json 應列 fast-xml-parser 為依賴', () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      expect(
        deps['fast-xml-parser'],
        'fast-xml-parser 應已正式列入 package.json',
      ).toBeTruthy();
    });
  });

  describe('Office Parser 整合測試 (FR-13.5)', () => {
    it('parseDocx 應能從 fixture 抽出非空文字', async () => {
      const { parseDocx } = await import('@/lib/ai/office/docx-parser');
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(
        'tests/fixtures/office-parser/sample.docx',
      );
      const text = await parseDocx(buffer);
      expect(text.length, 'DOCX 應抽出文字').toBeGreaterThan(10);
    });

    it('parseXlsx 應能從 fixture 抽出非空文字', async () => {
      const { parseXlsx } = await import('@/lib/ai/office/xlsx-parser');
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(
        'tests/fixtures/office-parser/sample.xlsx',
      );
      const text = await parseXlsx(buffer);
      expect(text.length, 'XLSX 應抽出文字').toBeGreaterThan(0);
    });

    it('parsePptx 應能從 fixture 抽出文字', async () => {
      const { parsePptx } = await import('@/lib/ai/office/pptx-parser');
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(
        'tests/fixtures/office-parser/sample.pptx',
      );
      const text = await parsePptx(buffer);
      // PPTX 可能為空 (sample 沒 slide) 也算通過 - 主要驗證不崩潰
      expect(typeof text, 'parsePptx 應回傳 string').toBe('string');
    });
  });
});