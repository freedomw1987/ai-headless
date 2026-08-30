/**
 * Sprint 34 — View 切換 E2E 守護測試
 *
 * 為什麼需要：
 * - Sprint 33-1~5 已建立 View 架構（JsonSpec.views + ViewRouter + TableView + TodoListView + ViewSelector）
 * - Sprint 34-1~2 已整合到 CrudListClient + page.tsx
 * - 需要守護測試：user 在 todo list 切換 view 時真的會切換渲染
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

test.describe('Sprint 34 — todo list View 切換', () => {
  test('todo list 有 ViewSelector (multiple views defined)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/crud/todo');
    await page.waitForTimeout(3000);

    // ViewSelector trigger 應該出現
    await expect(page.getByTestId('view-selector-trigger')).toBeVisible();

    // Trigger 顯示當前 view label (預設為 table → "表格")
    const trigger = page.getByTestId('view-selector-trigger');
    await expect(trigger).toContainText('表格');
  });

  test('切換到 TodoListView 後 URL 加 ?view=todo-list', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/crud/todo');
    await page.waitForTimeout(3000);

    // 打開 dropdown
    await page.click('[data-testid=view-selector-trigger]');
    await page.waitForTimeout(300);

    // 選 TodoListView
    await page.click('[data-testid=view-selector-item-todo-list]');
    await page.waitForTimeout(2000);

    // URL 應該有 ?view=todo-list
    expect(page.url()).toContain('view=todo-list');

    // Trigger 顯示 "待辦清單"
    await expect(page.getByTestId('view-selector-trigger')).toContainText('待辦清單');
  });

  test('直接訪問 ?view=todo-list 顯示 TodoListView', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/crud/todo?view=todo-list');
    await page.waitForTimeout(3000);

    // Trigger 應該顯示 "待辦清單"
    await expect(page.getByTestId('view-selector-trigger')).toContainText('待辦清單');

    // TodoListView 的 card 應該出現
    const cards = page.locator('[data-testid^=todo-card-row-]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('blog list 有 ViewSelector (Sprint 37 加 views)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/crud/blog');
    await page.waitForTimeout(3000);

    // Sprint 37: blog spec 加了 views (table + kanban), 所以 ViewSelector 應該顯示
    await expect(page.getByTestId('view-selector-trigger')).toBeVisible();
  });
});