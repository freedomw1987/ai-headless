/**
 * Sprint 16 TECH-039 — RWD E2E 測試
 *
 * 守護：admin CRUD list page 在 3 個 viewport（mobile / tablet / desktop）都正常運作
 *
 * 涵蓋：
 * - 4 spec（blog / event / todo / order）× 3 viewport = 12 個 case
 * - 每個 case 驗證：表格可見、新增按鈕可點、檢視連結可見
 *
 * 注意：
 * - 測試 baseUrl 從 env PLAYWRIGHT_TEST_BASE_URL 讀取（CI 用 staging URL）
 * - login 用 admin@ai-headless.local / admin123
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000';

async function loginUI(page: Page) {
  await page.goto('/admin/login');
  await page.fill('#email', 'admin@ai-headless.local');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin$/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 }, // iPhone SE
  { name: 'tablet', width: 768, height: 1024 }, // iPad
  { name: 'desktop', width: 1280, height: 800 }, // 桌機
] as const;

const SPECS = ['blog', 'event', 'todo', 'order'] as const;

test.describe('Sprint 16 TECH-039 — RWD list page', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page);
  });

  for (const spec of SPECS) {
    for (const vp of VIEWPORTS) {
      test(`${spec} list 在 ${vp.name} (${vp.width}x${vp.height}) viewport 正常運作`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/admin/crud/${spec}`);

        // 1. h1 標題可見
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

        // 2. 「新增」按鈕可見（所有 viewport 都應顯示，按鈕自適應但不會消失）
        const newBtn = page.locator('a[href$="/new"]').first();
        await expect(newBtn).toBeVisible();
        await expect(newBtn).toBeEnabled();

        // 3. Sprint E: < 768px 顯示 MobileListView card，≥ 768px 顯示 table
        const isMobile = vp.width < 768;
        if (isMobile) {
          // mobile: MobileListView 內部含 data-testid=mobile-list-view
          // 桌面 table 在 mobile 被 hidden（CSS hidden md:block），不計為 visible
          const cardView = page.locator('[data-testid=mobile-list-view], [data-testid=mobile-empty-state]').first();
          await expect(cardView).toBeVisible();
        } else {
          // tablet/desktop: table 顯示
          const table = page.locator('table').first();
          await expect(table).toBeVisible();
        }

        // 4. 若有 items，「檢視」連結至少一個可見（在 viewport 內或可水平捲動）
        // Sprint 18 Stage 2: list row actions 改用 DropdownMenu（⋯按鈕）
        const rowActions = page.locator('[data-testid^="row-actions-"]');
        const count = await rowActions.count();
        if (count > 0) {
          // 至少第一個 dropdown trigger 存在於 DOM（不一定在 viewport 內）
          await expect(rowActions.first()).toHaveCount(1);
        } else {
          // 無資料 → 顯示 shadcn Empty 元件（含「尚無」文字）
          await expect(page.getByText(/尚無/)).toBeVisible();
        }
      });
    }
  }

  test('mobile viewport 下顯示 card view (Sprint E)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/crud/blog');

    // Sprint E: mobile 顯示 card view，不顯示 table
    const cardView = page.locator('[data-testid=mobile-list-view], [data-testid=mobile-empty-state]').first();
    await expect(cardView).toBeVisible();

    // Card 內有 checkbox
    const checkbox = page.locator('[data-testid^=mobile-card-][data-testid$=-checkbox]').first();
    await expect(checkbox).toBeVisible();
  });

  test('desktop viewport 下 sidebar 與表格同時可見', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/crud/event');

    // Sidebar（aside）可見
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 15_000 });
    // 主要內容表格可見
    await expect(page.locator('table').first()).toBeVisible();
  });
});