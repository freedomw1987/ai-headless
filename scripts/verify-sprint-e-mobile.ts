// Sprint E4 — 視覺驗證 mobile card view
//
// 3 個 viewport:
// - 375px (iPhone SE): card view
// - 768px (iPad mini portrait): table view
// - 1440px (desktop): table view

import { chromium, Browser, Page } from 'playwright';

async function login(page: Page) {
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

async function captureAt(browser: Browser, viewport: { width: number; height: number }, name: string) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await login(page);
  await page.goto('http://localhost:3000/admin/crud/todo?pageSize=10');
  await page.waitForTimeout(2000);

  const path = `test-results/rwd-audit/sprint-e-${name}.png`;
  await page.screenshot({ path, fullPage: true });

  // 量測 mobile-list-view 是否可見
  const mobileList = await page.locator('[data-testid=mobile-list-view]').isVisible().catch(() => false);
  const table = await page.locator('table').isVisible().catch(() => false);
  console.log(`[${name} ${viewport.width}px] table=${table} mobileList=${mobileList} → ${path}`);

  await page.evaluate(() => localStorage.clear());
  await ctx.close();
}

async function main() {
  const browser = await chromium.launch();

  // iPhone SE
  await captureAt(browser, { width: 375, height: 812 }, 'mobile-375');
  // iPad mini portrait (768px 邊界)
  await captureAt(browser, { width: 768, height: 1024 }, 'tablet-768');
  // Desktop
  await captureAt(browser, { width: 1440, height: 900 }, 'desktop-1440');

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });