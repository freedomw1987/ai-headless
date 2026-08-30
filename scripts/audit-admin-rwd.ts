// Sprint 41-2: RWD 健檢 admin dashboard + role matrix + user form
// 檢查 375 / 1440 viewports 看是否有 overflow

import { chromium } from 'playwright';

const TARGETS = [
  { name: 'admin-dashboard', url: 'http://localhost:3000/admin' },
  { name: 'role-matrix', url: 'http://localhost:3000/admin/roles' },
  { name: 'user-list', url: 'http://localhost:3000/admin/users' },
  { name: 'user-new', url: 'http://localhost:3000/admin/users/new' },
];

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

async function main() {
  const browser = await chromium.launch();

  // 1. login once
  const loginCtx = await browser.newContext();
  const loginPage = await loginCtx.newPage();
  await loginPage.goto('http://localhost:3000/admin/login');
  await loginPage.fill('input#email', 'admin@ai-headless.local');
  await loginPage.fill('input#password', 'admin123');
  await loginPage.click('button[type=submit]');
  await loginPage.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
  // 取得 cookies
  const cookies = await loginCtx.cookies();
  await loginCtx.close();

  for (const vp of VIEWPORTS) {
    for (const t of TARGETS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      await ctx.addCookies(cookies);
      const page = await ctx.newPage();
      await page.goto(t.url);
      await page.waitForTimeout(2000);
      const path = `test-results/rwd-audit/sprint-41-${t.name}-${vp.name}.png`;
      await page.screenshot({ path, fullPage: true });

      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const overflow = bodyScrollWidth > vp.width;
      console.log(`[${t.name} ${vp.name}] bodyScrollWidth=${bodyScrollWidth} overflow=${overflow}`);
      await ctx.close();
    }
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
