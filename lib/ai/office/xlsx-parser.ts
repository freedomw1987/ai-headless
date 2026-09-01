/**
 * XLSX Parser
 * 用途: 從 .xlsx 檔案中抽取純文字 (含所有 sheets)
 *
 * Sprint 48-5 FR-13.2
 * - 使用 xlsx (SheetJS) 套件
 * - 動態 import (避免 bundle 過大)
 *
 * XLSX 本質是 ZIP, 內含多個 sheet XML
 * xlsx 用 read() 解析整個 workbook, sheet_to_csv 轉成文字
 */

export interface XlsxParseOptions {
  /** 最多解析幾個 sheet (預設 10, 避免過大檔案) */
  maxSheets?: number;
  /** sheet 分隔符 (預設 '\n\n--- Sheet: <name> ---\n\n') */
  sheetSeparator?: string;
}

/**
 * 解析 XLSX buffer 回傳所有 sheet 的文字 (CSV 格式)
 *
 * @param buffer XLSX 檔案的 Buffer
 * @returns 所有 sheet 的 CSV 文字 (以 sheetSeparator 分隔)
 */
export async function parseXlsx(
  buffer: Buffer,
  options: XlsxParseOptions = {},
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  const {
    maxSheets = 10,
    sheetSeparator = '\n\n--- Sheet: {name} ---\n\n',
  } = options;

  // 動態 import xlsx 避免 bundle 過大
  const xlsx = await import('xlsx');

  const workbook = xlsx.read(buffer, { type: 'buffer' });

  const sheets: string[] = [];
  const sheetNames = workbook.SheetNames.slice(0, maxSheets);

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // CSV 格式保留 cell 結構, AI 可讀
    const csv = xlsx.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      sheets.push(sheetSeparator.replace('{name}', sheetName) + csv);
    }
  }

  return sheets.join('\n').trim();
}