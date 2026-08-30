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
 * 守護測試範圍:
 * - A. 新檔案存在性 + 依賴安裝
 * - B. 應支援的 markdown 語法 (headings, links, lists, tables, code blocks, blockquote, strikethrough, tasklists)
 * - C. components.code 應接 Sprint 45 CodeBlock (shiki)
 * - D. admin-chat-panel.tsx 不應再 import 自製 parseMarkdown (Sprint 46 重構)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('Sprint 46 Commit 4 — Advanced Markdown Renderer', () => {
  // ============== A. 新檔案存在性 + 依賴安裝 ==============

  it('應建立 lib/ai/chat/markdown-renderer.tsx', () => {
    expect(
      existsSync('lib/ai/chat/markdown-renderer.tsx'),
      '應建立 lib/ai/chat/markdown-renderer.tsx (取代自製 parser)',
    ).toBe(true);
  });

  it('package.json 應裝 react-markdown + remark-gfm', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8')) as {
      dependencies: Record<string, string>;
    };
    expect(
      pkg.dependencies['react-markdown'],
      '應裝 react-markdown',
    ).toBeDefined();
    expect(
      pkg.dependencies['remark-gfm'],
      '應裝 remark-gfm (GFM 支援)',
    ).toBeDefined();
  });

  // ============== B. 應支援的 markdown 語法 ==============

  it('markdown-renderer 應 import ReactMarkdown from react-markdown', () => {
    const source = readFileSync('lib/ai/chat/markdown-renderer.tsx', 'utf-8');
    expect(source, '應 import ReactMarkdown').toMatch(
      /from\s+['"]react-markdown['"]/,
    );
  });

  it('markdown-renderer 應 import remarkGfm from remark-gfm', () => {
    const source = readFileSync('lib/ai/chat/markdown-renderer.tsx', 'utf-8');
    expect(source, '應 import remarkGfm').toMatch(
      /from\s+['"]remark-gfm['"]/,
    );
  });

  it('markdown-renderer 應 export 一個 Markdown 元件', () => {
    const source = readFileSync('lib/ai/chat/markdown-renderer.tsx', 'utf-8');
    expect(source, '應 export Markdown component').toMatch(
      /export\s+(default\s+)?function\s+Markdown|export\s+(default\s+)?const\s+Markdown/,
    );
  });

  // ============== C. components.code 應接 CodeBlock ==============

  it('markdown-renderer 應有 components.code slot 接 CodeBlock', () => {
    const source = readFileSync('lib/ai/chat/markdown-renderer.tsx', 'utf-8');
    // ReactMarkdown 接受 components 物件, 裡面有 code method 或 code 屬性
    expect(source, '應有 components 屬性').toMatch(/components\s*=/);
    expect(source, 'components 應處理 code 屬性').toMatch(/\bcode\b/);
    expect(source, 'components 應 import CodeBlock').toMatch(/CodeBlock/);
  });

  it('markdown-renderer 應 import CodeBlock (shiki)', () => {
    const source = readFileSync('lib/ai/chat/markdown-renderer.tsx', 'utf-8');
    expect(source, '應 import CodeBlock').toMatch(/CodeBlock/);
    expect(source, 'CodeBlock 應從 ai-elements import').toMatch(
      /from\s+['"]@\/components\/ai-elements\/code-block['"]/,
    );
  });

  // ============== D. admin-chat-panel.tsx 不應再 import 自製 parseMarkdown ==============

  it('admin-chat-panel.tsx 不應再 import 自製 parseMarkdown', () => {
    const source = readFileSync(
      'app/admin/_components/admin-chat-panel.tsx',
      'utf-8',
    );
    // Sprint 46 重構: 改用 Markdown component
    expect(
      source,
      '不應再 import 自製 parseMarkdown',
    ).not.toMatch(/import\s*\{[^}]*parseMarkdown[^}]*\}/);
    expect(
      source,
      '不應再 import 自製 renderInlineMarkdown',
    ).not.toMatch(/import\s*\{[^}]*renderInlineMarkdown[^}]*\}/);
  });

  it('admin-chat-panel.tsx 應 import 新 Markdown component', () => {
    const source = readFileSync(
      'app/admin/_components/admin-chat-panel.tsx',
      'utf-8',
    );
    expect(source, '應 import Markdown from markdown-renderer').toMatch(
      /from\s+['"]@\/lib\/ai\/chat\/markdown-renderer['"]/,
    );
  });

  // ============== E. Markdown renderer 安全設定 ==============

  it('markdown-renderer 不應使用 raw HTML plugin (避免 XSS)', () => {
    const source = readFileSync('lib/ai/chat/markdown-renderer.tsx', 'utf-8');
    // react-markdown 預設 disable raw HTML, 不應裝 raw HTML plugin
    // 註解不算, 只檢查 import/use
    const importLines = source
      .split('\n')
      .filter((line) => /^import|^const.*=.*require/.test(line.trim()));
    const importSource = importLines.join('\n');
    expect(
      importSource,
      '不應 import raw HTML plugin (XSS 風險)',
    ).not.toMatch(/rehype-raw|rehypeRaw/);
  });
});