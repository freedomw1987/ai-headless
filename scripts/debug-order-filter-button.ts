// Debug: order 進階篩選 button 是否可見？

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/login`);
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/admin/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);

  // 不帶 filter
  await page.goto(`${BASE}/admin/crud/order`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const filterBtnNoFilter = await page.locator('[data-testid=advanced-filter-button]').isVisible();
  console.log('Filter button visible (no filter):', filterBtnNoFilter);
  await page.screenshot({ path: 'test-results/rwd-audit/order-debug-no-filter.png' });

  // 帶 filter: amount >= 999999 (不可能有的值 → 應該 0 筆)
  await page.goto(`${BASE}/admin/crud/order?filters=%5B%7B%22field%22%3A%22amount%22%2C%22operator%22%3A%22gte%22%2C%22value%22%3A%22999999%22%7D%5D`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const filterBtnAfterNoResult = await page.locator('[data-testid=advanced-filter-button]').isVisible();
  console.log('Filter button visible (no result filter):', filterBtnAfterNoResult);

  const rowsCount = await page.locator('tbody tr').count();
  console.log('Rows count (amount >= 999999):', rowsCount);

  const totalText = await page.locator('p:has-text("共")').textContent();
  console.log('Total text:', totalText);
  await page.screenshot({ path: 'test-results/rwd-audit/order-debug-no-result.png' });

  await browser.close();
}

main().catch((err) => {
  console.error('debug failed:', err);
  process.exit(1);
});