/**
 * Sprint 44 Commit H — Admin AI Chat FAB E2E 守護測試
 *
 * 設計 (S44 Plan Gate Commit H):
 * - E2E 驗證 FAB 出現 + 拖動 + 點擊開 Drawer + 新開對話 + 歷史對話
 * - Mock /api/admin/chat/sessions (避免依賴 DB)
 * - 不真實 stream (用 mock response)
 */

import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

test.describe('S44-H — Admin AI Chat FAB', () => {
  test.beforeEach(async ({ page }) => {
    // Mock sessions API
    await page.route('**/api/admin/chat/sessions', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessions: [
              {
                id: 'session-1',
                title: '測試對話 1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _count: { messages: 3 },
              },
              {
                id: 'session-2',
                title: '測試對話 2',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _count: { messages: 5 },
              },
            ],
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              id: 'session-new',
              title: '新對話',
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock session detail API
    await page.route('**/api/admin/chat/sessions/session-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 'session-1',
            title: '測試對話 1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
              { id: 'm1', role: 'user', content: '你好', createdAt: new Date().toISOString() },
              { id: 'm2', role: 'assistant', content: '哈囉！', createdAt: new Date().toISOString() },
            ],
          },
        }),
      });
    });

    // 登入 admin (真實 admin user)
    await login(page);
    await page.goto('/admin');
  });

  test('FAB 應出現在 admin 頁面', async ({ page }) => {
    const fab = page.locator('[data-testid="admin-fab"]');
    await expect(fab).toBeVisible();
  });

  test('點 FAB 應開啟 chat drawer', async ({ page }) => {
    await page.locator('[data-testid="admin-fab"]').click();
    const drawer = page.locator('[data-testid="admin-chat-dialog"]');
    await expect(drawer).toBeVisible();
  });

  test('chat drawer 應有新開對話 + 歷史對話 buttons', async ({ page }) => {
    await page.locator('[data-testid="admin-fab"]').click();
    await expect(page.locator('[data-testid="new-chat-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-toggle-button"]')).toBeVisible();
  });

  test('歷史 sidebar 應列出 sessions', async ({ page }) => {
    await page.locator('[data-testid="admin-fab"]').click();
    const sidebar = page.locator('[data-testid="chat-history-sidebar"]');
    await expect(sidebar).toBeVisible();
    await expect(page.locator('[data-testid="session-item-session-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-item-session-2"]')).toBeVisible();
  });

  test('點 session 應載入 messages', async ({ page }) => {
    await page.locator('[data-testid="admin-fab"]').click();
    await page.locator('[data-testid="session-item-session-1"]').click();
    // 載入後應顯示 messages
    await expect(page.locator('[data-testid="message-user"]')).toBeVisible();
  });

  test('ESC 應關閉 chat drawer', async ({ page }) => {
    await page.locator('[data-testid="admin-fab"]').click();
    await expect(page.locator('[data-testid="admin-chat-dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="admin-chat-dialog"]')).toBeHidden();
  });

  test('Backdrop 點擊應關閉 chat drawer', async ({ page }) => {
    await page.locator('[data-testid="admin-fab"]').click();
    await expect(page.locator('[data-testid="admin-chat-dialog"]')).toBeVisible();
    // Backdrop 在 dialog 下方, click backdrop 區域 (top-left, dialog 在 right-0 不重疊)
    await page.locator('[data-testid="chat-dialog-backdrop"]').click({
      position: { x: 10, y: 10 },
      force: true,
    });
    await expect(page.locator('[data-testid="admin-chat-dialog"]')).toBeHidden();
  });
});