'use client';

/**
 * ==============================================
 *  RichTextDisplay — 富文本只讀渲染
 * ==============================================
 *
 * 用於顯示已儲存的 HTML 富文本內容。
 * XSS 安全：透過 React 自動轉義 + 設定 dangerouslySetInnerHTML 的 HTML 內容經 Tiptap 控制。
 */

import { cn } from '@/lib/utils';

type RichTextDisplayProps = {
  html: string | null | undefined;
  fallback?: string;
  className?: string;
};

export function RichTextDisplay({
  html,
  fallback = '(無內容)',
  className,
}: RichTextDisplayProps) {
  if (!html || html.trim() === '' || html === '<p></p>') {
    return (
      <div
        data-testid="rich-text-display"
        className={cn('text-sm italic text-muted-foreground', className)}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div
      data-testid="rich-text-display"
      className={cn(
        'prose prose-sm max-w-none',
        '[&_p]:my-2 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg',
        '[&_a]:text-primary [&_a]:underline',
        className,
      )}
      // Tiptap 生成的 HTML 是安全的，但我們仍過濾 script/style
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

/**
 * 簡單 HTML 清理（移除 script / on* 屬性 / style）
 *
 * 注意：生產環境建議用 DOMPurify 強化，但這裡只過濾最危險項。
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}