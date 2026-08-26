// 完整重現 user 操作：開瀏覽器到 /admin/crud/event/new 填表單 → submit
import { test } from '@playwright/test';

test('repro event new full UI flow', async ({ page }) => {
  // 1. 登入
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

  // 2. 攔截 POST /api/crud/event
  const requestListener = (request: any) => {
    if (request.url().endsWith('/api/crud/event') && request.method() === 'POST') {
      console.log('REQUEST POST URL:', request.url());
      console.log('REQUEST POST BODY:', request.postData());
    }
  };
  page.on('request', requestListener);

  const responseListener = async (response: any) => {
    if (response.url().endsWith('/api/crud/event') && response.request().method() === 'POST') {
      console.log('RESPONSE STATUS:', response.status());
      try {
        console.log('RESPONSE BODY:', await response.text());
      } catch (e: any) {
        console.log('RESPONSE BODY (failed to parse):', e.message);
      }
    }
  };
  page.on('response', responseListener);

  // 3. 開 new 頁面
  await page.goto('http://localhost:3000/admin/crud/event/new');
  await page.waitForLoadState('networkidle');

  // 4. 填表單
  await page.fill('input[name="title"]', 'E2E 重現活動');
  await page.fill('textarea[name="description"]', '這是 E2E 重現');
  await page.fill('input[name="startAt"]', '2026-12-01');
  await page.fill('input[name="endAt"]', '2026-12-02');
  await page.fill('input[name="location"]', '台北');

  // 5. submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3_000);

  // 截圖
  await page.screenshot({ path: 'tests/e2e/screenshots/repro-event-500-after-submit.png' });
  console.log('Current URL after submit:', page.url());
});