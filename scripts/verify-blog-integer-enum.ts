// Sprint D 修補 — 驗證 blog readingTime (integer) + status (enum with options) 篩選

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // 登入
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/admin/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);

  // 訪問 blog
  await page.goto(`${BASE}/admin/crud/blog?pageSize=20`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const initialRows = await page.locator('tbody tr').count();
  console.log('blog initial rows:', initialRows);
  await page.screenshot({ path: 'test-results/rwd-audit/blog-filter-initial.png' });

  // 1. 驗證 readingTime (integer) — 開 dialog，加 row，選 readingTime，看 operators
  const filterBtn = page.locator('[data-testid=advanced-filter-button]');
  await filterBtn.click();
  await page.waitForTimeout(500);

  await page.locator('[data-testid=add-filter-button]').click();
  await page.waitForTimeout(300);

  const firstRow = page.locator('[data-testid=filter-row]').first();
  await firstRow.locator('[data-testid=field-select]').click();
  await page.waitForTimeout(300);
  await page.locator('[role=option]:has-text("readingTime")').click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: 'test-results/rwd-audit/blog-integer-row.png' });

  // 點 operator select 看是否出現 >=, >, =, <, <=, 介於
  await firstRow.locator('[data-testid=operator-select]').click();
  await page.waitForTimeout(300);

  const operatorOptions = await page.locator('[role=option]').allTextContents();
  console.log('readingTime operators:', operatorOptions);

  // 關掉 dropdown
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 2. 換 row 改成 status (enum with options)
  await firstRow.locator('[data-testid=field-select]').click();
  await page.waitForTimeout(300);
  await page.locator('[role=option]:has-text("status")').click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: 'test-results/rwd-audit/blog-status-enum-row.png' });

  // 數 enum checkboxes 數量（應為 4：draft, pending, published, archived）
  // shadcn Checkbox 使用 [role=checkbox] 而不是 input[type=checkbox]
  const enumCheckboxes = await firstRow.locator('[role=checkbox]').count();
  console.log('status enum checkboxes count:', enumCheckboxes);

  // 勾 published（點 label 觸發）
  await firstRow.locator('label:has-text("published")').click();
  await page.waitForTimeout(300);

  // 套用
  await page.locator('[data-testid=apply-button]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const urlAfterApply = page.url();
  console.log('blog URL after apply:', urlAfterApply);

  const rowsAfterFilter = await page.locator('tbody tr').count();
  console.log('blog rows after filter (status in published):', rowsAfterFilter);
  await page.screenshot({ path: 'test-results/rwd-audit/blog-filter-published.png' });

  const result = {
    initialRows,
    readingTimeOperators: operatorOptions,
    statusEnumCheckboxes: enumCheckboxes,
    urlAfterApply,
    rowsAfterFilter,
  };
  console.log('Final result:', JSON.stringify(result, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error('verify-blog-integer-enum failed:', err);
  process.exit(1);
});