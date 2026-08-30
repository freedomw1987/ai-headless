/**
 * Sprint 35-2 — Kanban View E2E 守護測試
 *
 * 為什麼需要：
 * - Sprint 35-1 已建立 KanbanView + ViewRouter 整合
 * - 需要守護測試：user 切換到 kanban view 時真的渲染 kanban 布局
 * - ViewRouter 對 kanban case 不再 fallback 到 TableView
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

test.describe('Sprint 35 — todo list Kanban View', () => {
  test('ViewSelector 顯示 3 個 views (含 kanban)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/crud/todo');
    await page.waitForTimeout(3000);

    // 打開 dropdown
    await page.click('[data-testid=view-selector-trigger]');
    await page.waitForTimeout(300);

    // 應該有 3 個 view items
    await expect(page.locator('[data-testid=view-selector-item-table]')).toBeVisible();
    await expect(page.locator('[data-testid=view-selector-item-todo-list]')).toBeVisible();
    await expect(page.locator('[data-testid=view-selector-item-kanban]')).toBeVisible();
  });

  test('切換到 KanbanView → URL 加 ?view=kanban + 渲染 kanban columns', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/crud/todo');
    await page.waitForTimeout(3000);

    // 打開 dropdown, 選 Kanban
    await page.click('[data-testid=view-selector-trigger]');
    await page.waitForTimeout(300);
    await page.click('[data-testid=view-selector-item-kanban]');
    await page.waitForTimeout(2000);

    // URL 應該有 ?view=kanban
    expect(page.url()).toContain('view=kanban');

    // KanbanView 應該渲染
    await expect(page.locator('[data-testid=kanban-view]')).toBeVisible();

    // 至少要有 1 個 column (priority: medium / low 等)
    const columns = page.locator('[data-testid^="kanban-column-"]:not([data-testid*="-header-"])');
    const columnCount = await columns.count();
    expect(columnCount).toBeGreaterThan(0);
  });

  test('直接訪問 ?view=kanban 顯示 KanbanView', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto('/admin/crud/todo?view=kanban');
    await page.waitForTimeout(3000);

    // KanbanView 渲染
    await expect(page.locator('[data-testid=kanban-view]')).toBeVisible();

    // trigger 顯示 "看板"
    await expect(page.getByTestId('view-selector-trigger')).toContainText('看板');
  });

  test('kanban 在 mobile (375px) 仍可見（水平 scroll）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto('/admin/crud/todo?view=kanban');
    await page.waitForTimeout(3000);

    // KanbanView 仍渲染
    await expect(page.locator('[data-testid=kanban-view]')).toBeVisible();

    // body 沒有 overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375);
  });
});