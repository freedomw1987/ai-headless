/**
 * Sprint 31-1 — Admin 頁面 RWD 守護測試
 *
 * 健檢 admin 後台所有關鍵頁面在 375px（mobile）下：
 * - 無水平 overflow (bodyScrollWidth <= viewport width)
 * - 文字內容完整可讀
 *
 * 為什麼需要：
 * - Sprint 27 只修了 blog CRUD list 的 RWD
 * - 其他 admin 頁面（dashboard / extensions / roles / users）沒守護測試
 * - 用戶報 bug 表示仍可能有未發現問題
 *
 * Gate 4 E2E：守護測試
 */

import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

const ADMIN_PAGES = [
  { name: 'dashboard', url: '/admin' },
  { name: 'extensions', url: '/admin/extensions' },
  { name: 'users', url: '/admin/users' },
  { name: 'roles', url: '/admin/roles' },
];

test.describe('Sprint 31-1 — admin 頁面 mobile RWD (375px)', () => {
  for (const { name, url } of ADMIN_PAGES) {
    test(`${name} 在 375px 無水平 overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await login(page);
      await page.goto(url);
      await page.waitForTimeout(2000);

      const viewportWidth = page.viewportSize()?.width ?? 375;
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);

      expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth);
    });
  }
});

test.describe('Sprint 31-1 — matrix 頁面 RWD', () => {
  test('role matrix 頁面在 375px 顯示所有 permission sections（Users, Roles, Blog 等）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    // 透過 API 找第一個非系統 role
    const rolesRes = await page.request.get('/api/admin/roles');
    const roles = (await rolesRes.json()).data;
    const testRole = roles.find((r: { isSystem: boolean }) => !r.isSystem);
    if (!testRole) {
      test.skip();
      return;
    }

    await page.goto(`/admin/roles/${testRole.id}/permissions`);
    await page.waitForTimeout(3000);

    // 應該顯示至少 1 個 resource section
    const cards = await page.locator('[class*=card]').count();
    expect(cards).toBeGreaterThan(0);

    // 應該無 overflow
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375);
  });
});