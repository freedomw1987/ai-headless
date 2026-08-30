// Sprint 36 — Kanban drag-and-drop 視覺驗證
//
// 1. 切換到 kanban view
// 2. 拖一個 high priority card 到 low column
// 3. 截圖驗證
// 4. 確認 API 有被呼叫

import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on('response', async (resp) => {
    if (resp.url().includes('/api/crud/todo/') && resp.request().method() === 'PATCH') {
      console.log(`[PATCH] status=${resp.status()}, body=${resp.request().postData()?.substring(0, 100)}`);
    }
  });

  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });

  // 先 reset 一個 todo 的 priority 為 high 以便測試拖到 low
  // 找一個 medium 的 todo
  await page.goto('http://localhost:3000/admin/crud/todo?view=kanban');
  await page.waitForTimeout(3000);

  // 截圖初始狀態
  await page.screenshot({ path: 'test-results/rwd-audit/sprint-36-kanban-initial.png', fullPage: true });
  console.log('saved initial');

  // 找一個 medium card 拖到 low column
  const mediumCard = page.locator('[data-testid^="kanban-card-"]').first();
  const cardTestId = await mediumCard.getAttribute('data-testid');
  console.log('card to drag:', cardTestId);

  const lowColumn = page.locator('[data-testid="kanban-column-low"]');

  // HTML5 drag simulation
  await mediumCard.hover();
  await page.mouse.down();
  await lowColumn.hover();
  await page.mouse.up();

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/rwd-audit/sprint-36-kanban-after-drop.png', fullPage: true });
  console.log('saved after-drop');

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });