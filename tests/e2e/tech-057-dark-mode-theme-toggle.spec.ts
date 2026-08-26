// Sprint 20 Stage 3 — Dark mode + ThemeToggle E2E
import { test, expect } from '@playwright/test';

test.describe('Sprint 20 Stage 3 — Dark mode + ThemeToggle', () => {
  test('ThemeToggle 出現在 admin layout，點擊展開三模式選單', async ({ page }) => {
    // 登入
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // ThemeToggle 應存在
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('button[aria-label="切換主題"]');
    await expect(toggle).toBeVisible();

    // 點擊展開 dropdown
    await toggle.click();
    await page.waitForTimeout(300);

    // 三模式選項
    await expect(page.getByText('亮色')).toBeVisible();
    await expect(page.getByText('暗色')).toBeVisible();
    await expect(page.getByText('跟隨系統')).toBeVisible();
  });

  test('切換到 dark 模式 → html 加上 dark class', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 確認 dark class 一開始不存在
    const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    // 系統模式（system）：若 OS 是 light 則 false；若是 dark 則 true。我們直接設 dark 後檢查。

    // 開 dropdown → 點暗色
    await page.locator('button[aria-label="切換主題"]').click();
    await page.waitForTimeout(200);
    await page.getByText('暗色').click();
    await page.waitForTimeout(500);

    const afterDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterDark).toBe(true);
    console.log('After dark: html has dark class =', afterDark, '(initial system mode dark =', initialDark, ')');

    // 截圖
    await page.screenshot({ path: 'tests/e2e/screenshots/tech-057-dark-mode.png' });
  });

  test('切換回 light 模式 → html 移除 dark class', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 開 dropdown → 點亮色
    await page.locator('button[aria-label="切換主題"]').click();
    await page.waitForTimeout(200);
    await page.getByText('亮色').click();
    await page.waitForTimeout(500);

    const afterLight = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterLight).toBe(false);
  });
});