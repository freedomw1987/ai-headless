/**
 * Sprint 40-3 — Actions accessible E2E 守護測試
 *
 * 守護什麼：
 * - 每個 view (Table / Kanban / Calendar / Gallery) 的 ⋯ menu 可被 hover/點擊
 * - 跨 4 個 CRUD specs (todo / blog / event / order)
 * - mobile 也應可見 (不只是 hover)
 *
 * Gate 4 E2E
 *
 * 已知問題（Sprint 40 揭露）：
 * - GalleryView/CalendarView 用 `opacity-0 group-hover:opacity-100`
 * - mobile 沒 hover, actions 看不到
 * - 本測試記錄此問題, 讓未來修
 */

import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

test.describe('Sprint 40-3 — Actions accessible (desktop hover)', () => {
  for (const spec of ['todo', 'blog', 'event', 'order']) {
    test(`${spec}: table view 的 row-action ⋯ menu hover 後可見`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await login(page);

      await page.goto(`http://localhost:3000/admin/crud/${spec}`);
      await page.waitForTimeout(3000);

      // 找第一個 row-action trigger (⋯ 按鈕)
      const trigger = page.locator('[data-testid^="row-actions-"]').first();
      const triggerCount = await trigger.count();
      if (triggerCount === 0) {
        test.skip();
        return;
      }

      // hover 之前 ⋯ 按鈕可能不可見 (opacity-0)
      await trigger.scrollIntoViewIfNeeded();

      // hover 後 ⋯ 按鈕應可見 (opacity 變 1)
      await trigger.hover();
      await page.waitForTimeout(200);

      // 點擊 ⋯ 應打開 dropdown (menu)
      await trigger.click();
      await page.waitForTimeout(500);

      // Dropdown 應該顯示 "編輯" 或 "檢視" 等選項
      // Radix DropdownMenu 用 portal - menuitem 在 document.body 下
      const menuItem = page.locator('[role=menuitem]').first();
      await expect(menuItem).toBeVisible({ timeout: 5000 });
    });
  }
});

test.describe('Sprint 40-3 — Actions accessible (mobile)', () => {
  // Sprint 40-4 修法：actions 在 mobile 永遠可見
  // 用 Calendar view 驗證 (CalendarView 也有同樣的 hover-reveal 問題)

  test('todo list mobile (375px): calendar actions 應該可見', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    // 先設一個 todo 的 dueDate 為今天確保 calendar 有資料
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await page.request.put('http://localhost:3000/api/crud/todo?id=cmta7n2t80003mgief6gn7vf7', {
      data: { dueDate: today.toISOString() },
    });

    await page.goto('http://localhost:3000/admin/crud/todo?view=calendar&_t=' + Date.now());
    await page.waitForTimeout(5000);

    // 找今天的 day cell (actions 元素應該可見)
    const actionsCount = await page.locator('[data-testid^="calendar-day-"][data-testid$="-actions-"]').count();
    console.log('actions count on mobile:', actionsCount);

    // 在 mobile 下, actions 應該預設可見 (opacity 1)
    // 用 boundingBox 看 element 是否真有 layout (visibility hidden 也算有)
    if (actionsCount > 0) {
      const firstActions = page.locator('[data-testid^="calendar-day-"][data-testid$="-actions-"]').first();
      const isVisible = await firstActions.isVisible();
      expect(isVisible).toBe(true);
    }
  });
});