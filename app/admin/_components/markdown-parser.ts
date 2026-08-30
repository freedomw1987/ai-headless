/**
 * Markdown Parser — S45-D 自製 markdown 渲染器 (含 code block)
 *
 * 為什麼自製:
 * - AI Elements MessageResponse 用 Streamdown 內建渲染, 不支援客製元件
 * - 程式碼區塊要用 AI Elements CodeBlockContent (含 syntax highlight via shiki)
 * - 自製 parser 只支援基本 markdown (足夠 AI 回應用), 效能好
 *
 * 支援語法:
 * - ```lang\\ncode\\n``` (程式碼區塊)
 * - `inline code` (行內)
 * - **bold**
 * - *italic*
 * - line breaks
 *
 * 不支援 (S45-D scope):
 * - headings
 * - links
 * - lists
 * - images
 */

export type MarkdownBlock =
  | { type: 'code'; lang: string; code: string }
  | { type: 'text'; content: string };

const CODE_BLOCK_RE = /```(\w*)\n([\s\S]*?)```/g;

export function parseMarkdown(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(CODE_BLOCK_RE)) {
    const [full, lang, code] = match;
    const beforeText = content.slice(lastIndex, match.index);
    if (beforeText) {
      blocks.push({ type: 'text', content: beforeText });
    }
    blocks.push({ type: 'code', lang: lang || 'text', code: (code ?? '').trimEnd() });
    lastIndex = (match.index ?? 0) + full.length;
  }

  // tail text
  if (lastIndex < content.length) {
    blocks.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return blocks;
}

/**
 * renderInlineMarkdown — 處理行內 markdown (bold / italic / inline code)
 *
 * 用途: 給 text block 內的字串做 inline 樣式
 * 輸出: HTML 樣式 (React 直接用 dangerouslySetInnerHTML 處理)
 *
 * 注意:
 * - 純字串處理, 不解析嵌套
 * - HTML marker (**, *) 跳過
 * - XSS 防護: 跳過 < > & 三個危險字元
 */
export function renderInlineMarkdown(text: string): string {
  // 先 escape 危險字元
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return safe
    // inline code (避免被 ** * 影響)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 font-mono text-xs">$1</code>')
    // bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}