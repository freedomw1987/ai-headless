/**
 * DOCX Parser
 * 用途: 從 .docx 檔案中抽取純文字
 *
 * Sprint 48-5 FR-13.1
 * - 使用 mammoth 套件 (DOCX → 純文字)
 * - 動態 import (避免 bundle 過大)
 *
 * DOCX 本質是 ZIP, 內含 word/document.xml
 * mammoth 直接處理 .docx buffer 並回傳 text
 */

export interface DocxParseOptions {
  /** 是否保留段落分隔 (預設 true) */
  preserveParagraphs?: boolean;
}

/**
 * 解析 DOCX buffer 回傳純文字
 *
 * @param buffer DOCX 檔案的 Buffer
 * @returns 純文字內容 (段落以換行分隔)
 */
export async function parseDocx(
  buffer: Buffer,
  options: DocxParseOptions = {},
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  const { preserveParagraphs = true } = options;

  // 動態 import mammoth 避免 bundle 過大
  // mammoth v1.12+ 支援 ESM default export
  const mammoth = await import('mammoth');

  const result = await mammoth.extractRawText({ buffer });

  if (preserveParagraphs) {
    // mammoth.extractRawText 預設用 \n 分隔段落, 直接返回
    return result.value.trim();
  }

  // 不保留段落: 用空白取代換行
  return result.value.replace(/\n+/g, ' ').trim();
}