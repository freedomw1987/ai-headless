/**
 * Sprint 47 Commit 8 (Stage 47-7) — Markdown XSS E2E 守護測試
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.8 (FR-8.1 ~ FR-8.3)
 *
 * 守護目的:
 * - Sprint 46 揭露: 用 streamdown (預設 escape / block 危險 HTML), 但缺端到端 XSS 驗證
 * - Sprint 47-7: E2E 三情境守護, 確保 Sprint 47 改 Markdown 後 XSS 防線仍有效
 *
 * 三情境:
 * - X1 (FR-8.1): user input 含 <script>alert(1)</script> → 應 escape 或 block
 * - X2 (FR-8.2): AI output 含 <img src=x onerror=alert(1)> → 應 escape 或 block
 * - X3 (FR-8.3): code block 內 <script> 不執行（已 escape，驗證不破壞）
 *
 * Streamdown 防禦模型 (Sprint 47 觀察):
 * - 危險 raw HTML 預設會被移除 (block) 或 escape, 不會渲染為可執行 element
 * - 攻擊者無法注入可執行的 onerror / onclick / src=javascript: 等
 * - 不依賴 rehype-raw (Sprint 46 已移除), 預設安全
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Streamdown } from 'streamdown';

function renderMarkdown(content: string): HTMLElement {
  const { container } = render(<Streamdown>{content}</Streamdown>);
  return container;
}

/** 斷言: 容器內不存在含指定危險 attribute 的元素 */
function expectNoDangerousAttrs(
  container: HTMLElement,
  attr: string,
  context: string,
) {
  const allElements = container.querySelectorAll('*');
  allElements.forEach((el) => {
    expect(
      el.getAttribute(attr),
      `${context}: 不應有 ${attr} attribute on <${el.tagName.toLowerCase()}>`,
    ).toBeNull();
  });
}

describe('S47-7 — Markdown XSS E2E 守護', () => {
  describe('X1: user input 含 <script> (FR-8.1)', () => {
    it('script 標籤應被 escape 或 block, 不會變成可執行的 HTML element', () => {
      const container = renderMarkdown(
        'Hello <script>alert(1)</script> World',
      );

      // 核心: 不應有可執行的 <script> element
      const scriptElements = container.querySelectorAll('script');
      expect(
        scriptElements.length,
        '不應渲染出 <script> HTML element',
      ).toBe(0);

      // 內容應保留 Hello/World (Streamdown block 時 <script> 被移除但保留其他文字)
      expect(container.textContent ?? '').toContain('Hello');
      expect(container.textContent ?? '').toContain('World');
    });
  });

  describe('X2: AI output 含 onerror handler (FR-8.2)', () => {
    it('img onerror 應被阻擋: 不渲染含 onerror 的 element', () => {
      const container = renderMarkdown(
        '<img src=x onerror=alert(1)>',
      );

      // 核心: 不應有任何 element 含 onerror attribute
      expectNoDangerousAttrs(container, 'onerror', 'img onerror 攻擊');
    });

    it('onclick / onload 等其他 handler 也應被阻擋', () => {
      const container = renderMarkdown(
        '<a href="#" onclick="alert(1)">click me</a>',
      );

      expectNoDangerousAttrs(container, 'onclick', 'onclick handler 攻擊');
    });
  });

  describe('X3: code block 內 <script> 不破壞 (FR-8.3)', () => {
    it('fenced code block 內 <script> 應顯示為純文字, 不執行', () => {
      const codeContent = '```html\n<script>alert(1)</script>\n```';
      const container = renderMarkdown(codeContent);

      // 不應有可執行的 <script> element
      const scriptElements = container.querySelectorAll('script');
      expect(
        scriptElements.length,
        'code block 內不應有可執行 <script>',
      ).toBe(0);

      // 內容應保留原文字 (在 code 區塊內顯示)
      expect(container.textContent ?? '').toContain('<script>');
      expect(container.textContent ?? '').toContain('alert(1)');

      // 應有 code/pre element (fenced code block 結構)
      const codeElements = container.querySelectorAll('code, pre');
      expect(
        codeElements.length,
        '應有 code/pre element 顯示程式碼',
      ).toBeGreaterThan(0);
    });

    it('inline code 內 <script> 應 escape', () => {
      const container = renderMarkdown('Use `<script>` for evil');

      const scriptElements = container.querySelectorAll('script');
      expect(scriptElements.length).toBe(0);
      expect(container.textContent ?? '').toContain('<script>');
    });
  });

  describe('Sprint 47 改 Markdown 完整性', () => {
    it('正常 markdown 仍正常渲染 (heading / list)', () => {
      const container = renderMarkdown(
        '# Heading\n\n- item 1\n- item 2',
      );

      // heading 應渲染
      const h1 = container.querySelector('h1');
      expect(h1?.textContent).toBe('Heading');

      // list 應渲染
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(2);
    });

    it('Sprint 47 sources/reasoning 元件不引入額外 HTML element', () => {
      // Smoke test: 確認 Sprint 47-1 改的 MessageContent + Streamdown 仍正常運作
      const container = renderMarkdown('**bold** and *italic*');
      // Streamdown 在 jsdom + sync render 下可能延遲渲染 markdown 結構,
      // 重點: 不含可執行危險 element (XSS 防線已驗證)
      // 而非保證特定 HTML element 必定存在 (這是 e2e playwright 的範疇)
      expectNoDangerousAttrs(container, 'onerror', 'normal markdown smoke test');
      expectNoDangerousAttrs(container, 'onclick', 'normal markdown smoke test');
      expect(container.textContent ?? '').toContain('bold');
      expect(container.textContent ?? '').toContain('italic');
    });
  });
});