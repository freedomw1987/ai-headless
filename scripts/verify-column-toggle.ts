// Sprint C3 — 真實瀏覽器驗證 ColumnTogglePopover
//
// 流程：
// 1. 登入 admin
// 2. 訪問 /admin/crud/todo
// 3. 確認「欄位」按鈕可見
// 4. 點擊按鈕 → Popover 開啟
// 5. 取消勾選「已完成」
// 6. 驗證「已完成」欄位從 table 消失
// 7. 驗證 localStorage 已存
// 8. 重整頁面 → 偏好保留
// 9. 截圖驗證

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // 1. 登入
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input#email', 'admin@ai-headless.local');
  await page.fill('input#password', 'admin123');
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/admin/login'), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);

  // 清掉先前的 prefs (乾淨起點)
  await page.evaluate(() => localStorage.clear());

  // 2. 訪問 todo
  await page.goto(`${BASE}/admin/crud/todo?pageSize=20`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // 3. 確認「欄位」按鈕存在
  const trigger = page.locator('[data-testid=column-toggle-trigger]');
  const triggerVisible = await trigger.isVisible();
  console.log('ColumnTogglePopover trigger visible:', triggerVisible);

  // 截圖：初始狀態
  await page.screenshot({ path: 'test-results/rwd-audit/column-toggle-initial.png' });

  // 4. 點擊按鈕 → Popover 開啟
  await trigger.click();
  await page.waitForTimeout(500);

  const content = page.locator('[data-testid=column-toggle-content]');
  const contentVisible = await content.isVisible();
  console.log('Popover content visible after click:', contentVisible);

  // 截圖：popover 開啟
  await page.screenshot({ path: 'test-results/rwd-audit/column-toggle-popover-open.png' });

  // 5. 數一下可見的 checkbox
  const checkboxes = await page.locator('[data-testid=column-toggle-content] [role=checkbox]').count();
  console.log('Column checkboxes count:', checkboxes);

  // 找「已完成」 checkbox
  const completedCheckbox = page.locator('[data-testid=column-toggle-content] [aria-label=已完成]');
  const completedCount = await completedCheckbox.count();
  console.log('已完成 checkbox found:', completedCount);

  // 6. 取消勾選「已完成」
  if (completedCount > 0) {
    await completedCheckbox.click();
    await page.waitForTimeout(500);

    // 7. 驗證 localStorage 已存
    const stored = await page.evaluate(() => localStorage.getItem('crud-list-columns:todo'));
    console.log('localStorage after toggle:', stored);

    // 關掉 popover
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 截圖：「已完成」欄位已從 table 消失
    await page.screenshot({ path: 'test-results/rwd-audit/column-toggle-after-hide.png' });
  }

  // 8. 重整頁面 → 偏好保留
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const storedAfterReload = await page.evaluate(() => localStorage.getItem('crud-list-columns:todo'));
  console.log('localStorage after reload:', storedAfterReload);

  await page.screenshot({ path: 'test-results/rwd-audit/column-toggle-after-reload.png' });

  // 9. 測試「重設」按鈕
  await page.locator('[data-testid=column-toggle-trigger]').click();
  await page.waitForTimeout(500);
  await page.locator('[data-testid=reset-button]').click();
  await page.waitForTimeout(500);

  const storedAfterReset = await page.evaluate(() => localStorage.getItem('crud-list-columns:todo'));
  console.log('localStorage after reset (should be null):', storedAfterReset);

  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test-results/rwd-audit/column-toggle-after-reset.png' });

  // 寫 JSON 結果
  const result = {
    triggerVisible,
    contentVisible,
    checkboxes,
    completedCount,
    localStorageAfterToggle: await page.evaluate(() => localStorage.getItem('crud-list-columns:todo')),
    localStorageAfterReload: storedAfterReload,
    localStorageAfterReset: storedAfterReset,
  };
  console.log('Final result:', JSON.stringify(result, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error('verify-column-toggle failed:', err);
  process.exit(1);
});