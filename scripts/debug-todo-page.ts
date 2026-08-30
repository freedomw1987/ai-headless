import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);

  console.log('After login, URL:', page.url());

  await page.goto('http://localhost:3000/admin/crud/todo?pageSize=5');
  await page.waitForLoadState('networkidle');

  console.log('After todo nav, URL:', page.url());

  const html = await page.content();
  console.log('Page contains batch-delete-button:', html.includes('batch-delete-button'));
  console.log('Page contains row-checkbox:', html.includes('row-checkbox'));
  console.log('Page contains select-all-checkbox:', html.includes('select-all-checkbox'));
  console.log('Page contains "尚無資料":', html.includes('尚無資料'));
  console.log('Page contains "404":', html.includes('404'));

  await page.screenshot({ path: 'test-results/rwd-audit/debug-todo-page.png', fullPage: true });

  await browser.close();
}

debug().catch(console.error);
