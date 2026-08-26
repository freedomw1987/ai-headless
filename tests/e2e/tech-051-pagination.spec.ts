// Sprint 19 Stage 2 — list page pagination UI E2E
//
// 驗證：
// 1. 訪問 /admin/crud/<spec> → 看到分頁 UI（當總筆數 > pageSize）
// 2. 訪問 /admin/crud/<spec>?page=2 → 切換到第 2 頁
// 3. click page=2 link → URL 變 ?page=2
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@ai-headless.local';
const ADMIN_PASSWORD = 'admin123';

async function login(page: any) {
  await page.goto('/admin/login');
  await page.fill('input#email', ADMIN_EMAIL);
  await page.fill('input#password', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });
}

const SPECS_WITH_DATA = ['event'];

test.describe('Sprint 19 Stage 2 — list page pagination UI', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const specName of SPECS_WITH_DATA) {
    test(`${specName} list page 預設 page=1 顯示分頁 UI（總筆數 > pageSize）`, async ({ page }) => {
      // 訪問 list page（無 searchParams）
      await page.goto(`/admin/crud/${specName}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // 應該看到「共 N 筆資料（第 1 / M 頁）」，M > 1
      const subInfo = await page.locator('text=/共 \\d+ 筆資料/').first().textContent();
      expect(subInfo).toBeTruthy();
      expect(subInfo).toMatch(/第 1 \/ 2 頁/);

      // 應該看到「下一頁」連結
      const nextLink = page.locator('a:has-text("下一頁")');
      await expect(nextLink).toBeVisible();
      const nextHref = await nextLink.getAttribute('href');
      expect(nextHref).toContain('page=2');
    });

    test(`${specName} list page 訪問 ?page=2 切換到第 2 頁`, async ({ page }) => {
      await page.goto(`/admin/crud/${specName}?page=2&pageSize=10`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // 應該看到「共 N 筆資料（第 2 / M 頁）」
      const subInfo = await page.locator('text=/共 \\d+ 筆資料/').first().textContent();
      expect(subInfo).toBeTruthy();
      expect(subInfo).toMatch(/第 2 \/ 2 頁/);

      // 應該看到「上一頁」連結
      const prevLink = page.locator('a:has-text("上一頁")');
      await expect(prevLink).toBeVisible();
    });

    test(`${specName} list page click page=2 link → URL 變 ?page=2`, async ({ page }) => {
      await page.goto(`/admin/crud/${specName}?page=1&pageSize=10`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // click page=2 連結
      const page2Link = page.locator('a[href*="page=2"]').first();
      await page2Link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // URL 應該包含 page=2
      expect(page.url()).toMatch(/[?&]page=2/);

      // 應該顯示「第 2 / 2 頁」
      const subInfo = await page.locator('text=/共 \\d+ 筆資料/').first().textContent();
      expect(subInfo).toMatch(/第 2 \/ 2 頁/);
    });
  }

  test('blog list page 預設 page=1 顯示分頁資訊（總筆數 <= pageSize，無 pagination UI）', async ({ page }) => {
    // blog 只有 2 筆（小於 pageSize=10），不應顯示 pagination UI
    await page.goto('/admin/crud/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 應該看到「共 2 筆資料（第 1 / 1 頁）」
    const subInfo = await page.locator('text=/共 \\d+ 筆資料/').first().textContent();
    expect(subInfo).toMatch(/第 1 \/ 1 頁/);

    // 不應該看到「下一頁」連結
    const nextLink = page.locator('a:has-text("下一頁")');
    await expect(nextLink).toHaveCount(0);
  });
});
