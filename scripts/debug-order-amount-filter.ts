// Debug: 為什麼 amount >= 2000 沒顯示資料？

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

  // 1. 不帶 filter 看實際 amount 資料
  await page.goto(`${BASE}/admin/crud/order?pageSize=50`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const rowsNoFilter = await page.locator('tbody tr').count();
  console.log('Total rows (no filter):', rowsNoFilter);

  // 取前幾列的 amount 文字內容（從 cell 抓）
  const cellTexts = await page.locator('tbody tr').evaluateAll((rows) =>
    rows.slice(0, 5).map((row) => {
      const cells = row.querySelectorAll('td');
      return Array.from(cells).map((c) => c.textContent?.trim() ?? '');
    }),
  );
  console.log('First 5 rows:', JSON.stringify(cellTexts, null, 2));

  await page.screenshot({ path: 'test-results/rwd-audit/order-no-filter.png' });

  // 2. 帶 filter ?filters=...
  await page.goto(`${BASE}/admin/crud/order?filters=%5B%7B%22field%22%3A%22amount%22%2C%22operator%22%3A%22gte%22%2C%22value%22%3A%222000%22%7D%5D&pageSize=50`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const rowsWithFilter = await page.locator('tbody tr').count();
  console.log('Rows with amount >= 2000:', rowsWithFilter);

  const cellsWithFilter = await page.locator('tbody tr').evaluateAll((rows) =>
    rows.slice(0, 5).map((row) => {
      const cells = row.querySelectorAll('td');
      return Array.from(cells).map((c) => c.textContent?.trim() ?? '');
    }),
  );
  console.log('Filtered first 5 rows:', JSON.stringify(cellsWithFilter, null, 2));

  await page.screenshot({ path: 'test-results/rwd-audit/order-filter-2000.png' });

  // 3. 直接打 API 看 handler 回什麼
  const apiRes = await page.evaluate(async () => {
    const res = await fetch('/api/crud/order?page=1&pageSize=20&filters=' + encodeURIComponent('[{"field":"amount","operator":"gte","value":"2000"}]'));
    return { status: res.status, body: await res.json() };
  });
  console.log('API response:', JSON.stringify(apiRes, null, 2).slice(0, 1000));

  // 4. 不帶 filter 直接打 API
  const apiResAll = await page.evaluate(async () => {
    const res = await fetch('/api/crud/order?page=1&pageSize=50');
    return { status: res.status, body: await res.json() };
  });
  console.log('API all:', JSON.stringify(apiResAll, null, 2).slice(0, 1500));

  await browser.close();
}

main().catch((err) => {
  console.error('debug failed:', err);
  process.exit(1);
});