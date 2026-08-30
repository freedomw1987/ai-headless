import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });

  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/admin/crud/todo?view=calendar&_t=' + Date.now());
  await page.waitForTimeout(5000);

  const calVisible = await page.locator('[data-testid=calendar-view]').isVisible();
  console.log('calendar view visible:', calVisible);

  if (calVisible) {
    const dayCount = await page.locator('[data-testid^="calendar-day-"]').count();
    console.log('total day elements:', dayCount);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayKey = `calendar-day-${yyyy}-${mm}-${dd}`;
    console.log('today key:', todayKey);
    const todayCount = await page.locator(`[data-testid^="${todayKey}"]`).count();
    console.log('today elements:', todayCount);

    if (todayCount > 0) {
      const todayContent = await page.locator(`[data-testid="${todayKey}"]`).first().textContent();
      console.log('today content:', todayContent?.substring(0, 100));

      const actionsCount = await page.locator(`[data-testid^="${todayKey}-actions-"]`).count();
      console.log('actions elements:', actionsCount);
    }
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
