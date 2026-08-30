/**
 * TD-801 — E2E 守護測試：settings 設定 avatar URL → reload → sidebar 仍顯示 IMG
 *
 * 為什麼需要：
 * - Sprint 28-29 揭露 JWT session callback 漏帶 image 欄位的 bug
 * - 即使 API 正確儲存，sidebar 仍顯示 letter avatar
 * - 用戶 reload 後才發現 avatar 不見，UX 差
 *
 * Gate 4 E2E：寫守護測試防止 session callback 再漏欄位
 */

import { test, expect } from '@playwright/test';

const AVATAR_URL =
  'https://avatars.githubusercontent.com/u/519858?s=400&u=f3d57038ac55f9b7f441e8ad52d51290a2e750e2&v=4';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await page.click('button[type=submit]');
  await page.waitForURL(/^http:\/\/localhost:3000\/admin$/, { timeout: 10000 });
}

/**
 * 重置 avatar 為 null — 用 page.evaluate 在 browser context 內 fetch（自動帶 cookie）
 */
async function clearAvatar(page: import('@playwright/test').Page) {
  const status = await page.evaluate(async () => {
    const res = await fetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: '' }),
    });
    return res.status;
  });
  if (status !== 200) throw new Error(`clearAvatar failed: ${status}`);
}

test.describe('TD-801 — avatar reload 守護', () => {
  test('設定 avatar URL → reload → sidebar 顯示 IMG tag + 正確 src', async ({ page }) => {
    // 1. login + 確保初始 avatar 為 null
    await login(page);
    await clearAvatar(page);

    // 2. 去 settings 設 avatar
    await page.goto('/admin/settings');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid=settings-image-input]').fill(AVATAR_URL);
    await page.click('[data-testid=settings-profile-save]');
    await page.waitForTimeout(2000);

    // 3. 強制 reload（模擬用戶刷新頁面）
    await page.goto('/admin');
    await page.waitForTimeout(3000);

    // 4. sidebar 應該顯示 IMG（不是 letter fallback DIV）
    // 這驗證 JWT session callback 有帶 image 欄位
    const avatar = page.locator('[data-testid=user-avatar]').first();
    const tagName = await avatar.evaluate((el) => el.tagName);
    expect(tagName).toBe('IMG');

    // 5. 確認 src 是設定的 URL
    const src = await avatar.getAttribute('src');
    expect(src).toBe(AVATAR_URL);
  });
});