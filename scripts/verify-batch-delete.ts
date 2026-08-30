/**
 * Sprint B5 真實瀏覽器驗證腳本
 *
 * 流程:
 * 1. 登入 admin
 * 2. 進 todo list page
 * 3. 確認 checkbox 渲染 (row + 全選)
 * 4. 選 2 個 row → 點「批次刪除」
 * 5. 確認 dialog 開啟
 * 6. 打 DELETE → 確認 toast + row 消失
 * 7. 桌面 + 手機兩種斷點截圖
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE_URL = 'http://localhost:3000';

async function login(page: import('playwright').Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function verifyBatchDelete() {
  const browser = await chromium.launch({ headless: true });
  const results: Record<string, unknown> = {};

  // ========== 桌面 1280x800 ==========
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await login(page);
    await page.goto(`${BASE_URL}/admin/crud/todo?pageSize=10`);
    await page.waitForLoadState('networkidle');

    // 截圖 1: 初始 list
    await page.screenshot({ path: 'test-results/rwd-audit/batch-delete-before.png', fullPage: true });

    // 確認 checkbox 存在
    const rowCheckboxes = await page.locator('[data-testid=row-checkbox]').count();
    const selectAll = await page.locator('[data-testid=select-all-checkbox]').count();
    results.desktop_initialCheckboxes = { rowCheckboxes, selectAll };

    // 確認 batch-delete-button 預設 disabled
    const batchBtn = page.locator('[data-testid=batch-delete-button]');
    const disabledBefore = await batchBtn.isDisabled();
    results.desktop_batchBtnDisabledBefore = disabledBefore;

    // 選前 2 個 row
    await page.locator('[data-testid=row-checkbox]').nth(0).click();
    await page.locator('[data-testid=row-checkbox]').nth(1).click();

    // 確認已選 2 筆
    const selectionCount = await page.locator('[data-testid=selection-count]').textContent();
    results.desktop_selectionCount = selectionCount;

    // 確認 batch-delete-button enabled
    const disabledAfter = await batchBtn.isDisabled();
    results.desktop_batchBtnEnabledAfter = !disabledAfter;

    // 截圖 2: 選中 row
    await page.screenshot({ path: 'test-results/rwd-audit/batch-delete-selected.png', fullPage: true });

    // 點擊 batch-delete-button → dialog 開啟
    await batchBtn.click();
    await page.waitForSelector('[data-testid=delete-confirm-input]', { timeout: 5_000 });
    const dialogVisible = await page.locator('[data-testid=delete-confirm-input]').isVisible();
    results.desktop_dialogVisible = dialogVisible;

    // 截圖 3: dialog 開啟
    await page.screenshot({ path: 'test-results/rwd-audit/batch-delete-dialog.png', fullPage: true });

    // 確認 delete button 預設 disabled
    const deleteBtn = page.locator('[data-testid=delete-confirm-button]');
    const deleteDisabledBefore = await deleteBtn.isDisabled();
    results.desktop_deleteBtnDisabledBefore = deleteDisabledBefore;

    // 打字 DELETE
    await page.locator('[data-testid=delete-confirm-input]').fill('DELETE');
    const deleteDisabledAfter = await deleteBtn.isDisabled();
    results.desktop_deleteBtnEnabledAfter = !deleteDisabledAfter;

    // 截圖 4: 已打 DELETE
    await page.screenshot({ path: 'test-results/rwd-audit/batch-delete-confirm.png', fullPage: true });

    // 確認 → 點 delete button
    await deleteBtn.click();

    // 等 toast 出現
    await page.waitForSelector('li[data-sonner-toast]', { timeout: 10_000 });
    const toastText = await page.locator('li[data-sonner-toast]').first().textContent();
    results.desktop_toastText = toastText;

    // 截圖 5: toast 顯示
    await page.screenshot({ path: 'test-results/rwd-audit/batch-delete-toast.png', fullPage: true });

    await context.close();
  }

  // ========== 手機 iPhone 13 ==========
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    const page = await context.newPage();
    await login(page);
    await page.goto(`${BASE_URL}/admin/crud/todo?pageSize=10`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/rwd-audit/batch-delete-mobile.png', fullPage: true });

    const mobileRowCheckboxes = await page.locator('[data-testid=row-checkbox]').count();
    const mobileSelectAll = await page.locator('[data-testid=select-all-checkbox]').count();
    results.mobile_initialCheckboxes = { rowCheckboxes: mobileRowCheckboxes, selectAll: mobileSelectAll };

    await context.close();
  }

  await browser.close();
  writeFileSync('test-results/rwd-audit/batch-delete-result.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

verifyBatchDelete().catch((err) => {
  console.error(err);
  process.exit(1);
});
