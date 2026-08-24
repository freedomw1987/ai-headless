/**
 * Blog Computed: readingTime
 *
 * 計算文章預估閱讀時間：
 * - 中文字每個算 1 個字
 * - 英文按 word count（每個含字母/數字的連續序列算 1 個 word）
 * - 平均閱讀速度：200 字/分鐘（中英文混合）
 * - 至少 1 分鐘
 */

export function computeReadingTime(content: unknown): number {
  if (typeof content !== 'string' || content.length === 0) return 0;

  // 移除 HTML 標籤
  const plain = content.replace(/<[^>]*>/g, '').trim();

  if (plain.length === 0) return 0;

  // 中文字數
  const chineseChars = (plain.match(/[\u4e00-\u9fa5]/g) ?? []).length;

  // 英文 / 數字 word 數：匹配連續字母/數字序列
  // 注意：對於 'aaa...' 這種無空白輸入，仍算 1 個 word（這是合理行為）
  const englishWords = (plain.match(/[a-zA-Z0-9]+/g) ?? []).length;

  const total = chineseChars + englishWords;

  // 200 字/分鐘
  return Math.max(1, Math.ceil(total / 200));
}