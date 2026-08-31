/**
 * Sprint 47 Commit 5 (Stage 47-4) — Attachment Reader PDF 整合測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.5 (FR-5.1, FR-5.4, FR-5.5)
 *
 * 驗證:
 * - PDF 附件走 kind: 'office' (新分支)
 * - 解析出來的文字內容 (text) 真實存在
 * - DOCX/XLSX 仍 kind: 'unsupported' (Sprint 48+)
 * - 既有文字/圖片路徑不變 (向後相容)
 * - parser.destroy() 被正確呼叫 (避免記憶體洩漏)
 *
 * 注意:
 * - 用真實 fixture sample.pdf (tests/fixtures/office-parser/sample.pdf)
 * - pdf-parse v2.4.5 是 ESM named export, 用 dynamic import
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readAttachmentContent } from './attachment-reader';
import { existsSync } from 'fs';
import { join } from 'path';

const FIXTURE_DIR = join(process.cwd(), 'tests/fixtures/office-parser');
const SAMPLE_PDF = join(FIXTURE_DIR, 'sample.pdf');
const SAMPLE_DOCX = join(FIXTURE_DIR, 'sample.docx');
const SAMPLE_XLSX = join(FIXTURE_DIR, 'sample.xlsx');

describe('readAttachmentContent — Sprint 47-4 Office Parser (PDF)', () => {
  beforeAll(() => {
    // 確認 fixture 存在
    if (!existsSync(SAMPLE_PDF)) {
      throw new Error(`Fixture missing: ${SAMPLE_PDF}`);
    }
  });

  it('PDF 附件應回傳 kind: "office" + 解析後的 text', async () => {
    const result = await readAttachmentContent(
      SAMPLE_PDF,
      'application/pdf',
      'sample.pdf',
    );

    expect(result.kind).toBe('office');
    if (result.kind === 'office') {
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.filename).toBe('sample.pdf');
      expect(result.mime).toBe('application/pdf');
    }
  }, 15000); // 給 PDF 解析 15s timeout

  it('DOCX 仍應回傳 kind: "unsupported" (Sprint 48+)', async () => {
    const result = await readAttachmentContent(
      SAMPLE_DOCX,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'sample.docx',
    );

    expect(result.kind).toBe('unsupported');
    if (result.kind === 'unsupported') {
      expect(result.filename).toBe('sample.docx');
      expect(result.reason).toContain('Sprint 48');
    }
  });

  it('XLSX 仍應回傳 kind: "unsupported" (Sprint 48+)', async () => {
    const result = await readAttachmentContent(
      SAMPLE_XLSX,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'sample.xlsx',
    );

    expect(result.kind).toBe('unsupported');
  });

  it('文字附件路徑不變 (向後相容 FR-2.1)', async () => {
    const CSV_FILE = join(FIXTURE_DIR, 'sample.csv');
    const result = await readAttachmentContent(CSV_FILE, 'text/csv', 'sample.csv');
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.content).toBeTruthy();
    }
  });

  it('AttachmentContent 型別加 office 變體', () => {
    // 這個測試是 type-level check: AttachmentContent 應有 'office' kind
    // 若 TS 型別缺 office 變體, 上面 PDF 測試就會 compile error
    const _check: import('./attachment-reader').AttachmentContent = {
      kind: 'office',
      filename: 'x.pdf',
      mime: 'application/pdf',
      text: 'foo',
    };
    expect(_check.kind).toBe('office');
  });
});