// Sprint D 修補 v3 — 視覺確認 order amount filter 修好 + 0 筆結果時 button 還在
//
// 截圖到 test-results/rwd-audit/order-filter-fixed.png

import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL(/.*\/admin/, { timeout: 10000 }),
    page.click('button[type=submit]'),
  ]);

  await page.goto('http://localhost:3000/admin/crud/order');

  // 等工具列
  await page.waitForSelector('[data-testid=advanced-filter-button]', { timeout: 10000 });

  // 截圖 1: 沒有 filter，3 筆全部
  await page.screenshot({ path: 'test-results/rwd-audit/order-filter-no-filter.png', fullPage: true });
  console.log('截圖 1: order-filter-no-filter.png');

  // 開進階篩選 → 加 amount >= 2000
  await page.click('[data-testid=advanced-filter-button]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/rwd-audit/order-filter-dialog-open.png', fullPage: true });
  console.log('截圖 2: order-filter-dialog-open.png');

  // 套用篩選
  await page.click('[data-testid=apply-filter]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/rwd-audit/order-filter-2000.png', fullPage: true });
  const rowCount = await page.locator('tbody tr').count();
  console.log(`截圖 3: order-filter-2000.png (rows: ${rowCount})`);

  // 再加更嚴格的條件 (amount >= 999999) → 0 筆
  await page.click('[data-testid=advanced-filter-button]');
  await page.waitForTimeout(500);
  // 改第一個 filter 的 value
  await page.locator('input[type=number]').first().fill('999999');
  await page.click('[data-testid=apply-filter]');
  await page.waitForTimeout(1000);
  const rowCountZero = await page.locator('tbody tr').count();
  const filterBtnVisible = await page.locator('[data-testid=advanced-filter-button]').isVisible();
  await page.screenshot({ path: 'test-results/rwd-audit/order-filter-zero-rows.png', fullPage: true });
  console.log(`截圖 4: order-filter-zero-rows.png (rows: ${rowCountZero}, filter button visible: ${filterBtnVisible})`);

  await browser.close();
}

main().catch(console.error);