/**
 * Markdown Parser Unit Test — S45-D
 *
 * 設計:
 * - 純函數測試 parseMarkdown + renderInlineMarkdown
 * - 不測 React component
 * - 覆蓋常見 AI 回應 markdown 格式
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, renderInlineMarkdown } from './markdown-parser';

describe('parseMarkdown — S45-D', () => {
  it('純文字無 markdown 應回傳 1 個 text block', () => {
    const blocks = parseMarkdown('Hello world');
    expect(blocks).toEqual([{ type: 'text', content: 'Hello world' }]);
  });

  it('含 ```js code ``` 應回傳 text + code 兩個 block', () => {
    const blocks = parseMarkdown('看這:\n```js\nconst x = 1;\n```');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: 'text', content: '看這:\n' });
    expect(blocks[1]).toEqual({
      type: 'code',
      lang: 'js',
      code: 'const x = 1;',
    });
  });

  it('多個 code block 應正確分割', () => {
    const md = '```python\nprint(1)\n```\nmiddle\n```sql\nSELECT 1;\n```';
    const blocks = parseMarkdown(md);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]?.type).toBe('code');
    expect(blocks[1]?.type).toBe('text');
    if (blocks[1]?.type === 'text') {
      expect(blocks[1].content).toContain('middle');
    }
    expect(blocks[2]?.type).toBe('code');
  });

  it('無 language 標籤應 fallback 為 "text"', () => {
    const blocks = parseMarkdown('```\ncode here\n```');
    expect(blocks[0]).toEqual({ type: 'code', lang: 'text', code: 'code here' });
  });

  it('尾巴沒有 code 應有 tail text', () => {
    const md = '```js\nx\n```\nend text';
    const blocks = parseMarkdown(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[1]?.type).toBe('text');
    if (blocks[1]?.type === 'text') {
      expect(blocks[1].content).toContain('end text');
    }
  });
});

describe('renderInlineMarkdown — S45-D', () => {
  it('bold 應包 <strong>', () => {
    expect(renderInlineMarkdown('**hi**')).toContain('<strong>hi</strong>');
  });

  it('italic 應包 <em>', () => {
    expect(renderInlineMarkdown('*hi*')).toContain('<em>hi</em>');
  });

  it('inline code 應包 <code>', () => {
    const result = renderInlineMarkdown('use `const` here');
    expect(result).toContain('<code class="rounded bg-muted px-1 py-0.5 font-mono text-xs">const</code>');
  });

  it('HTML 特殊字元應 escape', () => {
    expect(renderInlineMarkdown('<script>')).toContain('&lt;script&gt;');
    expect(renderInlineMarkdown('a & b')).toContain('a &amp; b');
  });

  it('純文字應原樣回傳', () => {
    expect(renderInlineMarkdown('hello world')).toBe('hello world');
  });
});