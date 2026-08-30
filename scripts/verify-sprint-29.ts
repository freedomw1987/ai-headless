// Sprint 29-4 — 視覺驗證 sidebar + settings page

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

  // Dashboard (看 sidebar)
  await page.goto('http://localhost:3000/admin');
  await page.waitForTimeout(2000);
  const dashPath = `test-results/rwd-audit/sprint-29-sidebar-${name}.png`;
  await page.screenshot({ path: dashPath, fullPage: true });
  console.log(`[sidebar ${name} ${viewport.width}px] → ${dashPath}`);

  // Settings page
  await page.goto('http://localhost:3000/admin/settings');
  await page.waitForTimeout(2000);
  const settingsPath = `test-results/rwd-audit/sprint-29-settings-${name}.png`;
  await page.screenshot({ path: settingsPath, fullPage: true });
  console.log(`[settings ${name} ${viewport.width}px] → ${settingsPath}`);

  await ctx.close();
}

async function main() {
  const browser = await chromium.launch();
  await captureAt(browser, { width: 375, height: 812 }, 'mobile-375');
  await captureAt(browser, { width: 768, height: 1024 }, 'tablet-768');
  await captureAt(browser, { width: 1440, height: 900 }, 'desktop-1440');
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });