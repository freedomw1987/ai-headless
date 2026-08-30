// Sprint D3 — 真實瀏覽器驗證 AdvancedFilterDialog
//
// 流程：
// 1. 登入 admin
// 2. 訪問 /admin/crud/todo
// 3. 確認「篩選」按鈕存在
// 4. 點擊 → Dialog 開啟
// 5. 加一個 row: title contains 「測試」
// 6. 點「套用」→ URL 更新為 ?filters=...
// 7. 表格顯示篩選後結果
// 8. 重新打開 Dialog → 看到剛才的 filter
// 9. 測試不同類型 (priority in [high], completed isTrue, count gte 5)
// 10. 截圖驗證

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // 1. 登入
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/admin/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);

  // 2. 訪問 todo
  await page.goto(`${BASE}/admin/crud/todo?pageSize=20`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const initialRows = await page.locator('tbody tr').count();
  console.log('Initial rows:', initialRows);
  await page.screenshot({ path: 'test-results/rwd-audit/filter-initial.png' });

  // 3. 點「篩選」按鈕
  const filterBtn = page.locator('[data-testid=advanced-filter-button]');
  const filterBtnVisible = await filterBtn.isVisible();
  console.log('Filter button visible:', filterBtnVisible);

  await filterBtn.click();
  await page.waitForTimeout(500);

  const dialog = page.locator('[data-testid=advanced-filter-content]');
  console.log('Dialog visible after click:', await dialog.isVisible());
  await page.screenshot({ path: 'test-results/rwd-audit/filter-dialog-open.png' });

  // 4. 加第一個 row: title contains「test」
  await page.locator('[data-testid=add-filter-button]').click();
  await page.waitForTimeout(300);

  const firstRow = page.locator('[data-testid=filter-row]').first();

  // 選 field (Radix Select: click trigger + 點 option)
  await firstRow.locator('[data-testid=field-select]').click();
  await page.waitForTimeout(300);
  await page.locator('[role=option]:has-text("title")').click();
  await page.waitForTimeout(300);

  // 填 value
  await firstRow.locator('[data-testid=string-input]').fill('test');
  await page.waitForTimeout(300);

  // 5. 加第二個 row: completed isTrue
  await page.locator('[data-testid=add-filter-button]').click();
  await page.waitForTimeout(300);

  const secondRow = page.locator('[data-testid=filter-row]').nth(1);
  await secondRow.locator('[data-testid=field-select]').click();
  await page.waitForTimeout(300);
  await page.locator('[role=option]:has-text("completed")').click();
  await page.waitForTimeout(300);

  // 選「是」(isTrue)
  const booleanSelect = secondRow.locator('[data-testid=boolean-select]');
  await booleanSelect.click();
  await page.waitForTimeout(300);
  await page.locator('[role=option]:has-text("是")').click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: 'test-results/rwd-audit/filter-two-rows.png' });

  // 6. 套用
  await page.locator('[data-testid=apply-button]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const urlAfterApply = page.url();
  console.log('URL after apply:', urlAfterApply);
  console.log('URL contains filters=:', urlAfterApply.includes('filters='));

  const rowsAfterFilter = await page.locator('tbody tr').count();
  console.log('Rows after filter:', rowsAfterFilter);
  await page.screenshot({ path: 'test-results/rwd-audit/filter-after-apply.png' });

  // 7. 重新打開 Dialog → 看到剛才的 filter
  await filterBtn.click();
  await page.waitForTimeout(500);

  const rowsInDialog = await page.locator('[data-testid=filter-row]').count();
  console.log('Filter rows in dialog after reopen:', rowsInDialog);
  await page.screenshot({ path: 'test-results/rwd-audit/filter-reopen.png' });

  // 8. 清除所有 filters
  await page.locator('[data-testid=clear-button]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-testid=apply-button]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const urlAfterClear = page.url();
  console.log('URL after clear (should not have filters=):', urlAfterClear);

  const rowsAfterClear = await page.locator('tbody tr').count();
  console.log('Rows after clear:', rowsAfterClear);
  await page.screenshot({ path: 'test-results/rwd-audit/filter-after-clear.png' });

  // 寫 JSON 結果
  const result = {
    initialRows,
    filterBtnVisible,
    dialogVisible: await dialog.count(),
    urlAfterApply,
    rowsAfterFilter,
    rowsInDialogAfterReopen: rowsInDialog,
    urlAfterClear,
    rowsAfterClear,
  };
  console.log('Final result:', JSON.stringify(result, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error('verify-advanced-filter failed:', err);
  process.exit(1);
});