/**
 * Sprint 32 — Form 頁面 RWD 守護測試
 *
 * 健檢 user CRUD form 和 crud form 在 mobile (375px) 下：
 * - 無水平 overflow
 * - 表單元素可見（不被裁切）
 * - 按鈕可點擊
 *
 * 為什麼需要：
 * - Sprint 27 修的 min-w-0 fix 覆蓋所有 admin shell 內頁
 * - 但 form 頁面可能有自己的 layout 問題沒被發現
 * - 本測試守護：未來加 form field 或改 form layout 不會破 RWD
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

test.describe('Sprint 32 — user form RWD (375px)', () => {
  test('/admin/users/new 在 375px 無 overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto('/admin/users/new');
    await page.waitForTimeout(2000);

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375);
  });

  test('/admin/users/[id]/edit 在 375px 無 overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    // 找一個現有 user
    const res = await page.request.get('/api/users');
    const data = await res.json();
    const users = data.users as Array<{ id: string; isActive: boolean }>;
    const testUser = users.find((u) => u.isActive);
    if (!testUser) {
      test.skip();
      return;
    }

    await page.goto(`/admin/users/${testUser.id}/edit`);
    await page.waitForTimeout(2000);

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375);
  });
});

test.describe('Sprint 32 — CRUD form RWD (375px)', () => {
  test('/admin/crud/[spec]/new 在 375px 無 overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    // 測試 blog 和 todo（兩個典型 spec）
    for (const spec of ['blog', 'todo']) {
      await page.goto(`/admin/crud/${spec}/new`);
      await page.waitForTimeout(1500);
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth, `${spec}/new overflow`).toBeLessThanOrEqual(375);
    }
  });

  test('/admin/crud/[spec]/[id]/edit 在 375px 無 overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    // 找第一個 blog 跟 todo 真實 id
    let tested = 0;
    for (const spec of ['blog', 'todo']) {
      const res = await page.request.get(`/api/crud/${spec}?pageSize=1`);
      const data = await res.json();
      const item = data.items?.[0];
      if (!item) continue;

      await page.goto(`/admin/crud/${spec}/${item.id}/edit`);
      await page.waitForTimeout(1500);
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth, `${spec}/edit overflow`).toBeLessThanOrEqual(375);
      tested++;
    }

    // 至少測一個
    expect(tested).toBeGreaterThan(0);
  });

  test('form submit button 在 375px 可見且可點擊', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto('/admin/users/new');
    await page.waitForTimeout(2000);

    // 找到 submit button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // 在 viewport 內
    const btnBox = await submitBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    expect(btnBox!.x + btnBox!.width).toBeLessThanOrEqual(375);
  });
});