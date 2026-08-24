/**
 * TDD Gate 1 — Tiptap 富文本組件測試
 *
 * 涵蓋：
 * 1. RichTextEditor：雙向綁定 HTML ↔ Tiptap state
 * 2. RichTextDisplay：純顯示 HTML（XSS-safe via React）
 * 3. 工具欄按鈕（Bold / Italic / Heading / List）
 * 4. 外部 value 變動時 editor 同步
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RichTextEditor } from './rich-text-editor';
import { RichTextDisplay } from './rich-text-display';

// ==============================================
// 1. RichTextEditor 基本渲染
// ==============================================

describe('RichTextEditor', () => {
  it('渲染工具欄 + 編輯區', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);

    // 工具欄按鈕
    expect(screen.getByLabelText('粗體')).toBeTruthy();
    expect(screen.getByLabelText('斜體')).toBeTruthy();
    expect(screen.getByLabelText('標題')).toBeTruthy();
    expect(screen.getByLabelText('項目符號')).toBeTruthy();
    expect(screen.getByLabelText('編號列表')).toBeTruthy();
    expect(screen.getByLabelText('連結')).toBeTruthy();
  });

  it('顯示初始 value 內容', () => {
    const initialHtml = '<p>Hello <strong>World</strong></p>';
    render(<RichTextEditor value={initialHtml} onChange={() => {}} />);

    // Tiptap 渲染為 contenteditable div
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    expect(editor).toBeTruthy();
    expect(editor.innerHTML).toContain('Hello');
    expect(editor.innerHTML).toContain('World');
  });

  it('初始 value 為空時顯示提示文字', () => {
    render(<RichTextEditor value="" onChange={() => {}} placeholder="請輸入內容" />);

    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    expect(editor.getAttribute('data-placeholder')).toBe('請輸入內容');
  });
});

// ==============================================
// 2. onChange 雙向綁定
// ==============================================

describe('RichTextEditor onChange', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('編輯器在 value 變化時仍可 onChange（記錄的初始調用 + 後續變動）', () => {
    const onChange = vi.fn();
    const { rerender } = render(<RichTextEditor value="" onChange={onChange} />);

    // 初始 render 不呼叫 onChange（沒有內容變動）
    expect(onChange).not.toHaveBeenCalled();

    // value 變化時也不應自動觸發（emitUpdate: false）
    rerender(<RichTextEditor value="<p>Updated</p>" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ==============================================
// 3. 工具欄操作
// ==============================================

describe('RichTextEditor Toolbar', () => {
  it('Bold 按鈕初始 aria-pressed 為 false', () => {
    render(<RichTextEditor value="<p>Hello</p>" onChange={() => {}} />);

    const boldBtn = screen.getByLabelText('粗體');
    expect(boldBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('Bold 按鈕可被點擊（不報錯）', () => {
    render(<RichTextEditor value="<p>Hello</p>" onChange={() => {}} />);

    const boldBtn = screen.getByLabelText('粗體');
    expect(() => fireEvent.click(boldBtn)).not.toThrow();
  });

  it('Italic 按鈕初始 aria-pressed 為 false', () => {
    render(<RichTextEditor value="<p>Hello</p>" onChange={() => {}} />);

    const italicBtn = screen.getByLabelText('斜體');
    expect(italicBtn.getAttribute('aria-pressed')).toBe('false');
  });
});

// ==============================================
// 4. RichTextDisplay 只讀渲染
// ==============================================

describe('RichTextDisplay', () => {
  it('渲染 HTML 內容', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    render(<RichTextDisplay html={html} />);

    const container = screen.getByTestId('rich-text-display');
    expect(container.innerHTML).toContain('Hello');
    expect(container.innerHTML).toContain('<strong>World</strong>');
  });

  it('空內容顯示 fallback', () => {
    render(<RichTextDisplay html="" fallback="(無內容)" />);
    expect(screen.getByText('(無內容)')).toBeTruthy();
  });

  it('null/undefined 內容顯示 fallback', () => {
    render(<RichTextDisplay html={null as unknown as string} />);
    expect(screen.getByText('(無內容)')).toBeTruthy();
  });
});

// ==============================================
// 5. Real-world: Blog Post 編輯
// ==============================================

describe('Real-world: Blog Post Editor', () => {
  it('完整 Blog post HTML 渲染', () => {
    const blogHtml = `
      <h1>標題</h1>
      <p>這是 <em>內文</em>，含 <strong>重點</strong>。</p>
      <ul><li>第一點</li><li>第二點</li></ul>
    `;

    render(<RichTextDisplay html={blogHtml} />);

    const container = screen.getByTestId('rich-text-display');
    expect(container.querySelector('h1')?.textContent).toBe('標題');
    expect(container.querySelector('em')?.textContent).toBe('內文');
    expect(container.querySelector('strong')?.textContent).toBe('重點');
    expect(container.querySelectorAll('li').length).toBe(2);
  });
});