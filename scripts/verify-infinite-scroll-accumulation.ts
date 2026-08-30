/**
 * Sprint A 最終驗證 — 累積邏輯 + rows 數量
 *
 * 確認:
 * 1. ?page=1 顯示 5 筆
 * 2. scroll → ?page=2 → server 累積 query → 顯示 10 筆
 * 3. scroll → ?page=3 → 顯示 15 筆
 * 4. scroll → ?page=4 → 顯示 16 筆 + "已顯示全部"
 */

import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = resolve('test-results/rwd-audit');
mkdirSync(OUT_DIR, { recursive: true });

const SPEC = process.argv[2] ?? 'todo';
const EMAIL = 'admin@ai-headless.local';
const PASSWORD = 'admin123';

async function login(page) {
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await page.fill('input#email', EMAIL);
  await page.fill('input#password', PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function countRows(page) {
  return await page.evaluate(() => {
    return document.querySelectorAll('table tbody tr').length;
  });
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['iPhone 13']);
  const page = await context.newPage();

  console.log(`Sprint A 累積驗證 — spec: ${SPEC} (mobile)`);
  await login(page);

  // 1. page=1 → 5 筆
  await page.goto(`http://localhost:3000/admin/crud/${SPEC}?pageSize=5&page=1`, { waitUntil: 'networkidle' });
  const r1 = await countRows(page);
  console.log(`  page=1 → ${r1} rows (期待 5)`);
  await page.screenshot({ path: resolve(OUT_DIR, 'accumulate-page1.png'), fullPage: true });

  // 2. scroll → page=2 → 10 筆
  await page.locator('[data-testid="infinite-scroll-sentinel"]').scrollIntoViewIfNeeded();
  await page.waitForURL((url) => url.toString().includes('page=2'), { timeout: 5000 });
  await page.waitForLoadState('networkidle');
  const r2 = await countRows(page);
  console.log(`  page=2 → ${r2} rows (期待 10)`);
  await page.screenshot({ path: resolve(OUT_DIR, 'accumulate-page2.png'), fullPage: true });

  // 3. scroll → page=3 → 15 筆
  await page.locator('[data-testid="infinite-scroll-sentinel"]').scrollIntoViewIfNeeded();
  await page.waitForURL((url) => url.toString().includes('page=3'), { timeout: 5000 });
  await page.waitForLoadState('networkidle');
  const r3 = await countRows(page);
  console.log(`  page=3 → ${r3} rows (期待 15)`);
  await page.screenshot({ path: resolve(OUT_DIR, 'accumulate-page3.png'), fullPage: true });

  // 4. scroll → page=4 → 16 筆 + 已顯示全部
  await page.locator('[data-testid="infinite-scroll-sentinel"]').scrollIntoViewIfNeeded();
  await page.waitForURL((url) => url.toString().includes('page=4'), { timeout: 5000 });
  await page.waitForLoadState('networkidle');
  const r4 = await countRows(page);
  const endText = await page.locator('[data-testid="infinite-scroll-end"]').textContent();
  console.log(`  page=4 → ${r4} rows (期待 16), end text: "${endText}"`);
  await page.screenshot({ path: resolve(OUT_DIR, 'accumulate-page4.png'), fullPage: true });

  // 最終驗證結果
  const result = {
    spec: SPEC,
    page1: { rows: r1, expected: 5, pass: r1 === 5 },
    page2: { rows: r2, expected: 10, pass: r2 === 10 },
    page3: { rows: r3, expected: 15, pass: r3 === 15 },
    page4: { rows: r4, expected: 16, pass: r4 === 16, endText },
  };

  console.log('\n=== 結果 ===');
  console.log(JSON.stringify(result, null, 2));

  const allPass = result.page1.pass && result.page2.pass && result.page3.pass && result.page4.pass;
  console.log(`\n${allPass ? '✅ 全部通過' : '❌ 有失敗'}`);

  writeFileSync(resolve(OUT_DIR, 'accumulate-result.json'), JSON.stringify(result, null, 2));
  await browser.close();

  if (!allPass) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
