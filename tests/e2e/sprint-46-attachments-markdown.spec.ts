/**
 * Sprint 46 Commit 7 — Advanced Markdown + Attachment + SDK 重構 E2E
 *
 * 對應 PRD: docs/prd/10-chat-attachments.md §6.3 (E2E 測試)
 *
 * 設計動機:
 * - 驗證 Sprint 46 三主題整合: Advanced Markdown + Attachment + Chat SDK 重構
 * - 用 Mock stream response (避免依賴真實 LLM)
 * - 涵蓋 FR-7.1 (附件上傳對話), FR-7.6 (Markdown 渲染)
 *
 * 注意:
 * - 真實附件上傳 E2E 留 Sprint 47 (需實際 storagePath 設定)
 * - Sprint 46 用 mock 驗證 Markdown 渲染 + SDK stream 整合
 */

import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

test.describe('Sprint 46 — Advanced Markdown + SDK 重構', () => {
  test.beforeEach(async ({ page }) => {
    // Mock sessions API (空清單)
    await page.route('**/api/admin/chat/sessions', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ sessions: [] }),
        });
      } else {
        await route.continue();
      }
    });

    await login(page);
    await page.click('[data-testid="admin-fab"]');
    await page.waitForSelector('[data-testid="admin-chat-dialog"]');
  });

  test('Chat dialog 應開啟 + 顯示 prompt input', async ({ page }) => {
    const dialog = page.locator('[data-testid="admin-chat-dialog"]');
    await expect(dialog).toBeVisible();
    const textarea = dialog.locator('textarea').first();
    await expect(textarea).toBeVisible();
  });

  test('Submit 應 disabled 當沒輸入也沒附件', async ({ page }) => {
    const dialog = page.locator('[data-testid="admin-chat-dialog"]');
    const submit = dialog.locator('button[type="submit"]').first();
    await expect(submit).toBeDisabled();
  });

  test('輸入文字後 submit 應 enabled', async ({ page }) => {
    const dialog = page.locator('[data-testid="admin-chat-dialog"]');
    const textarea = dialog.locator('textarea').first();
    await textarea.fill('Hello AI');
    const submit = dialog.locator('button[type="submit"]').first();
    await expect(submit).toBeEnabled();
  });

  test('送出訊息應觸發 /api/admin/chat/stream (走 SDK)', async ({ page }) => {
    let streamCalled = false;

    // Mock stream API
    await page.route('**/api/admin/chat/stream', async (route) => {
      streamCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"content":"Hi from SDK"}\n\ndata: [DONE]\n\n',
      });
    });

    const dialog = page.locator('[data-testid="admin-chat-dialog"]');
    const textarea = dialog.locator('textarea').first();
    await textarea.fill('Hello');
    const submit = dialog.locator('button[type="submit"]').first();
    await submit.click();

    // 等待 stream 被呼叫
    await page.waitForTimeout(500);
    expect(streamCalled, '/api/admin/chat/stream 應被呼叫').toBe(true);
  });

  test('AI 回應 Markdown heading 應渲染為 <h1>', async ({ page }) => {
    // Mock stream 回 Markdown
    await page.route('**/api/admin/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"content":"# Hello World\\n\\nThis is **bold**"}\n\ndata: [DONE]\n\n',
      });
    });

    const dialog = page.locator('[data-testid="admin-chat-dialog"]');
    const textarea = dialog.locator('textarea').first();
    await textarea.fill('Test');
    const submit = dialog.locator('button[type="submit"]').first();
    await submit.click();

    // 等待 Markdown 渲染 (react-markdown 產 <h1>, <strong>)
    await expect(dialog.locator('h1').first()).toBeVisible({ timeout: 5000 });
    await expect(dialog.locator('strong').first()).toBeVisible();
  });

  test('AI 回應 code block 應由 CodeBlock 渲染', async ({ page }) => {
    // Mock stream 回 code block
    await page.route('**/api/admin/chat/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"content":"```js\\nconst x = 1;\\n```"}\n\ndata: [DONE]\n\n',
      });
    });

    const dialog = page.locator('[data-testid="admin-chat-dialog"]');
    const textarea = dialog.locator('textarea').first();
    await textarea.fill('Code test');
    const submit = dialog.locator('button[type="submit"]').first();
    await submit.click();

    // 等待 CodeBlock 渲染 (有 shiki token 或 pre.shiki)
    await expect(dialog.locator('pre').first()).toBeVisible({ timeout: 5000 });
  });
});