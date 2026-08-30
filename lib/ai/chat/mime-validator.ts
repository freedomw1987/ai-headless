/**
 * Sprint 46 Commit 2 — MIME 驗證器
 *
 * 對應 PRD 10-chat-attachments.md §2.1 (FR-1.3) + §5.1:
 * - 純文字: text/plain, text/markdown, application/json, text/csv, text/html, application/xml, image/svg+xml
 * - Office: application/pdf + .docx/.pptx/.xlsx (zip-based, 用副檔名判斷)
 * - 圖片: image/png, image/jpeg, image/webp, image/gif
 * - 大小上限 10 MB (FR-1.4)
 * - 多檔上限 10 個 (FR-1.5)
 *
 * 設計 (Sprint 46 Plan Gate Q10):
 * - MIME 白名單 + 副檔名白名單 + 雙層驗證（防 client bypass）
 * - mime 不符 + 副檔名符合 → 視為 zip-based Office 文件（docx/pptx/xlsx）
 * - mime 符合 + 副檔名不符 → 拒絕（MIME spoofing 攻擊）
 *
 * 注意: 此模組不處理 magic bytes 檢查 (server-side 讀檔頭驗證);
 *       那是 attachment-parser 階段的事 (Sprint 46 Stage 46-B)
 */

/**
 * 允許的 MIME 類型白名單（不含 Office zip-based）
 */
export const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  // 純文字
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  'text/html',
  'application/xml',
  'image/svg+xml',

  // PDF
  'application/pdf',

  // Office (完整 mime, 部分瀏覽器會用此)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

  // 圖片
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

/**
 * 允許的副檔名白名單（小寫，不含 dot）
 */
export const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  // 純文字
  'txt',
  'md',
  'json',
  'csv',
  'log',
  'html',
  'htm',
  'xml',
  'svg',

  // Office
  'pdf',
  'docx',
  'xlsx',
  'pptx',

  // 圖片
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
]);

/**
 * Zip-based Office 文件的 MIME（這些 MIME 透過副檔名判斷允許）
 */
const ZIP_BASED_OFFICE_MIMES: ReadonlySet<string> = new Set([
  'application/zip',
  'application/octet-stream',
]);

/**
 * 單檔大小上限：10 MB (10485760 bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 多檔數量上限：10 個
 */
export const MAX_FILES_COUNT = 10;

/**
 * 檢查 MIME 類型是否在白名單內
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * 檢查副檔名是否在白名單內（大小寫不敏感）
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = getExtensionFromFilename(filename);
  if (!ext) return false;
  return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * 從檔名取得副檔名（小寫，不含 dot）
 */
export function getExtensionFromFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  // 沒有 dot 或 dot 在開頭 (隱藏檔)
  if (lastDot <= 0) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * 驗證檔案數量
 */
export function validateFileCount(count: number): boolean {
  return count > 0 && count <= MAX_FILES_COUNT;
}

/**
 * 同時驗證 MIME 與副檔名（防雙重偽造）
 *
 * 規則:
 * 1. 副檔名必須在白名單（必要條件）
 * 2. MIME 必須在白名單 或 是 zip-based Office MIME
 * 3. 兩者都符合才允許
 */
export function validateMimeAndExtension(
  mimeType: string,
  filename: string,
): boolean {
  // 副檔名必須符合
  if (!isAllowedExtension(filename)) return false;

  // MIME 必須符合白名單（包含 Office 完整 mime）
  if (isAllowedMimeType(mimeType)) return true;

  // 或 MIME 為 zip-based Office（MIME 寬鬆處理，透過副檔名嚴格判斷）
  if (ZIP_BASED_OFFICE_MIMES.has(mimeType)) {
    const ext = getExtensionFromFilename(filename);
    return ext === 'docx' || ext === 'pptx' || ext === 'xlsx';
  }

  return false;
}
