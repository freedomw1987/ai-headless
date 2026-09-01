/**
 * Attachment Icon Helper (Sprint 50 Commit 1, Stage 50-0)
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.12 (FR-17.1)
 * 對應 Plan Gate: docs/sprint50-plan-gate.md
 *
 * 提供:
 * - getAttachmentIcon: 根據 mimeType 回傳對應 lucide-react icon
 * - getMimeLabel: 根據 mimeType 回傳中文友好標籤
 *
 * 設計:
 * - 純函式, 易測試
 * - fallback: 任何未識別 mimeType → FileIcon + 通用標籤
 */

import {
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  PresentationIcon,
  type LucideIcon,
} from 'lucide-react';

/**
 * FR-17.1: 根據 mimeType 選 icon
 *
 * @param mimeType - 附件的 MIME 類型
 * @returns 對應的 lucide-react icon component
 */
export function getAttachmentIcon(mimeType: string): LucideIcon {
  if (!mimeType) return FileIcon;

  if (mimeType.startsWith('image/')) return FileImageIcon;

  if (mimeType === 'application/pdf') return FileTextIcon;

  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType === 'application/msword'
  ) {
    return FileTextIcon;
  }

  if (mimeType.includes('sheet') || mimeType.includes('excel')) {
    return FileSpreadsheetIcon;
  }

  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint')
  ) {
    return PresentationIcon;
  }

  if (mimeType.startsWith('text/')) return FileTextIcon;

  return FileIcon;
}

/**
 * FR-17.2: 根據 mimeType 取得中文友好標籤
 *
 * @param mimeType - 附件的 MIME 類型
 * @returns 中文友好標籤, 未識別時回傳 mimeType 本身
 */
export function getMimeLabel(mimeType: string): string {
  if (!mimeType) return '未知檔案';

  const labels: Record<string, string> = {
    'application/pdf': 'PDF 文件',
    'application/msword': 'Word 文件',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'Word 文件',
    'application/vnd.ms-excel': 'Excel 表格',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      'Excel 表格',
    'application/vnd.ms-powerpoint': 'PowerPoint 簡報',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'PowerPoint 簡報',
    'image/jpeg': 'JPEG 圖片',
    'image/jpg': 'JPEG 圖片',
    'image/png': 'PNG 圖片',
    'image/gif': 'GIF 圖片',
    'image/webp': 'WebP 圖片',
    'image/svg+xml': 'SVG 圖片',
    'text/plain': '純文字',
    'text/csv': 'CSV 表格',
    'text/markdown': 'Markdown',
    'text/html': 'HTML',
  };

  return labels[mimeType] ?? mimeType;
}