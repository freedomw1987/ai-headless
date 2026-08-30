/**
 * Sprint 41-4 (D) — TD-815 Sidebar close paths E2E
 *
 * 守護什麼: admin sidebar 開啟後可以透過 3 種路徑關閉
 * - 1. Esc 鍵盤 (keyboard user)
 * - 2. 點擊 backdrop (滑鼠 user)
 * - 3. Route change (programmatic navigation 後自動關)
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

test.describe('Sprint 41-4 (D) — TD-815 Sidebar close paths', () => {
  test('Esc 鍵可以關閉 sidebar (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    // 開漢堡選單
    await page.click('[data-testid=mobile-menu-button]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid=admin-sidebar]')).toBeVisible();

    // 按 Esc 應該關閉
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // sidebar 應該在 mobile 上 translate 出去
    const transform = await page.locator('[data-testid=admin-sidebar]').evaluate(
      (el) => window.getComputedStyle(el).transform,
    );
    // translate-x-full 或類似的 transform 表示已關閉
    expect(transform).not.toBe('none');
  });

  test('點擊 backdrop 可以關閉 sidebar (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    await page.click('[data-testid=mobile-menu-button]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid=mobile-menu-button]')).toBeVisible();
    await expect(page.locator('[data-testid=mobile-backdrop]')).toBeVisible();

    // 點擊 backdrop (用 force 避免被 sidebar 遮住)
    await page.locator('[data-testid=mobile-backdrop]').click({ force: true });
    await page.waitForTimeout(500);
    // backdrop 應該消失
    await expect(page.locator('[data-testid=mobile-backdrop]')).not.toBeVisible();
  });

  test('Route change 後 sidebar 自動關閉 (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    await page.click('[data-testid=mobile-menu-button]');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid=mobile-backdrop]')).toBeVisible();

    // 點 sidebar 內的 link 應該觸發 navigation
    await page.click('text=用戶管理');
    await page.waitForURL(/\/admin\/users/, { timeout: 5000 });
    await page.waitForTimeout(500);

    // sidebar 應該自動關閉
    await expect(page.locator('[data-testid=mobile-backdrop]')).not.toBeVisible();
  });
});
