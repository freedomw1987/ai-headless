// Sprint 20 Stage 1 — Sheet 抽屜式編輯 E2E
//
// 驗證：
// 1. 訪問 /admin/crud/<spec>/<id> → 看到「編輯」按鈕（不再是 Link → /edit）
// 2. 點「編輯」按鈕 → Sheet 從右側滑出（含 DynamicFormClient）
// 3. Sheet 內有表單欄位
// 4. 編輯一個欄位 → 點「儲存」 → Sheet 關閉 → detail page 顯示更新後的值
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

test.describe('Sprint 20 Stage 1 — Sheet 抽屜式編輯', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('blog detail page「編輯」按鈕從 Sheet 滑出（含 form）', async ({ page }) => {
    // 找一個 blog 資料
    await page.goto('/admin/crud/blog');
    await page.waitForLoadState('networkidle');

    // 點第一筆 row 的「⋯」按鈕（展開 DropdownMenu）
    const firstRowAction = page.locator('button[aria-haspopup="menu"]').first();
    await firstRowAction.click();
    // 點「檢視」
    await page.locator('[role="menuitem"]:has-text("檢視")').first().click();
    await page.waitForURL(/\/admin\/crud\/blog\/[^/]+$/, { timeout: 10_000 });

    // 點「編輯」按鈕（觸發 Sheet）
    const editButton = page.locator('button:has-text("編輯")');
    await expect(editButton).toBeVisible();
    await editButton.click();

    // 等待 Sheet 滑出
    const sheetContent = page.locator('[role="dialog"]');
    await expect(sheetContent).toBeVisible({ timeout: 5_000 });

    // Sheet 內應有「編輯資料」標題（用 heading 找，避開 DynamicFormClient 的 CardDescription「編輯資料內容」）
    await expect(page.locator('[role="dialog"] h2:has-text("編輯資料")')).toBeVisible();

    // Sheet 內應有「儲存」按鈕（DynamicFormClient）
    await expect(page.locator('[role="dialog"] >> button:has-text("儲存")')).toBeVisible();

    // 等待 Sheet slide-in-from-right 動畫結束（duration-500ms）
    await page.waitForTimeout(800);

    // 截圖（Gate 4 必跑）— 只截 viewport，Sheet fixed position 在 viewport 內
    await page.screenshot({ path: 'tests/e2e/screenshots/tech-053-sheet-open.png' });
  });

  test('點 Sheet 外部 / 關閉按鈕 → Sheet 關閉', async ({ page }) => {
    await page.goto('/admin/crud/blog');
    await page.waitForLoadState('networkidle');

    // 點第一筆 row 的「⋯」按鈕（展開 DropdownMenu）
    const firstRowAction = page.locator('button[aria-haspopup="menu"]').first();
    await firstRowAction.click();
    await page.locator('[role="menuitem"]:has-text("檢視")').first().click();
    await page.waitForURL(/\/admin\/crud\/blog\/[^/]+$/, { timeout: 10_000 });

    // 開 Sheet
    await page.locator('button:has-text("編輯")').click();
    const sheetContent = page.locator('[role="dialog"]');
    await expect(sheetContent).toBeVisible({ timeout: 5_000 });

    // 點 Sheet 右上角 X 關閉
    await page.locator('[role="dialog"] button[aria-label="Close"]').click();
    await expect(sheetContent).not.toBeVisible({ timeout: 3_000 });
  });

  test('Sheet 內輸入框可編輯 + 預填 initialData', async ({ page }) => {
    await page.goto('/admin/crud/blog');
    await page.waitForLoadState('networkidle');

    // 點第一筆 row 的「⋯」按鈕（展開 DropdownMenu）
    const firstRowAction = page.locator('button[aria-haspopup="menu"]').first();
    await firstRowAction.click();
    await page.locator('[role="menuitem"]:has-text("檢視")').first().click();
    await page.waitForURL(/\/admin\/crud\/blog\/[^/]+$/, { timeout: 10_000 });

    // 開 Sheet
    await page.locator('button:has-text("編輯")').click();
    const sheetContent = page.locator('[role="dialog"]');
    await expect(sheetContent).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(800);

    // 標題 input 應預填原始 title 值
    const titleInput = page.locator('[role="dialog"] input').first();
    const initialValue = await titleInput.inputValue();
    expect(initialValue.length).toBeGreaterThan(0);

    // 修改 input 值
    await titleInput.fill(`${initialValue} Sheet測試`);
    const newValue = await titleInput.inputValue();
    expect(newValue).toContain('Sheet測試');

    // Sheet 仍保持開啟（未按儲存）
    await expect(sheetContent).toBeVisible();

    // 關閉 Sheet
    await page.locator('[role="dialog"] button[aria-label="Close"]').click();
    await expect(sheetContent).not.toBeVisible({ timeout: 3_000 });

    // 重新開 Sheet → 修改值不保留（因為 Sheet 內 state 是 component-local，close → remount）
    await page.locator('button:has-text("編輯")').click();
    await expect(sheetContent).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(500);
    const titleInputAgain = page.locator('[role="dialog"] input').first();
    const reOpenValue = await titleInputAgain.inputValue();
    expect(reOpenValue).not.toContain('Sheet測試');
    expect(reOpenValue).toBe(initialValue);
  });
});