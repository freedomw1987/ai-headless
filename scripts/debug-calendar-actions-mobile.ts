import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });

  // 設多個 todo 的 dueDate 到這個月
  const todos = await page.request.get('http://localhost:3000/api/crud/todo?pageSize=3');
  const items = (await todos.json()).items;
  console.log('first todo:', items[0]?.title, 'dueDate:', items[0]?.dueDate);

  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/admin/crud/todo?view=calendar&_t=' + Date.now());
  await page.waitForTimeout(5000);

  // 看 calendar 完整結構
  const allDataTestIds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid]')).slice(0, 30).map(el => el.getAttribute('data-testid'));
  });
  console.log('all data-testids:', allDataTestIds);

  // 看 calendar-view 內部
  const calendarHtml = await page.evaluate(() => {
    const el = document.querySelector('[data-testid=calendar-view]');
    if (!el) return 'no calendar-view';
    const days = el.querySelectorAll('[data-testid^=calendar-day-]');
    return Array.from(days).slice(0, 3).map(d => ({
      testid: d.getAttribute('data-testid'),
      content: d.textContent?.substring(0, 80),
      childCount: d.children.length,
    }));
  });
  console.log('calendar first 3 days:', calendarHtml);

  await page.screenshot({ path: 'test-results/rwd-audit/sprint-40-mobile-calendar.png', fullPage: true });
  console.log('saved screenshot');
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
