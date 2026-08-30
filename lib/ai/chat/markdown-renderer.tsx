/**
 * Sprint 46 Commit 4 (Stage 46-B) — Advanced Markdown Renderer
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §6 (Advanced Markdown)
 *
 * 設計動機:
 * - 取代 Sprint 45 自製 parseMarkdown (只支援 code block + bold/italic/inline code)
 * - 改用 react-markdown + remark-gfm (支援 headings, links, lists, tables, code blocks, blockquote, GFM strikethrough, autolinks, tasklists)
 * - 保留 Sprint 45 自製 CodeBlock (shiki syntax highlight) — 透過 components.code slot 接入
 *
 * 支援語法 (GFM):
 * - # / ## / ### headings
 * - **bold** / *italic* / ~~strikethrough~~
 * - [link](url)
 * - - / 1. lists (含 tasklist `- [x]` / `- [ ]`)
 * - > blockquote
 * - `inline code` + ```code blocks```
 * - | table | with | pipes |
 * - 自動連結 (https://...)
 *
 * 安全:
 * - react-markdown 預設 disable raw HTML (XSS 防護)
 * - 不使用 raw HTML plugin, 不接受 inline HTML
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/ai-elements/code-block';

export interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code block + inline code 走 Sprint 45 CodeBlock (shiki)
          code(props) {
            const { className: codeClassName, children } = props as {
              className?: string;
              children?: React.ReactNode;
            };
            const match = /language-(\w+)/.exec(codeClassName ?? '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  {children}
                </code>
              );
            }

            // Code block — 用 shiki CodeBlock (注意: language 為 string)
            const code = String(children).replace(/\n$/, '');
            const lang = match?.[1] ?? 'text';
            return (
              // @ts-expect-error BundledLanguage union 太長, 但 shiki 接受 string
              <CodeBlock code={code} language={lang} />
            );
          },
          // 連結新分頁開啟
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;