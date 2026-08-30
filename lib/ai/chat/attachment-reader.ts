/**
 * Sprint 46 Commit 5 (Stage 46-D) — Attachment Reader
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §2.2 (FR-2)
 *
 * 用途: 讀取使用者上傳的附件, 將內容注入 LLM prompt
 *
 * 支援格式:
 * - 文字類: .txt/.md/.json/.csv/.log/.html/.xml/.svg (FR-2.1, 直接讀 utf-8)
 * - 圖片類: png/jpeg/webp/gif (FR-2.5, base64 + mime 給 vision)
 * - Office 類: .pdf/.docx/.xlsx/.pptx (Sprint 47+ 補 parser, Sprint 46 placeholder)
 *
 * 為什麼 Sprint 46 scope down:
 * - pdf-parse / mammoth / xlsx 套件較大 (~10MB), 會膨脹 bundle
 * - MVP 導向: 文字 + 圖片是 80% use case
 * - Office 解析留 Sprint 47 (PRD 已明列)
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

  // 3. Office / PDF / 不支援類 (Sprint 47+ 補 parser)
  return {
    kind: 'unsupported',
    filename,
    mime,
    reason: 'Sprint 47+ will add parser (PDF/DOCX/XLSX/PPTX)',
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