/**
 * Sprint 47 Commit 1 (Stage 47-0) — Office Parser Bundle Spike
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.1 (FR-1)
 * 對應 Plan Gate: docs/sprint47-plan-gate.md Q4 (Office Parser 降階)
 *
 * 目的：spike 評估 pdf-parse / mammoth / xlsx 三個套件的
 *       - bundle size 影響
 *       - 解析時間
 *       - 真實解析正確性
 *
 * 預期結果（依 Q4 三方案）:
 * - bundle ≤5MB → 照做 47-4 (5 SP)
 * - 5MB < bundle ≤10MB → D-1 (只 PDF, 2 SP)
 * - bundle >10MB → D-2 (延 Sprint 48, 0 SP)
 *
 * 此測試只驗證「真實解析」+「測量時間」，bundle size 在 spike 文件手動量測。
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(process.cwd(), 'tests/fixtures/office-parser');

describe('Office Parser Spike (47-0)', () => {
  describe('PDF (pdf-parse)', () => {
    it('解析 fixture PDF 並提取文字', async () => {
      const pdfPath = join(FIXTURES, 'sample.pdf');
      if (!existsSync(pdfPath)) {
        throw new Error(`PDF fixture 不存在: ${pdfPath}，請先建立 sample.pdf`);
      }
      // pdf-parse v2 是 ESM named export: { PDFParse }
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(readFileSync(pdfPath)) });
      const result = await parser.getText();
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
      await parser.destroy();
    }, 10000); // 10 秒 timeout (PDF 解析時間通常 1-3 秒)

    it('量測 PDF 解析時間 < 3 秒', async () => {
      const pdfPath = join(FIXTURES, 'sample.pdf');
      const { PDFParse } = await import('pdf-parse');
      const start = performance.now();
      const parser = new PDFParse({ data: new Uint8Array(readFileSync(pdfPath)) });
      await parser.getText();
      const elapsed = performance.now() - start;
      await parser.destroy();
      console.log(`[PDF] 解析時間: ${elapsed.toFixed(0)} ms`);
      expect(elapsed).toBeLessThan(3000);
    }, 10000);
  });

  describe('DOCX (mammoth)', () => {
    it('解析 fixture DOCX 並提取純文字', async () => {
      const docxPath = join(FIXTURES, 'sample.docx');
      if (!existsSync(docxPath)) {
        throw new Error(`DOCX fixture 不存在: ${docxPath}，請先建立 sample.docx`);
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: docxPath });
      expect(result.value).toBeTruthy();
      expect(result.value.length).toBeGreaterThan(0);
    }, 10000);

    it('量測 DOCX 解析時間 < 3 秒', async () => {
      const docxPath = join(FIXTURES, 'sample.docx');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = await import('mammoth');
      const start = performance.now();
      await mammoth.extractRawText({ path: docxPath });
      const elapsed = performance.now() - start;
      console.log(`[DOCX] 解析時間: ${elapsed.toFixed(0)} ms`);
      expect(elapsed).toBeLessThan(3000);
    }, 10000);
  });

  describe('XLSX (xlsx)', () => {
    it('解析 fixture XLSX 並轉 CSV', async () => {
      const xlsxPath = join(FIXTURES, 'sample.xlsx');
      if (!existsSync(xlsxPath)) {
        throw new Error(`XLSX fixture 不存在: ${xlsxPath}，請先建立 sample.xlsx`);
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(xlsxPath);
      expect(workbook.SheetNames.length).toBeGreaterThan(0);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]!]!;
      const csv = XLSX.utils.sheet_to_csv(firstSheet);
      expect(csv).toBeTruthy();
      expect(csv.length).toBeGreaterThan(0);
    }, 10000);

    it('量測 XLSX 解析時間 < 3 秒', async () => {
      const xlsxPath = join(FIXTURES, 'sample.xlsx');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = await import('xlsx');
      const start = performance.now();
      XLSX.readFile(xlsxPath);
      const elapsed = performance.now() - start;
      console.log(`[XLSX] 解析時間: ${elapsed.toFixed(0)} ms`);
      expect(elapsed).toBeLessThan(3000);
    }, 10000);
  });

  describe('Bundle size 量測指引（spike 文件手動量測）', () => {
    it('記錄 spike 文件位置', () => {
      const spikeDoc = join(process.cwd(), 'docs/spike/sprint47-office-parser.md');
      // 這個測試不會 fail，只是提醒 spike 文件位置
      expect(spikeDoc).toBeTruthy();
    });
  });
});
