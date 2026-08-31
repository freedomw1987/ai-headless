/**
 * Sprint 46 Commit 5 (Stage 46-D) + Sprint 47 Commit 5 (Stage 47-4) — Attachment Reader
 *
 * 對應 PRD:
 * - Sprint 46: docs/prd/10-chat-attachments.md §2.2 (FR-2)
 * - Sprint 47: docs/prd/11-chat-v2-completions.md §2.5 (FR-5.1, FR-5.4, FR-5.5)
 *
 * 用途: 讀取使用者上傳的附件, 將內容注入 LLM prompt
 *
 * 支援格式:
 * - 文字類: .txt/.md/.json/.csv/.log/.html/.xml/.svg (FR-2.1, 直接讀 utf-8)
 * - 圖片類: png/jpeg/webp/gif (FR-2.5, base64 + mime 給 vision)
 * - Office 類 (Sprint 47-4):
 *   - PDF: pdf-parse v2.4.5 (kind: 'office', 解析文字)
 *   - DOCX/XLSX/PPTX: 仍 kind: 'unsupported' (Sprint 48+)
 *
 * 為什麼 Sprint 47 scope down (D-1 方案):
 * - pdf-parse bundle ~200KB, 仍可接受
 * - mammoth / xlsx bundle 較大, 推到 Sprint 48+
 * - spike 詳見 docs/spike/sprint47-office-parser.md
 */

import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

export type AttachmentContent =
  | {
      kind: 'text';
      filename: string;
      mime: string;
      content: string;
    }
  | {
      kind: 'image';
      filename: string;
      mime: string;
      /** base64 encoded image bytes */
      base64: string;
    }
  | {
      kind: 'office';
      filename: string;
      mime: string;
      /** 解析後的純文字內容 */
      text: string;
    }
  | {
      kind: 'unsupported';
      filename: string;
      mime: string;
      reason: string;
    };

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.csv',
  '.log',
  '.html',
  '.xml',
  '.svg',
]);

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const IMAGE_MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Sprint 47 Commit 5 (Stage 47-4): Office 類副檔名
const PDF_EXTENSION = '.pdf';
const OTHER_OFFICE_EXTENSIONS = new Set(['.docx', '.xlsx', '.pptx']);

/**
 * Sprint 47 Commit 5 (Stage 47-4): PDF 解析 (FR-5.1)
 *
 * 使用 pdf-parse v2.4.5 (ESM named export: PDFParse)
 * - Class API: new PDFParse({ data }).getText()
 * - 需呼叫 parser.destroy() 釋放 PDF.js worker (避免記憶體洩漏)
 *
 * 為何 dynamic import:
 * - pdf-parse 是 ESM + 重套件, dynamic import 避免 cold start 負擔
 * - 只有讀 PDF 時才加載
 */
async function parsePdf(buffer: Uint8Array): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

/**
 * 讀取附件內容
 *
 * @param storagePath - 相對路徑 (e.g. "<sessionId>/<uuid>.txt")
 * @param mime - MIME type (從 DB 讀)
 * @param filename - 原始檔名 (給 LLM 提示用)
 */
export async function readAttachmentContent(
  storagePath: string,
  mime: string,
  filename: string,
): Promise<AttachmentContent> {
  const ext = extname(filename).toLowerCase();

  // 1. 文字類
  if (TEXT_EXTENSIONS.has(ext)) {
    const buf = await readFile(storagePath);
    return {
      kind: 'text',
      filename,
      mime,
      content: buf.toString('utf-8'),
    };
  }

  // 2. 圖片類
  if (IMAGE_EXTENSIONS.has(ext)) {
    const buf = await readFile(storagePath);
    return {
      kind: 'image',
      filename,
      mime: IMAGE_MIME_MAP[ext] ?? mime,
      base64: buf.toString('base64'),
    };
  }

  // 3. Sprint 47 Commit 5 (Stage 47-4): PDF 解析 (FR-5.1)
  if (ext === PDF_EXTENSION) {
    const buf = await readFile(storagePath);
    try {
      const text = await parsePdf(new Uint8Array(buf));
      return {
        kind: 'office',
        filename,
        mime: 'application/pdf',
        text,
      };
    } catch (err) {
      return {
        kind: 'unsupported',
        filename,
        mime,
        reason: `PDF parse failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // 4. 其他 Office (DOCX/XLSX/PPTX) - Sprint 48+ 才支援
  if (OTHER_OFFICE_EXTENSIONS.has(ext)) {
    return {
      kind: 'unsupported',
      filename,
      mime,
      reason: 'Sprint 48+ 將支援此格式 (本次僅 PDF)',
    };
  }

  // 5. 完全不支援
  return {
    kind: 'unsupported',
    filename,
    mime,
    reason: '不支援的檔案格式',
  };
}

/**
 * 讀取附件文字內容 (FR-2.1)
 *
 * 給文字附件用的快速 API, 等價於 readAttachmentContent(kind === 'text')
 */
export async function readAttachmentText(
  storagePath: string,
  filename: string,
): Promise<string> {
  const ext = extname(filename).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) {
    throw new Error(
      `readAttachmentText: ${filename} is not a text file (ext=${ext})`,
    );
  }
  const buf = await readFile(storagePath);
  return buf.toString('utf-8');
}

/**
 * 讀取附件圖片內容 (FR-2.5)
 *
 * 給 vision 模型用, 回傳 base64 + mime
 */
export async function readAttachmentImage(
  storagePath: string,
  filename: string,
): Promise<{ base64: string; mime: string }> {
  const ext = extname(filename).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(
      `readAttachmentImage: ${filename} is not an image file (ext=${ext})`,
    );
  }
  const buf = await readFile(storagePath);
  return {
    base64: buf.toString('base64'),
    mime: IMAGE_MIME_MAP[ext] ?? 'application/octet-stream',
  };
}