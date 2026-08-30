// Sprint A — list page infinite scroll E2E
// (從 Sprint 19 Stage 2 改寫，pagination UI → infinite scroll)
//
// 驗證：
// 1. 訪問 /admin/crud/<spec> → 看到「共 N 筆資料」+ InfiniteScrollTrigger
// 2. 訪問 /admin/crud/<spec>?page=2 → server 撈 page 1+2 → 累積 items
// 3. scroll 到底部 → trigger push ?page=3 → 累積更多 items

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

// 用 todo (>= 10 筆 seed) 測累積邏輯
// event 只有 2 筆不適合測無限捲動累積
const SPECS_WITH_DATA = ['todo'];

test.describe('Sprint A — list page infinite scroll', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const specName of SPECS_WITH_DATA) {
    test(`${specName} list page 預設 page=1 顯示 InfiniteScrollTrigger`, async ({ page }) => {
      await page.goto(`/admin/crud/${specName}?pageSize=5`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 應該看到「共 N 筆資料」（header 區）
      const subInfo = await page.locator('text=/共 \\d+ 筆資料/').first().textContent();
      expect(subInfo).toBeTruthy();

      // 應該看到 InfiniteScrollTrigger sentinel 或 end marker
      const sentinel = page.locator('[data-testid=infinite-scroll-sentinel], [data-testid=infinite-scroll-end]').first();
      await expect(sentinel).toBeVisible();
    });

    test(`${specName} list page 訪問 ?page=2 → 累積 page 1+2 items`, async ({ page }) => {
      await page.goto(`/admin/crud/${specName}?page=2&pageSize=5`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 應該顯示「已載入」資訊（顯示已累積的 items）
      const loadedInfo = await page.locator('text=/已載入 \\d+/').first().textContent();
      expect(loadedInfo).toBeTruthy();
      // 至少 5 筆（page 1 + page 2）
      expect(loadedInfo).toMatch(/已載入 [5-9]|\d{2,}/);
    });

    test(`${specName} list page scroll 到底部 → trigger 自動 push ?page=N+1`, async ({ page }) => {
      await page.goto(`/admin/crud/${specName}?pageSize=5`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 記錄初始 URL
      const initialUrl = page.url();

      // scroll 到 bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);

      // URL 應該已經 push ?page=N (page 變大)
      expect(page.url()).toMatch(/[?&]page=2|[?&]page=3/);
    });
  }

  test('blog list page 總筆數 <= pageSize → 顯示「已顯示全部」end marker', async ({ page }) => {
    // blog 只有 2 筆（小於 pageSize=10），應該看到 end marker
    await page.goto('/admin/crud/blog?pageSize=10');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 應該看到「已顯示全部 N 筆」end marker
    const endMarker = page.locator('[data-testid=infinite-scroll-end]');
    await expect(endMarker).toBeVisible();
    const endText = await endMarker.textContent();
    expect(endText).toMatch(/已顯示全部 \d+ 筆/);
  });
});
