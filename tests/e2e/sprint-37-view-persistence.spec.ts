/**
 * Sprint 37-2 — ViewSelector localStorage 持久化 E2E 守護測試
 *
 * 守護什麼：
 * - 切換 view 後 localStorage 有寫入記錄
 * - reload 沒帶 ?view= URL 時, 從 localStorage 恢復上次選擇
 * - URL 有 ?view= 時優先於 localStorage
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

test.describe('Sprint 37 — ViewSelector localStorage 持久化', () => {
  test('切換到 kanban → localStorage 記住', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    // 清掉之前的 prefs
    await page.evaluate(() => localStorage.clear());

    await page.goto('http://localhost:3000/admin/crud/todo');
    await page.waitForTimeout(3000);

    // 打開 dropdown 選 Kanban
    await page.click('[data-testid=view-selector-trigger]');
    await page.waitForTimeout(300);
    await page.click('[data-testid=view-selector-item-kanban]');
    await page.waitForTimeout(1500);

    // localStorage 應該有 crud-view-pref:todo
    const stored = await page.evaluate(() =>
      localStorage.getItem('crud-view-pref:todo'),
    );
    expect(stored).toContain('kanban');
  });

  test('reload 後保持上次選擇的 view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    // 清掉之前的 prefs
    await page.evaluate(() => localStorage.clear());

    // 1. 切換到 kanban
    await page.goto('http://localhost:3000/admin/crud/todo');
    await page.waitForTimeout(3000);
    await page.click('[data-testid=view-selector-trigger]');
    await page.waitForTimeout(300);
    await page.click('[data-testid=view-selector-item-kanban]');
    await page.waitForTimeout(1500);

    // 2. reload 沒帶 ?view=
    await page.goto('http://localhost:3000/admin/crud/todo');
    await page.waitForTimeout(3000);

    // 應該還是 kanban (不是預設 table)
    const triggerText = await page.locator('[data-testid=view-selector-trigger]').textContent();
    expect(triggerText).toContain('看板');

    // 也應該渲染 kanban
    await expect(page.locator('[data-testid=kanban-view]')).toBeVisible();
  });

  test('URL ?view= 優先於 localStorage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    // 先設 localStorage 為 kanban
    await page.evaluate(() => {
      localStorage.setItem(
        'crud-view-pref:todo',
        JSON.stringify({ activeView: 'kanban' }),
      );
    });

    // 但 URL 強制用 todo-list
    await page.goto('http://localhost:3000/admin/crud/todo?view=todo-list');
    await page.waitForTimeout(3000);

    // 應該是 todo-list (URL 優先)
    const triggerText = await page.locator('[data-testid=view-selector-trigger]').textContent();
    expect(triggerText).toContain('待辦清單');
  });

  test('localStorage 指向不存在的 view 時 fallback 預設', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    // localStorage 設一個不存在的 view (例如 'gallery')
    await page.evaluate(() => {
      localStorage.setItem(
        'crud-view-pref:todo',
        JSON.stringify({ activeView: 'gallery' }),
      );
    });

    await page.goto('http://localhost:3000/admin/crud/todo');
    await page.waitForTimeout(3000);

    // 應該 fallback 到預設 (第一個 view = table)
    const triggerText = await page.locator('[data-testid=view-selector-trigger]').textContent();
    expect(triggerText).toContain('表格');
  });

  test('每個 spec 獨立 localStorage key', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    // 清掉
    await page.evaluate(() => localStorage.clear());

    // todo → kanban
    await page.goto('http://localhost:3000/admin/crud/todo');
    await page.waitForTimeout(3000);
    await page.click('[data-testid=view-selector-trigger]');
    await page.waitForTimeout(300);
    await page.click('[data-testid=view-selector-item-kanban]');
    await page.waitForTimeout(1000);

    // blog → table (預設, 不切換)
    await page.goto('http://localhost:3000/admin/crud/blog');
    await page.waitForTimeout(3000);

    // localStorage 應該 todo=kanban, blog 還沒設
    const prefs = await page.evaluate(() => ({
      todo: localStorage.getItem('crud-view-pref:todo'),
      blog: localStorage.getItem('crud-view-pref:blog'),
    }));
    expect(prefs.todo).toContain('kanban');
    expect(prefs.blog).toBeNull();
  });
});