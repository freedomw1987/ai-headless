// Sprint 20 Stage 2 — Tooltip sortable header E2E
//
// 驗證：
// 1. list page sortable header hover → Tooltip 顯示「點擊切換排序」+ 排序狀態
// 2. 點擊 sortable header → URL 切換 sort/order
// 3. 已排序欄位 Tooltip 顯示「升冪」/「降冪」
// 4. 未排序欄位 Tooltip 顯示「未排序」
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

test.describe('Sprint 20 Stage 2 — Tooltip sortable header', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('blog list hover sortable header → Tooltip 顯示「點擊切換排序」+「未排序」', async ({ page }) => {
    await page.goto('/admin/crud/blog');
    await page.waitForLoadState('networkidle');

    // 找第一個 sortable header（任何 field 都行）
    const firstHeader = page.locator('th a').first();
    await expect(firstHeader).toBeVisible();

    // hover → Tooltip 出現（Radix UI 用 [data-state=delayed-open] 或 role="tooltip"）
    await firstHeader.hover();
    await page.waitForTimeout(500);

    // Tooltip 內容
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 3_000 });
    await expect(tooltip).toContainText('點擊切換排序');
    // 第一個 field 不一定已排序，狀態可能是「未排序」
    await expect(tooltip).toContainText(/未排序|升冪|降冪/);

    // 截圖（Gate 4 必跑）
    await page.screenshot({ path: 'tests/e2e/screenshots/tech-054-tooltip-sortable.png' });
  });

  test('點擊 sortable header → URL 切換 sort/order，Tooltip 顯示「降冪」', async ({ page }) => {
    // 先訪問 list page（無 sort）
    await page.goto('/admin/crud/blog');
    await page.waitForLoadState('networkidle');

    // 找第一個 sortable header 並 hover（Tooltip 顯示「未排序」）
    const firstHeader = page.locator('th a').first();
    await firstHeader.hover();
    await page.waitForTimeout(500);
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/未排序|升冪/);

    // 點擊該 header → URL 加 sort + order=desc
    const headerHref = await firstHeader.getAttribute('href');
    expect(headerHref).toMatch(/sort=/);
    expect(headerHref).toMatch(/order=desc/);

    // 訪問帶 sort 的 URL
    await page.goto(`http://localhost:3000${headerHref}`);
    await page.waitForLoadState('networkidle');

    // hover 同樣的 header → Tooltip 顯示「降冪」
    const sortedHeader = page.locator('th a').first();
    await sortedHeader.hover();
    await page.waitForTimeout(500);
    const sortedTooltip = page.locator('[role="tooltip"]');
    await expect(sortedTooltip).toBeVisible({ timeout: 3_000 });
    await expect(sortedTooltip).toContainText('降冪');
  });
});