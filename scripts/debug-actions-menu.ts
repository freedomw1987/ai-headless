// Debug: 看 ⋯ 點下去後實際 DOM 有什麼
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

  await page.goto('http://localhost:3000/admin/crud/todo');
  await page.waitForTimeout(3000);

  const trigger = page.locator('[data-testid^="row-actions-"]').first();
  console.log('trigger count:', await trigger.count());

  await trigger.scrollIntoViewIfNeeded();
  await trigger.hover();
  await page.waitForTimeout(300);

  console.log('before click, trigger visible:', await trigger.isVisible());

  await trigger.click();
  await page.waitForTimeout(500);

  // 看 DOM 結構
  const menuItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role=menuitem]')).map((el) => ({
      tag: el.tagName,
      text: el.textContent?.substring(0, 50),
      testid: el.getAttribute('data-testid'),
      role: el.getAttribute('role'),
    }));
  });
  console.log('menu items:', JSON.stringify(menuItems, null, 2));

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
