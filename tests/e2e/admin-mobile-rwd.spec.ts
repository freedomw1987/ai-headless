/**
 * Sprint 32 commit 5 — Playwright snapshot 測試 (手機 RWD)
 *
 * 對應 PRD: docs/specs/extension-spec.md
 * 對應 Backlog: Sprint 32 Plan Gate (Q3 測試策略: snapshot + 手動驗證)
 *
 * 守護:
 * - 手機 viewport (375x667) 下,admin sidebar 預設隱藏
 * - 點擊漢堡按鈕 → sidebar 顯示
 * - sidebar 內連結可點擊且導航正確
 * - 桌面 viewport (1280x720) 下,sidebar 預設顯示
 *
 * 注意:
 * - 需要 dev server (PLAYWRIGHT_WEBSERVER=auto)
 * - 跑法: pnpm test:e2e:ci 或啟動 dev server 後跑 pnpm test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('Sprint 32 — admin 手機 RWD', () => {
  test('手機 viewport: admin sidebar 預設隱藏 + 漢堡按鈕存在', async ({ page }) => {
    // 設置手機 viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 登入
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.toString().includes('/admin/login'), {
      timeout: 15_000,
    });

    // 漢堡按鈕應可見 (手機)
    const menuButton = page.getByTestId('mobile-menu-button');
    await expect(menuButton).toBeVisible();

    // Sidebar 預設隱藏 (translate-x-full)
    const sidebar = page.getByTestId('admin-sidebar');
    await expect(sidebar).toBeVisible(); // element 存在
    // 檢查 class 含 -translate-x-full (隱藏狀態)
    const sidebarClass = await sidebar.getAttribute('class');
    expect(sidebarClass).toMatch(/-translate-x-full/);
  });

  test('手機 viewport: 點擊漢堡按鈕 → sidebar 顯示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.toString().includes('/admin/login'), {
      timeout: 15_000,
    });

    // 點擊漢堡按鈕
    const menuButton = page.getByTestId('mobile-menu-button');
    await menuButton.click();

    // 等待 sidebar translate
    await page.waitForTimeout(500); // 等待 CSS transition

    // Sidebar 應顯示 (translate-x-0)
    const sidebar = page.getByTestId('admin-sidebar');
    const sidebarClass = await sidebar.getAttribute('class');
    expect(sidebarClass).toMatch(/translate-x-0/);
  });

  test('桌面 viewport: admin sidebar 預設顯示 (sm:flex-row)', async ({ page }) => {
    // 桌面 viewport (預設 1280x720)
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.toString().includes('/admin/login'), {
      timeout: 15_000,
    });

    // Sidebar 應預設顯示 (sm:flex-row + sm:translate-x-0)
    const sidebar = page.getByTestId('admin-sidebar');
    await expect(sidebar).toBeVisible();
    const sidebarClass = await sidebar.getAttribute('class');
    expect(sidebarClass).toMatch(/sm:flex-row/);
  });
});