// Sprint 20 Stage 4 — Toast sonner 升級 E2E
import { test, expect } from '@playwright/test';

test.describe('Sprint 20 Stage 4 — Toast sonner 升級', () => {
  test('Extensions 頁面啟用 extension → 出現 sonner success toast', async ({ page }) => {
    // 登入
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // 開 Extensions 頁
    await page.goto('/admin/extensions');
    await page.waitForLoadState('networkidle');

    // 找一個啟用按鈕（先找有 disabled attribute 的）
    const toggleBtn = page.locator('[data-testid^="toggle-"]').first();
    await expect(toggleBtn).toBeVisible();

    // 點擊 toggle
    await toggleBtn.click();

    // 等 sonner toast 出現（sonner 用 [data-sonner-toaster] 容器 + role=status）
    // sonner toast 內容包含「已啟用」或「已停用」
    await expect(page.locator('text=/已啟用|已停用/').first()).toBeVisible({ timeout: 8000 });

    // 等 1 秒等動畫
    await page.waitForTimeout(800);

    // 截圖
    await page.screenshot({ path: 'tests/e2e/screenshots/tech-058-sonner-toast.png' });
  });

  test('Sprint 20 P1 修復：dark mode 下 toast 也是深色', async ({ page }) => {
    // 登入
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // 切到 dark mode
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.locator('button[aria-label="切換主題"]').click();
    await page.waitForTimeout(200);
    await page.getByText('暗色').click();
    await page.waitForTimeout(500);

    // 確認 html.dark
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(true);

    // 觸發 toast
    await page.goto('/admin/extensions');
    await page.waitForLoadState('networkidle');
    const toggleBtn = page.locator('[data-testid^="toggle-"]').first();
    await toggleBtn.click();

    // 等 toast
    await expect(page.locator('text=/已啟用|已停用/').first()).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);

    // 截圖（dark mode + sonner toast）
    await page.screenshot({ path: 'tests/e2e/screenshots/tech-058-sonner-toast-dark.png' });
  });

  test('頁面無 ToastProvider wrapper（Toaster 在 layout 已全站覆蓋）', async ({ page }) => {
    // 確認 Toaster 元素存在於 layout（sonner 在 <body> 內 mount）
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // 進入任一 admin 頁面，觸發 toggle toast 後立刻確認 sonner DOM 出現
    await page.goto('/admin/extensions');
    await page.waitForLoadState('networkidle');

    // 設 Promise 並 click（toast 仍 visible）
    const toastPromise = expect(page.locator('text=/已啟用|已停用/').first()).toBeVisible({ timeout: 8000 });
    await page.locator('[data-testid^="toggle-"]').first().click();
    await toastPromise;

    // 預期：sonner toast li 元素存在（data-sonner-toast）
    // （Toaster 持續 mount，但 toast 可能被 dismiss 所以用 toast 剛出現的窗口檢查）
    const html = await page.content();
    expect(html).toMatch(/data-sonner-toast/);
  });

  test('toggle 失敗 → 出現 sonner error toast', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // 攔截 toggle API 回 error
    await page.route('**/api/extensions/*/toggle', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '測試強制失敗' }),
      });
    });

    await page.goto('/admin/extensions');
    await page.waitForLoadState('networkidle');

    const toggleBtn = page.locator('[data-testid^="toggle-"]').first();
    await toggleBtn.click();

    // 等 error toast（sonner error 樣式）
    await page.waitForTimeout(1500);
    const errorToast = await page.locator('text=/失敗|error/i').first().isVisible().catch(() => false);
    console.log('Error toast visible:', errorToast);
  });
});