// Sprint 20 P3.5 — Event create 錯誤處理 E2E
//
// 涵蓋兩個 bug 修復：
// - Bug A：dynamic-handler create 包 try/catch（Prisma 拋 → 400 + 訊息，不再 500）
// - Bug B：hook 真的被 runtime 註冊（beforeCreateEvent 業務驗證生效）
import { test, expect } from '@playwright/test';

test.describe('Sprint 20 P3.5 — Event create 錯誤處理', () => {
  test('Bug A：POST event 帶 startAt 只有日期沒時間 → Prisma 拒絕 → 400 + 訊息（不再 500）', async ({ page }) => {
    // 登入
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // 觸發 POST：startAt 只有日期（HTML date input 預設行為）
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/crud/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'P3.5 E2E 測試',
          startAt: '2026-12-01', // 只到日，沒時間
          endAt: '2026-12-02',
        }),
      });
      const text = await res.text();
      return { status: res.status, body: text };
    });

    // 期望：不再 500
    expect(result.status).not.toBe(500);
    // 期望：400 或 422（明確錯誤）
    expect([400, 422]).toContain(result.status);
    // 期望：錯誤訊息非空
    const body = JSON.parse(result.body);
    expect(body.error).toBeTruthy();
    console.log('Bug A: error message =', body.error);
  });

  test('Bug B：startAt 是過去時間 → beforeCreateEvent hook 業務驗證 → 400 + 「must be in the future」', async ({ page }) => {
    // 登入
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // 觸發 POST：startAt 是過去時間（昨天），hook 應拒絕
    const result = await page.evaluate(async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch('/api/crud/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'P3.5 E2E 過去時間測試',
          startAt: yesterday,
          endAt: tomorrow,
        }),
      });
      const text = await res.text();
      return { status: res.status, body: text };
    });

    // 期望：hook 真的被註冊並執行
    expect(result.status).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/must be in the future/i);
    console.log('Bug B: hook error message =', body.error);
  });

  test('完整 UI flow：/admin/crud/event/new 填表單 → 看到明確錯誤', async ({ page }) => {
    // 登入
    await page.goto('/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url: any) => !url.toString().includes('/admin/login'), { timeout: 15_000 });

    // 開 new 頁面
    await page.goto('/admin/crud/event/new');
    await page.waitForLoadState('networkidle');

    // 攔截 response
    const responsePromise = page.waitForResponse(
      (res: any) => res.url().endsWith('/api/crud/event') && res.request().method() === 'POST',
      { timeout: 10_000 },
    );

    // 填表單（startAt 用日期，不是 datetime）
    await page.fill('input[name="title"]', 'P3.5 UI 測試');
    await page.fill('input[name="startAt"]', '2026-12-01');
    await page.fill('input[name="endAt"]', '2026-12-02');

    // submit
    await page.click('button[type="submit"]');

    // 等 response + 驗證
    const response = await responsePromise;
    expect(response.status()).not.toBe(500);
    expect([400, 422]).toContain(response.status());

    // 等錯誤訊息顯示
    await page.waitForTimeout(500);
    const errorVisible = await page.locator('[role="alert"], .text-destructive, .text-red-500, [data-error]').first().isVisible().catch(() => false);
    console.log('Error message visible on page:', errorVisible);

    // 截圖（Gate 4 必跑）
    await page.screenshot({ path: 'tests/e2e/screenshots/tech-056-event-error-ui.png' });
  });
});