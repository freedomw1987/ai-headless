// Sprint 28-4 — 視覺驗證 users + roles 在 3 viewports

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

  // users page
  await page.goto('http://localhost:3000/admin/users');
  await page.waitForTimeout(2000);
  const usersPath = `test-results/rwd-audit/sprint-28-users-${name}.png`;
  await page.screenshot({ path: usersPath, fullPage: true });
  const usersTable = await page.locator('table').isVisible().catch(() => false);
  const usersMobile = await page.locator('[data-testid=mobile-list-view]').isVisible().catch(() => false);
  console.log(`[users ${name} ${viewport.width}px] table=${usersTable} mobileList=${usersMobile} → ${usersPath}`);

  // roles page
  await page.goto('http://localhost:3000/admin/roles');
  await page.waitForTimeout(2000);
  const rolesPath = `test-results/rwd-audit/sprint-28-roles-${name}.png`;
  await page.screenshot({ path: rolesPath, fullPage: true });
  const rolesTable = await page.locator('table').isVisible().catch(() => false);
  const rolesMobile = await page.locator('[data-testid=mobile-list-view]').isVisible().catch(() => false);
  console.log(`[roles ${name} ${viewport.width}px] table=${rolesTable} mobileList=${rolesMobile} → ${rolesPath}`);

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