// Debug: 為什麼 API 對但 page 錯？
// 假設：API 沒傳 filters，handler 不套用 filter → 直接回 DB 第 1 頁
// page.tsx 傳 filters，handler 在 findMany 之後才套用 → 當頁可能沒命中

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/admin/login`);
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/admin/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);

  // 1. 不帶 filter 看實際 amount 資料 + DB 順序
  const apiAll = await page.evaluate(async () => {
    const res = await fetch('/api/crud/order?page=1&pageSize=10');
    return await res.json();
  });
  console.log('=== API no filter (page=1, pageSize=10) ===');
  console.log('Items count:', apiAll.items?.length);
  console.log('Items:', apiAll.items?.map((i: { orderNumber: string; amount: number }) => ({ orderNumber: i.orderNumber, amount: i.amount })));

  // 2. 帶 filter 看 API 回什麼
  const apiFilter = await page.evaluate(async () => {
    const filters = JSON.stringify([{ field: 'amount', operator: 'gte', value: '2000' }]);
    const res = await fetch('/api/crud/order?page=1&pageSize=10&filters=' + encodeURIComponent(filters));
    return await res.json();
  });
  console.log('\n=== API with filters (page=1, pageSize=10) ===');
  console.log('Items count:', apiFilter.items?.length);
  console.log('Items:', apiFilter.items?.map((i: { orderNumber: string; amount: number }) => ({ orderNumber: i.orderNumber, amount: i.amount })));

  await browser.close();
}

main().catch((err) => {
  console.error('debug failed:', err);
  process.exit(1);
});