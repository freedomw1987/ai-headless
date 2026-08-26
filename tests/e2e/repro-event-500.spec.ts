// 暫存重現 script：event POST 500
import { test, expect } from '@playwright/test';

test('repro event new 500', async ({ page, request }) => {
  // 用 API 直接測，不需要開瀏覽器
  // 先登入
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

  // 直接送 POST 模擬表單提交（所有必填欄位）
  const result = await page.evaluate(async () => {
    const res = await fetch('/api/crud/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '測試',
        startAt: '2026-08-25T10:00:00Z',
        endAt: '2026-09-01T10:00:00Z',
        location: '台北',
        capacity: 10,
      }),
    });
    const text = await res.text();
    return { status: res.status, body: text };
  });

  console.log('POST result:', result);
  expect(result.status).not.toBe(500);
});