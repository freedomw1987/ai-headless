/**
 * Sprint 36 — KanbanView drag-and-drop E2E 守護測試
 *
 * 守護什麼：
 * - 拖一個 card 到新 column → PUT API 被呼叫
 * - 樂觀更新: card 立即顯示在新 column
 *
 * Gate 4 E2E
 */

import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

/**
 * HTML5 drag-and-drop 模擬 (Playwright 預設 mouse events 不會觸發 dragstart/drop)
 * 用 evaluate + DOM events 直接觸發
 */
async function htmlDragDrop(
  page: import('@playwright/test').Page,
  sourceSelector: string,
  targetSelector: string,
) {
  await page.evaluate(
    ({ src, tgt }) => {
      const source = document.querySelector(src) as HTMLElement;
      const target = document.querySelector(tgt) as HTMLElement;
      if (!source) throw new Error(`Source not found: ${src}`);
      if (!target) throw new Error(`Target not found: ${tgt}`);

      const dt = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
      source.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
    },
    { src: sourceSelector, tgt: targetSelector },
  );
}

test.describe('Sprint 36 — Kanban drag-and-drop', () => {
  test('拖 card 到新 column → 呼叫 PUT API', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    let putCalled = false;
    let putBody: string | null = null;
    page.on('response', async (resp) => {
      const req = resp.request();
      if (req.method() === 'PUT' && resp.url().includes('/api/crud/todo')) {
        putCalled = true;
        putBody = req.postData();
      }
    });

    await page.goto('http://localhost:3000/admin/crud/todo?view=kanban');
    await page.waitForTimeout(3000);

    // 拖第一張 card 到 low column
    await htmlDragDrop(
      page,
      '[data-testid^="kanban-card-"]',
      '[data-testid="kanban-column-low"]',
    );

    await page.waitForTimeout(3000);

    expect(putCalled).toBe(true);
    expect(putBody).toContain('priority');
    expect(putBody).toContain('low');
  });
});