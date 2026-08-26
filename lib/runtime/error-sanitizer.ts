/**
 * Error Sanitizer — 把內部錯誤訊息轉為使用者友善訊息
 *
 * Sprint 20 P3.5 Reviewer Finding：
 * - 直接回傳 e.message 會洩漏 Prisma 型別簽名、欄位名（security regression）
 * - Production 不應暴露內部細節，只回通用訊息
 *
 * 設計：
 * - Dev：保留原始訊息（方便開發除錯）
 * - Production：只回通用「提交失敗」訊息
 * - 識別「可安全暴露」的訊息（如 Zod 業務錯誤、Hook 業務錯誤）
 *   這些是有意寫給使用者看的，可以不過濾
 */

const SAFE_PATTERNS = [
  // Zod 驗證訊息
  /Required/i,
  /Invalid input/i,
  /must be/i,
  /must not/i,
  // Hook 業務驗證訊息（自定義）
  /^Event /,
  /^Todo /,
  /^Blog /,
  // 中文業務訊息
  /必填/,
  /格式/,
];

/**
 * Sanitize error：判斷訊息是否可安全暴露給 client
 *
 * @param e - 原始 Error
 * @returns 使用者應該看到的訊息
 */
export function sanitizeErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : '提交失敗';

  // Production：只保留已識別的「安全訊息」模式
  if (process.env.NODE_ENV === 'production') {
    if (SAFE_PATTERNS.some((re) => re.test(raw))) {
      return raw;
    }
    return '提交失敗，請檢查輸入';
  }

  // Dev：保留原始訊息（開發除錯用）
  return raw;
}